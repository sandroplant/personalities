.PHONY: lint format test

SHELL := /bin/bash

lint:
	python -m pip install -q --disable-pip-version-check -r requirements-dev.txt || python -m pip install -q pre-commit
	python -m pre_commit run --all-files

format:
	python -m pre_commit run --all-files

test:
	python backend/manage.py test
