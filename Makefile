.PHONY: lint test test-local
lint:
\tflake8 backend
test:
\tcd backend && DJANGO_SETTINGS_MODULE=django_project.settings_test python manage.py test
test-local:
\tcd backend && LOCAL_TESTS=1 DJANGO_SETTINGS_MODULE=django_project.settings_test python manage.py test
