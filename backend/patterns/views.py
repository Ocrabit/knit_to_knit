from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Pattern
from .serializers import PatternSerializer

# Create your views here.
@api_view(['GET'])
def user_patterns(request):
    user = request.user
    patterns = Pattern.objects.filter(author=user)
    serializer = PatternSerializer(patterns, many=True)
    return Response(serializer.data)