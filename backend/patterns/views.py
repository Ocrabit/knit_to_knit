import io
import os
from importlib.metadata import metadata

import numpy as np
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Pattern, SeparatedSweater
from .serializers import GetPatternSerializer, SeparatedSweaterSerializer
from .tool_functions.services import generate_sweater_pattern
import logging
# Aws File Check Import
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger('patterns')


def custom_exist_check(file_path):
    """
    Check if a file exists in storage (either local filesystem or S3).
    :param file_path: The path to the file in storage.
    :return: True if the file exists, False otherwise.
    """
    try:
        # Use Django's default_storage which handles both local and S3
        exists = default_storage.exists(file_path)
        if exists:
            logger.info(f"File exists in storage: {file_path}")
        else:
            logger.error(f"File not found in storage: {file_path}")
        return exists
    except Exception as e:
        logger.error(f"Error checking file existence: {e}")
        return False


# Create your views here.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_patterns(request):
    user = request.user
    patterns = Pattern.objects.filter(author=user)
    serializer = GetPatternSerializer(patterns, many=True)
    return Response(serializer.data)


# Soon add a variable approach to decide the pattern_type
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compile_pattern(request):
    """
    View to compile and create a new pattern based on the posted data.
    """
    print('Request', request, flush=True)
    session_key = request.COOKIES.get('sessionid', None)
    if not session_key:
        return Response({'error': 'No session key found'}, status=403)

    logger.info("Received request data:", request.data)

    # Determine pattern type and redirect to the appropriate serializer
    pattern_type = request.data.get("pattern_type", None)
    if not pattern_type:
        return Response({"error": "Pattern type is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Determine serializer class
    if pattern_type == "SeparatedSweater":
        serializer_class = SeparatedSweaterSerializer
    else:
        logger.error("Unsupported pattern type: %s", pattern_type)
        return Response({"error": f"Unsupported pattern type: {pattern_type}"}, status=status.HTTP_400_BAD_REQUEST)

    # Use the appropriate serializer
    serializer = serializer_class(data=request.data, context={"request": request})
    if not serializer.is_valid():
        logger.error("Validation failed with errors: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    logger.info("Serializer validation passed.")
    if serializer.is_valid():
        # Wrap in transaction to delete partial data if on failure
        with transaction.atomic():
            try:
                # Save the pattern object
                separated_sweater = serializer.save(author=request.user)
                logger.info("Pattern object saved successfully.")

                # Perform calculations and generate arrays
                try:
                    front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array = generate_sweater_pattern(separated_sweater)
                    logger.info("Sweater pattern generated successfully.")
                except Exception as e:
                    logger.error("Error generating sweater pattern: %s", str(e))
                    return Response({"error": "Failed to generate sweater pattern.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Create an empty color_map
                color_map = np.array([], dtype='U7')

                # Save arrays and color_map to an .npz file
                file_buffer = io.BytesIO()
                np.savez(file_buffer,
                         front_torso=front_torso_array,
                         back_torso=back_torso_array,
                         left_sleeve=left_sleeve_array,
                         right_sleeve=right_sleeve_array,
                         color_map=color_map)
                file_buffer.seek(0)

                storage_backend = 'S3' if settings.STAGE != 'local' else 'local storage'
                logger.info("Saving file to %s", storage_backend)
                separated_sweater.sweater_file.save('pattern_pieces.npz', ContentFile(file_buffer.read()))
                logger.info("File successfully saved to %s.", storage_backend)

                separated_sweater.save()
                logger.info("Pattern file saved successfully to %s.", storage_backend)

                return Response({
                    "message": "Pattern created successfully",
                    "pattern": serializer.data,
                    "pattern_id": separated_sweater.id
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                logger.error("Unexpected error during pattern creation: %s", str(e))
                return Response({"error": "An unexpected error occurred.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Returns information from the view_mode of a section
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pattern_mode_data(request, pattern_id):
    file_name = 'pattern_pieces.npz'
    view_mode = request.query_params.get('view_mode')
    section_key = request.query_params.get('section')

    # Construct the file path
    file_path = f'patterns/pattern_{pattern_id}/{file_name}'

    if not custom_exist_check(file_path):
        logger.error('Error: File does not exist at the specified path in storage.')
        return Response({'error': f'File not found: {file_path}'}, status=404)

    # Define a mapping for view_mode to index in the tuple
    view_mode_to_index = {
        'shape': 0,
        'color': 1,
        'stitch_type': 2,
    }

    if view_mode not in view_mode_to_index:
        return Response({'error': f"Invalid view mode '{view_mode}'"}, status=400)

    try:
        # Load the .npz file from storage
        with default_storage.open(file_path, 'rb') as file:
            npz_data = np.load(file, allow_pickle=True)

            if section_key not in npz_data:
                return Response({'error': f"Invalid section '{section_key}' in file."}, status=400)

            # Extract the section data
            section_data = npz_data[section_key]
            index = view_mode_to_index[view_mode]

            # Process the data for the requested view mode
            grid_data = [[int(cell[index]) for cell in row] for row in section_data]

            # Add color_map if view_mode is 'color'
            response_data = {f'{view_mode}': grid_data}
            if view_mode == 'color' and 'color_map' in npz_data:
                response_data['color_map'] = npz_data.get('color_map', {}).tolist()
                logger.info('Appended color_map to response:  %s', response_data['color_map'])

            logger.info('Extracted grid_data:  %s', grid_data)
            return Response({'mode_data': response_data})

    except Exception as e:
        logger.error('Error processing pattern data:  %s', str(e))
        return Response({'error': str(e)}, status=500)


# This returns all grid information for a section
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pattern_file_data(request, pattern_id):
    file_name = 'pattern_pieces.npz'
    section = request.query_params.get('section')

    # Construct the file path
    file_path = f'patterns/pattern_{pattern_id}/{file_name}'
    logger.info('file path is %s', file_path)

    if not custom_exist_check(file_path):
        logger.error('Error: File does not exist at the specified path in storage.')
        return Response({'error': f'File not found: {file_path}'}, status=404)

    try:
        # Load the .npz file from storage
        with default_storage.open(file_path, 'rb') as file:
            npz_data = np.load(file, allow_pickle=True)

            if section not in npz_data:
                return Response({'error': f"Invalid section '{section}' in file."}, status=400)

            # Extract the specified section
            section_data = npz_data[section]

            response_data = {
                'shape': [],
                'color': [],
                'stitch_type': [],
                'color_map': npz_data.get('color_map', {}).tolist()
            }

            # Extract shape, color, and stitch_type from the data
            for row in section_data:
                shape_row = []
                color_row = []
                stitch_type_row = []

                for cell in row:
                    shape_row.append(int(cell[0]))  # Assuming the first index represents shape
                    color_row.append(int(cell[1]))  # Assuming the second index represents color
                    stitch_type_row.append(int(cell[2]))  # Assuming the third index represents stitch type

                response_data['shape'].append(shape_row)
                response_data['color'].append(color_row)
                response_data['stitch_type'].append(stitch_type_row)

            # Add any saved color_maps
            logger.info('Extracted grid_data:  %s', response_data)
            return Response({'file_data': response_data})

    except Exception as e:
        logger.error(f"Error processing the .npz file: {e}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_pattern_changes(request, pattern_id):
    logger.info('Save Pattern Changes View is called')
    file_name = 'pattern_pieces.npz'
    section = request.data.get('section')
    view_mode = request.data.get('view_mode')
    new_grid_data = request.data.get('changed_data')
    color_map = request.data.get('color_map')

    if not new_grid_data:
        logger.info(f'No Changes To Save for pattern_id={pattern_id}, section={section}, view_mode={view_mode}')
        return Response({'message': 'No Changes To Save'}, status=204)

    file_path = f'patterns/pattern_{pattern_id}/{file_name}'
    logger.info('file path is: %s', file_path)

    try:
        # Convert the received grid data to a NumPy array
        new_grid_array = np.array(new_grid_data)
        logger.info('new grid converted: %s', new_grid_array)

        # Load the .npz file from storage
        with default_storage.open(file_path, 'rb') as file:
            npz_data = np.load(file, allow_pickle=True)

            # Extract existing data
            file_content = {key: npz_data[key] for key in npz_data}
            logger.info('Loaded npz file data: %s', file_content.keys())

        # Ensure the section exists
        if section not in file_content:
            return Response({'error': f"Section '{section}' not found in the file."}, status=400)

        # Update the specific section's data
        file_content[section][view_mode] = new_grid_array
        logger.info(f"Updated {view_mode} data for section {section}.")

        if view_mode == 'color' and color_map:
            file_content['color_map'] = color_map
            logger.info(f"Updated color_map data for section {section}. Color_Map consists of: %s", color_map)

        # Save the updated content back to the .npz file in storage
        with default_storage.open(file_path, 'wb') as file:
            np.savez(file, **file_content)
        logger.info('File successfully updated.')

        return Response(status=200)
    except Exception as e:
        logger.error('Error during file update: %s', str(e))
        return Response({'error': str(e)}, status=500)


# Very Broken || Very Depreciated
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def recalculate_pattern(request, pattern_id):
#     """
#     View to edit the pattern's torso or sleeve projections and recalculate the .npy files.
#     """
#     try:
#         # Retrieve the pattern instance
#         pattern = Pattern.objects.get(id=pattern_id, author=request.user)
#
#         # Recalculate the pattern arrays
#         front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array = generate_sweater_pattern(pattern)
#
#         pieces = {
#             'front_torso': front_torso_array,
#             'back_torso': back_torso_array,
#             'left_sleeve': left_sleeve_array,
#             'right_sleeve': right_sleeve_array,
#         }
#
#         # Overwrite the existing .npy files
#         for piece_type, array in pieces.items():
#             # Save the array to a ContentFile
#             file_buffer = io.BytesIO()
#             np.save(file_buffer, array, allow_pickle=False)
#             file_buffer.seek(0)
#             npy_filedata = ContentFile(file_buffer.read(), name=f'{piece_type}.npy')
#
#             # Update or create the SweaterPiece instance
#             piece_instance, created = SweaterPiece.objects.update_or_create(
#                 sweater=pattern,
#                 piece_type=piece_type,
#                 defaults={'sweater_file': npy_filedata}
#             )
#
#         return Response({"message": "Pattern recalculated successfully"}, status=status.HTTP_200_OK)
#
#     except Pattern.DoesNotExist:
#         return Response({"error": "Pattern not found or unauthorized access"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
