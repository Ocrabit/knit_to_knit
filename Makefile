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

connect-website:
	docker exec -it knit_to_knit_v2-website-1 /bin/bash

connect-postgres:
	docker exec -it knit_to_knit_v2-postgres-1 psql -U postgres

remove_unamed_volumes:
	docker volume ls -q | grep -E '^[0-9a-f]{64}$' | xargs -r docker volume rm

copy_prod_dist:
	scp -i KnitToKnitPair.pem -r /Users/marcocassar/PycharmProjects/knitting_project_versions/knit_to_knit_v2/frontend/dist/* ec2-user@18.119.122.236:/home/ec2-user/backend/staticfiles/react_dist/
