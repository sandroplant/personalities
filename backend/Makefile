# backend/Makefile

.PHONY: runserver migrate lint format test createsuperuser

runserver:
	python manage.py runserver

migrate:
	python manage.py migrate

createsuperuser:
	python manage.py createsuperuser

lint:
	python -m flake8 ..

format:
	black ..

test:
	python manage.py test
