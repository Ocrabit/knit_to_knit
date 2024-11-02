# RecalculateUserPatterns.py
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from ...models import Pattern
from ...views import recalculate_pattern
from rest_framework.test import APIRequestFactory, force_authenticate


class Command(BaseCommand):
    help = 'Recalculates every pattern in system.'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of user to authenticate requests with.')

    def handle(self, *args, **options):
        username = options['username']
        try:
            # Get the user and pattern based on provided IDs
            user = User.objects.get(username=username)
            patterns = Pattern.objects.filter(author=user)

            for pattern in patterns:
                self.stdout.write(f"Recalculating pattern: {pattern}")

                # Create a request using the RequestFactory
                factory = APIRequestFactory()
                request = factory.post(f'/api/pattern-view/{pattern.id}/')

                # Authenticate the request with the user
                force_authenticate(request, user=user)

                # Call the view function
                response = recalculate_pattern(request, pattern_id=pattern.id)

                # Check the response status code
                if response.status_code == 200:
                    self.stdout.write(self.style.SUCCESS(f'Pattern {pattern.id} recalculated successfully.'))
                else:
                    self.stdout.write(self.style.ERROR(f"Error recalculating pattern {pattern.id}: {response.data}"))

        except User.DoesNotExist:
            raise CommandError(f"User {username} does not exist.")
        except Exception as e:
            raise CommandError(f"An error occurred: {str(e)}")
