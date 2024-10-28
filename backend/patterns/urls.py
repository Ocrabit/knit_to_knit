from django.urls import path
from .views import user_patterns, compile_pattern

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('user-patterns/', user_patterns, name='user_patterns'),
    path('pattern-compile/', compile_pattern, name='compile-pattern'),
]
