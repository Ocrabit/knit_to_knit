# CalculatePattern.py
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from ...models import Pattern
from ...views import recalculate_pattern
from rest_framework.test import APIRequestFactory, force_authenticate


class Command(BaseCommand):
    help = 'Recalculates the pattern based on a given pattern ID and user ID.'

    def add_arguments(self, parser):
        # Add arguments for user ID and pattern ID
        parser.add_argument('user_id', type=int, help='ID of the user who owns the pattern')
        parser.add_argument('pattern_id', type=int, help='ID of the pattern to recalculate')

    def handle(self, *args, **options):
        user_id = options['user_id']
        pattern_id = options['pattern_id']

        try:
            # Get the user and pattern based on provided IDs
            user = User.objects.get(id=user_id)
            pattern = Pattern.objects.get(id=pattern_id)

            self.stdout.write(f"Recalculating pattern: {pattern}")

            # Create a request using the RequestFactory
            factory = APIRequestFactory()
            request = factory.post(f'/api/pattern-view/{pattern_id}/')

            # Authenticate the request with the user
            force_authenticate(request, user=user)

            # Call the view function
            response = recalculate_pattern(request, pattern_id=pattern_id)

            # Check the response status code
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS("Pattern recalculated successfully."))
            else:
                self.stdout.write(self.style.ERROR(f"Error recalculating pattern: {response.data}"))

        except User.DoesNotExist:
            raise CommandError(f"User with ID {user_id} does not exist.")
        except Pattern.DoesNotExist:
            raise CommandError(f"Pattern with ID {pattern_id} does not exist.")
        except Exception as e:
            raise CommandError(f"An error occurred: {str(e)}")
