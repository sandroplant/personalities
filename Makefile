.PHONY: lint test
lint:
	flake8 backend
test:
	cd backend && python manage.py test
