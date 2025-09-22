.PHONY: lint format test

SHELL := /bin/bash
.ONESHELL:

lint:
\tpython -m pip install -q --disable-pip-version-check -r requirements-dev.txt || python -m pip install -q pre-commit
\tpython -m pre_commit run --all-files

format:
\tpython -m pre_commit run --all-files

test:
\tpython backend/manage.py test
