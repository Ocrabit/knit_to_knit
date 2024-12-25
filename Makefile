compose-start:
	docker-compose up --remove-orphans $(options)

compose-stop:
	docker-compose down --remove-orphans $(options)

compose-manage:
	docker-compose run --rm $(options) website python manage.py $(cmd)

docker-prune-all:
	docker system prune -a --volumes

connect-website:
	docker exec -it knit_to_knit_v2-website-1 /bin/bash

connect-postgres:
	docker exec -it knit_to_knit_v2-postgres-1 psql -U postgres

remove_unamed_volumes:
	docker volume ls -q | grep -E '^[0-9a-f]{64}$' | xargs -r docker volume rm

push-react:
	scp -i KnitToKnitPair.pem -r /Users/marcocassar/PycharmProjects/knitting_project_versions/knit_to_knit_v2/frontend/dist/* ec2-user@18.119.122.236:/home/ec2-user/backend/staticfiles/react_dist/

connect-aws:
	ssh -i /Users/marcocassar/PycharmProjects/knitting_project_versions/knit_to_knit_v2/KnitToKnitPair.pem ec2-user@18.119.122.236

push-docker-compose.yml:
	scp -i KnitToKnitPair.pem -r /Users/marcocassar/PycharmProjects/knitting_project_versions/knit_to_knit_v2/docker-compose.yml ec2-user@18.119.122.236:/home/ec2-user/

push-settings.py:
	scp -i KnitToKnitPair.pem -r /Users/marcocassar/PycharmProjects/knitting_project_versions/knit_to_knit_v2/backend/core/settings.py ec2-user@18.119.122.236:/home/ec2-user/backend/core/

push-.env:
	scp -i KnitToKnitPair.pem -r /Users/marcocassar/PycharmProjects/knitting_project_versions/knit_to_knit_v2/.env ec2-user@18.119.122.236:/home/ec2-user/

push-requirements:
	scp -i KnitToKnitPair.pem -r /Users/marcocassar/PycharmProjects/knitting_project_versions/knit_to_knit_v2/backend/requirements/* ec2-user@18.119.122.236:/home/ec2-user/backend/requirements/

