.PHONY: lint format test

lint:
	pre-commit run --all-files

format:
	pre-commit run --all-files

test:
	python backend/manage.py test
