# authentication/urls.py
from django.urls import path
from .views import user_profile, api_login, api_logout

urlpatterns = [
    path('login/', api_login, name='login'),
    path('logout/', api_logout, name='logout'),
    path('user/me/', user_profile, name='user_profile'),
]

