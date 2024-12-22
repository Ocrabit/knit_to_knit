# authentication/views.py
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    #print("Login Headers:", request.headers, flush=True)
    #print("Cookies:", request.COOKIES, flush=True)
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return JsonResponse({'message': 'Login successful', 'user': {'username': user.username}})
    else:
        return JsonResponse({'error': 'Invalid credentials'}, status=400)


@api_view(['POST'])
def api_logout(request):
    #print("Logout Headers:", request.headers, flush=True)
    #print("Cookies:", request.COOKIES, flush=True)
    logout(request)
    return JsonResponse({'message': 'Logout successful'}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)
