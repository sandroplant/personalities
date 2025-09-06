# backend/Makefile

.PHONY: runserver migrate lint format

runserver:
	python manage.py runserver

migrate:
	python manage.py migrate

createsuperuser:
	python manage.py createsuperuser

lint:
	python -m flake8 userprofiles/views.py

format:
	black .

test:
	python manage.py test
