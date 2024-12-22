import io
import os
from importlib.metadata import metadata

import numpy as np
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Pattern, SeparatedSweater
from .serializers import GetPatternSerializer, SeparatedSweaterSerializer
from .tool_functions.services import generate_sweater_pattern
import logging

logger = logging.getLogger('patterns')


# Create your views here.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_patterns(request):
    user = request.user
    patterns = Pattern.objects.filter(author=user)
    serializer = GetPatternSerializer(patterns, many=True)
    return Response(serializer.data)


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

    if pattern_type == "SeparatedSweater":
        serializer_class = SeparatedSweaterSerializer
    else:
        return Response({"error": f"Unsupported pattern type: {pattern_type}"}, status=status.HTTP_400_BAD_REQUEST)

    # Use the appropriate serializer
    serializer = serializer_class(data=request.data, context={"request": request})

    if serializer.is_valid():
        logger.info("Serializer is valid")
        # Wrap in transaction to delete partial data if on failure
        with transaction.atomic():
            try:
                # Save the pattern object
                separated_sweater = serializer.save(author=request.user)

                # Perform calculations and generate arrays
                try:
                    front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array = generate_sweater_pattern(separated_sweater)
                except Exception as e:
                    logger.error("Error generating sweater pattern:", str(e))
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
                separated_sweater.sweater_file.save('pattern_pieces.npz', ContentFile(file_buffer.read()))
                separated_sweater.save()

                return Response({
                    "message": "Pattern created successfully",
                    "pattern": serializer.data,
                    "pattern_id": separated_sweater.id
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                logger.error("Unexpected error during pattern creation:", str(e))
                return Response({"error": "An unexpected error occurred.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Log validation errors
    logger.error("Validation failed. Errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Returns information from the view_mode of a section
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pattern_mode_data(request, pattern_id):
    file_name = 'pattern_pieces.npz'
    view_mode = request.query_params.get('view_mode')
    section_key = request.query_params.get('section')

    # Construct the file path
    file_path = os.path.join(settings.MEDIA_ROOT, f'patterns/pattern_{pattern_id}/{file_name}')

    if not os.path.exists(file_path):
        logger.error('Error: File does not exist at the specified path.')
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
        # Load the .npz file
        with np.load(file_path, allow_pickle=True) as npz_data:
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
    file_path = os.path.join(settings.MEDIA_ROOT, f'patterns/pattern_{pattern_id}/{file_name}')
    logger.info('file path is %s', file_path)

    if not os.path.exists(file_path):
        logger.error('Error: File does not exist at the specified path.')
        return Response({'error': f'File not found: {file_path}'}, status=404)

    try:
        # Load the .npz file
        with np.load(file_path, allow_pickle=True) as npz_data:
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

    file_path = os.path.join(settings.MEDIA_ROOT, f'patterns/pattern_{pattern_id}/{file_name}')
    logger.info('file path is: %s', file_path)

    try:
        # Convert the received grid data to a NumPy array
        new_grid_array = np.array(new_grid_data)
        logger.info('new grid converted: %s', new_grid_array)

        # Load the existing .npz file
        with np.load(file_path, allow_pickle=True) as npz_data:
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

        # Save the updated content back to the .npz file
        np.savez(file_path, **file_content)
        logger.info('File successfully updated.')

        return Response(status=200)
    except Exception as e:
        logger.error('Error during file update: %s', str(e))
        return Response({'error': str(e)}, status=500)


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def save_pattern_changes(request, pattern_id):
#     logger.info('Save Pattern Changes View is called')
#     file_name = 'pattern_pieces.npz'
#     section = request.data.get('section')
#     view_mode = request.data.get('view_mode')
#     new_grid_data = request.data.get('changed_data')
#     color_map = request.data.get('color_map')
#
#     if not new_grid_data:
#         logger.error('no grid data')
#         return Response({'error': 'No grid data provided'}, status=400)
#
#     file_path = os.path.join(settings.MEDIA_ROOT, f'patterns/pattern_{pattern_id}/{file_name}')
#     logger.info('File path is: %s', file_path)
#
#     # Check if the file exists
#     if not os.path.exists(file_path):
#         return Response({'error': 'Pattern file not found.'}, status=404)
#
#     try:
#         # Convert the received grid data to a NumPy array
#         new_grid_array = np.array(new_grid_data)
#         logger.info('New grid converted: %s', new_grid_array)
#
#         # Load the existing .npz file
#         with np.load(file_path, allow_pickle=True) as npz_data:
#             # Extract existing data
#             file_content = dict(npz_data)
#             logger.info('Loaded npz file data: %s', file_content.keys())
#
#         # Ensure the section exists
#         if section not in file_content:
#             return Response({'error': f"Section '{section}' not found in the file."}, status=400)
#
#         # Retrieve the section data
#         section_array = file_content[section]
#         logger.info('Section Array: %s', section_array)
#         if isinstance(section_array, np.ndarray) and section_array.dtype == object:
#             section_data = section_array.item()
#             logger.info('Section data extracted as dictionary.')
#         else:
#             section_data = section_array
#
#         # Ensure section_data is a dictionary
#         if not isinstance(section_data, dict):
#             logger.error('Invalid section data format: %s', type(section_data))
#             return Response({'error': 'Invalid section data format.'}, status=500)
#
#         # Update the grid data for the view mode
#         section_data[view_mode] = new_grid_array
#         logger.info("Updated %s data for section %s.", view_mode, section)
#
#         # If view_mode is 'color', also update the color_map
#         if view_mode == 'color' and color_map:
#             # Validate color_map data
#             id_to_color_array = color_map.get('idToColorArray')
#
#             if not id_to_color_array:
#                 return Response({'error': 'Invalid color map data provided.'}, status=400)
#
#             # Save color mappings to the section data
#             section_data['idToColorArray'] = id_to_color_array
#             logger.info('Color map data saved.')
#
#         # Save the updated section data back to the file content
#         file_content[section] = section_data
#
#         # Save the updated content back to the .npz file
#         np.savez(file_path, **file_content)
#         logger.info('File successfully updated.')
#
#         return Response({'status': 'success'})
#     except Exception as e:
#         logger.error('Error during file update:  %s', str(e))
#         return Response({'error': str(e)}, status=500)


# Very Broken
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recalculate_pattern(request, pattern_id):
    """
    View to edit the pattern's torso or sleeve projections and recalculate the .npy files.
    """
    try:
        # Retrieve the pattern instance
        pattern = Pattern.objects.get(id=pattern_id, author=request.user)

        # Recalculate the pattern arrays
        front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array = generate_sweater_pattern(pattern)

        pieces = {
            'front_torso': front_torso_array,
            'back_torso': back_torso_array,
            'left_sleeve': left_sleeve_array,
            'right_sleeve': right_sleeve_array,
        }

        # Overwrite the existing .npy files
        for piece_type, array in pieces.items():
            # Save the array to a ContentFile
            file_buffer = io.BytesIO()
            np.save(file_buffer, array, allow_pickle=False)
            file_buffer.seek(0)
            npy_filedata = ContentFile(file_buffer.read(), name=f'{piece_type}.npy')

            # Update or create the SweaterPiece instance
            piece_instance, created = SweaterPiece.objects.update_or_create(
                sweater=pattern,
                piece_type=piece_type,
                defaults={'sweater_file': npy_filedata}
            )

        return Response({"message": "Pattern recalculated successfully"}, status=status.HTTP_200_OK)

    except Pattern.DoesNotExist:
        return Response({"error": "Pattern not found or unauthorized access"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
