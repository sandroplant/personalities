#!/bin/bash

# Wait for the database to be ready
echo "Waiting for db:5432..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "db:5432 is up"

# Wait for Redis to be ready
echo "Waiting for redis:6379..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "redis:6379 is up"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Daphne server
echo "Starting Daphne server..."
daphne -b 0.0.0.0 -p 8000 django_project.asgi:application
