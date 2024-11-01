from django.urls import path
from .views import user_patterns, compile_pattern, get_pattern_data, save_pattern_changes


urlpatterns = [
    path('api/user-patterns/', user_patterns, name='user_patterns'),
    path('api/pattern-compile/', compile_pattern, name='compile-pattern'),
    path('patterns/<int:pattern_id>/file', get_pattern_data, name='get-pattern-data'),
    path('patterns/<int:pattern_id>/save_changes', save_pattern_changes, name='save-pattern-changes'),
]
