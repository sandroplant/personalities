import os
from pathlib import Path

import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Read environment variables from .env file
env = environ.Env(
    DEBUG=(bool, True),
    ALLOWED_HOSTS=(list, []),
)
env.read_env(os.path.join(BASE_DIR, ".env"))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("SECRET_KEY", default="django-insecure-your-secret-key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env("DEBUG")

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

# Application definition
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.sites",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "corsheaders",
    "social_django",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    # Your apps
    "core",
    "evaluations.apps.EvaluationsConfig",  # ensures ready() registers RaterStats
    "userprofiles",
    "spotify_auth",
    "custom_auth",
    "messaging",
    "posts",
    "questions",
]

SITE_ID = 1  # required for django-allauth

# Use custom user model defined in core app
AUTH_USER_MODEL = "core.User"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # keep first
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "django_project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "social_django.context_processors.backends",
                "social_django.context_processors.login_redirect",
            ],
        },
    },
]

WSGI_APPLICATION = "django_project.wsgi.application"

# Database configuration
DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": ("django.contrib.auth.password_validation." "MinimumLengthValidator"),
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS/CSRF for local dev (adjust per env as needed)
CORS_ALLOW_ALL_ORIGINS = True
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Personalities API",
    "DESCRIPTION": "API schema for the Personalities app",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Env-backed threshold for Evaluations summary gating
EVALUATIONS_MIN_RATINGS = int(os.getenv("EVALUATIONS_MIN_RATINGS", "10"))

# Additional configuration reading from environment variables
SPOTIFY_CLIENT_ID = env("SPOTIFY_CLIENT_ID", default="")
SPOTIFY_CLIENT_SECRET = env("SPOTIFY_CLIENT_SECRET", default="")
SPOTIFY_REDIRECT_URI = env("SPOTIFY_REDIRECT_URI", default="")
OPENAI_API_KEY = env("OPENAI_API_KEY", default="")

# Redis configuration
REDIS_HOST = env("REDIS_HOST", default="redis")
REDIS_PORT = env("REDIS_PORT", default="6379")
