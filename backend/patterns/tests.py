from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate

from .models import Pattern
from .views import recalculate_pattern

User = get_user_model()

# Useless right now
class TestRecalculatePattern(TestCase):
    def setUp(self):
        # Create a test user and pattern (assumes the `Pattern` model and other dependencies exist)
        self.user, created = User.objects.get_or_create(username='admin', defaults={'password': '123'})
        self.factory = RequestFactory()
        self.pattern = Pattern.objects.get(id=12)
        print(self.pattern)

    def test_recalculate_pattern(self):
        # Simulate a POST request with the pattern ID
        request = self.factory.post(f'/api/pattern-view/{self.pattern.id}/')

        force_authenticate(request, user=self.user)

        # Call view function and pass pattern ID
        response = recalculate_pattern(request, pattern_id=self.pattern.id)

        # Assert the response status code is 200
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], "Pattern recalculated successfully")
