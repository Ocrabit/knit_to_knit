from django.urls import path
from .views import user_patterns

urlpatterns = [
    path('user-patterns/', user_patterns, name='user_patterns'),
]