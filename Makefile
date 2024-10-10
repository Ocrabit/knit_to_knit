build:
	docker build --force-rm $(options) -t knit-to-knit-dock:latest .


build-prod:
	$(MAKE) build options="--target production"

compose-build:
	docker-compose up --build

compose-start:
	docker-compose up --remove-orphans $(options)

compose-stop:
	docker-compose down --remove-orphans $(options)

compose-manage.py:
	docker-compose run --rm $(options) website python manage.py $(cmd)

docker-prune-all:
	docker system prune -a --volumes