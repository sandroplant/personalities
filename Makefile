.PHONY: setup format test

setup:
	python3.11 -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt

format:
	pre-commit run --all-files

test:
	python backend/manage.py test
