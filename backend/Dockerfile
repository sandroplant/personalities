# Use an official Python runtime as the base image
FROM python:3.11-slim

# Set environment variables using the key=value format
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install system dependencies, including netcat-openbsd
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

# Make entrypoint.sh executable
RUN chmod +x ./entrypoint.sh

# Expose the application port
EXPOSE 8000

# Define the default command to run the application
ENTRYPOINT ["./entrypoint.sh"]

# For development using Django's runserver, the entrypoint script will handle it
# For production using Gunicorn, modify the entrypoint script accordingly
