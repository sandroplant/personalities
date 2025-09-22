.PHONY: lint test

SHELL := /bin/bash

lint:
	python -m pip install -q --disable-pip-version-check -r ../requirements-dev.txt || python -m pip install -q pre-commit
	python -m pre_commit run --all-files

test:
	python manage.py test
