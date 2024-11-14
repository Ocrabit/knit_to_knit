from django.urls import path
from .views import user_patterns, compile_pattern, save_pattern_changes, get_pattern_mode_data, \
    get_pattern_file_data

urlpatterns = [
    path('api/user-patterns/', user_patterns, name='user_patterns'),
    path('api/pattern-compile/', compile_pattern, name='compile-pattern'),
    path('patterns/<int:pattern_id>/file', get_pattern_file_data, name='get-pattern-file-data'),
    path('patterns/<int:pattern_id>/file-mode', get_pattern_mode_data, name='get-pattern-mode-data'),
    path('patterns/<int:pattern_id>/save_changes', save_pattern_changes, name='save-pattern-changes'),
]
