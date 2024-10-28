import io

import numpy as np
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

        return Response({"message": "Pattern created successfully", "pattern": serializer.data}, status=status.HTTP_201_CREATED)

    print("Validation failed. Errors:", serializer.errors, flush=True)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pattern_view(request):
    pass
