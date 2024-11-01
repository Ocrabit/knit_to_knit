import io
import os

import numpy as np
from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Pattern, Sweater, SweaterPiece
from .serializers import GetPatternSerializer, PatternSerializer
from .tool_functions.services import generate_sweater_pattern


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
    print("Received request data:", request.data, flush=True)
    serializer = PatternSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        print("Serializer is valid")
        pattern = serializer.save(author=request.user)

        # Perform calculations and generate arrays
        front_torso_array, back_torso_array, left_sleeve_array, right_sleeve_array = generate_sweater_pattern(
            pattern)

        pieces = {
            'front_torso': front_torso_array,
            'back_torso': back_torso_array,
            'left_sleeve': left_sleeve_array,
            'right_sleeve': right_sleeve_array,
        }

        for piece_type, array in pieces.items():
            # Save the array to a ContentFile
            file_buffer = io.BytesIO()
            np.save(file_buffer, array, allow_pickle=False)
            file_buffer.seek(0)
            npy_filedata = ContentFile(file_buffer.read(), name=f'{piece_type}.npy')

            # Create the SweaterPiece instance
            piece_instance = SweaterPiece.objects.create(
                sweater=pattern,
                piece_type=piece_type,
                sweater_file=npy_filedata,
            )

        return Response({"message": "Pattern created successfully", "pattern": serializer.data, "pattern_id": pattern.id}, status=status.HTTP_201_CREATED)

    print("Validation failed. Errors:", serializer.errors, flush=True)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pattern_data(request, pattern_id):
    file_name = request.query_params.get('file_name')
    view_mode = request.query_params.get('view_mode')
    #print('file_name', file_name, flush=True)
    #print('view_mode', view_mode, flush=True)
    #print('pattern_id', pattern_id, flush=True)

    # Construct the file path
    file_path = os.path.join(settings.MEDIA_ROOT, f'patterns/pattern_{pattern_id}/{file_name}')
    #print('file_path', file_path, flush=True)

    if not os.path.exists(file_path):
        print('Error: File does not exist at the specified path.', flush=True)
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
        # Load the .npy file as a 2D array
        npy_data = np.load(file_path, allow_pickle=True)
        #print('Loaded npy_data:', npy_data, flush=True)

        # Extract the relevant index based on view_mode
        index = view_mode_to_index[view_mode]

        # Extract the grid data by iterating over the 2D array and picking the relevant component
        grid_data = [[int(cell[index]) for cell in row] for row in npy_data]
        #print('Extracted grid_data:', grid_data, flush=True)

        return Response({'grid_data': grid_data})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_pattern_changes(request, pattern_id):
    file_name = request.data.get('file_name')
    view_mode = request.data.get('view_mode')
    changes = request.data.get('changes')

    file_path = os.path.join(settings.MEDIA_ROOT, f'patterns/pattern_{pattern_id}/{file_name}')

    try:
        # Load the .npy file
        npy_data = np.load(file_path, allow_pickle=True).item()
        grid_data = npy_data[view_mode]

        # Apply the changes
        for index_str, value in changes.items():
            index = int(index_str)
            # Calculate row and column from index
            rows, cols = grid_data.shape
            row = index // cols
            col = index % cols
            grid_data[row][col] = value

        # Save the updated .npy file
        npy_data[view_mode] = grid_data
        np.save(file_path, npy_data)

        return Response({'status': 'success'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)



# Replace this soon.
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
