from django.test import TestCase

# Create your tests here.
from django.test import RequestFactory
from django.contrib.auth.models import User
from .views import pattern_view
from .models import Pattern

user = User.objects.get(username='admin')

# simulate request
factory = RequestFactory()
request = factory.get('/api/pattern-view/', {'pattern_id': '1'})
request.user = user

# Call view function
response = pattern_view(request)