#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to check if a service is up
wait_for_service() {
    local host=$1
    local port=$2
    echo "Waiting for $host:$port..."
    while ! nc -z "$host" "$port"; do
        sleep 0.1
    done
    echo "$host:$port is up"
}

# Wait for PostgreSQL and Redis to be ready
wait_for_service db 5432
wait_for_service redis 6379

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the Daphne ASGI server
echo "Starting Daphne server..."
daphne -b 0.0.0.0 -p 8000 django_project.asgi:application

# For development purposes, you can use runserver instead:
# python manage.py runserver 0.0.0.0:8000

# For production with Gunicorn and Uvicorn workers:
# gunicorn django_project.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
