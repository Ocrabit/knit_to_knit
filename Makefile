# Local development commands
up:
	docker compose up -d

down:
	docker compose down

rebuild:
	docker compose up -d --build

logs:
	docker compose logs -f

# Django management commands
manage:
	docker compose run --rm website python manage.py $(cmd)

# Clean up
prune:
	docker system prune -a --volumes

# Shell access
shell-django:
	docker compose exec website /bin/bash

shell-db:
	docker compose exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)
