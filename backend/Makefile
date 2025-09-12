# backend/Makefile

.PHONY: install runserver migrate makemigrations createsuperuser lint format test check recompute

# --- Tooling / deps (idempotent) ---
install:
	python -m pip install --upgrade pip setuptools wheel
	# Project deps (ok if already installed)
	- pip install -r requirements.txt
	# Dev tools
	- pip install black ruff flake8 isort

# --- Django shortcuts ---
runserver:
	python manage.py runserver

migrate:
	python manage.py migrate

makemigrations:
	python manage.py makemigrations

createsuperuser:
	python manage.py createsuperuser

check:
	python manage.py check

recompute:
	python manage.py recompute_rater_stats

# --- Quality gates (scoped to THIS directory, not parent!) ---
lint:
	ruff check . --fix
	flake8

format:
	black .
	python -m isort .

# --- Tests (uses pytest.ini if present; falls back to Django test runner) ---
test:
	@if command -v pytest >/dev/null 2>&1; then \
		pytest -q ; \
	else \
		python manage.py test ; \
	fi
