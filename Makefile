include .env
export

# Local development commands
up:
	docker-compose up -d

down:
	docker-compose down

rebuild:
	rm -rf backend/static/react_dist
	docker-compose down
	docker-compose build --no-cache frontend-build
	docker-compose up -d

logs:
	docker-compose logs -f

# ec2 quick connect
ec2:
	ssh -i $(PEM_FILE) ec2-user@$(EC2_IP)

scp-download:
	scp -i $(PEM_FILE) ec2-user@$(EC2_IP):$(SRC) $(DEST)

scp-upload:
	scp -i $(PEM_FILE) $(SRC) ec2-user@$(EC2_IP):$(DEST)

# Django management commands
manage:
	docker-compose run --rm website python manage.py $(cmd)

# Clean up
prune:
	docker system prune -a --volumes

# Shell access
shell-django:
	docker-compose exec website /bin/bash

shell-db:
	docker-compose exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)
