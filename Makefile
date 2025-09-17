.PHONY: lint test test-local
lint:
	flake8 backend
test:
	cd backend && DJANGO_SETTINGS_MODULE=django_project.settings_test python manage.py test
test-local:
	cd backend && LOCAL_TESTS=1 DJANGO_SETTINGS_MODULE=django_project.settings_test python manage.py test
