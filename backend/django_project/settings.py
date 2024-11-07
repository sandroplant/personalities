# backend/django_project/settings.py

import os
from pathlib import Path
from datetime import timedelta
import environ

# Initialize environment variables
env = environ.Env(
    # Set casting and default values
    DEBUG=(bool, False)
)

# Set the base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Path to the .env file (assuming .env is in the project root: /path/to/personalities/.env)
env_file_path = BASE_DIR.parent / '.env'

# Read the .env file using django-environ
environ.Env.read_env(env_file_path)

# Debugging: Print environment variables (remove or comment out in production)
print("DEBUG: POSTGRES_DB =", env('POSTGRES_DB', default='Not Set'))
print("DEBUG: POSTGRES_USER =", env('POSTGRES_USER', default='Not Set'))
print("DEBUG: POSTGRES_PASSWORD =", env('POSTGRES_PASSWORD', default='Not Set'))
print("DEBUG: POSTGRES_HOST =", env('POSTGRES_HOST', default='Not Set'))
print("DEBUG: POSTGRES_PORT =", env('POSTGRES_PORT', default='Not Set'))

# Validate required environment variables
REQUIRED_ENV_VARS = [
    'SECRET_KEY',
    'SESSION_SECRET',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REDIRECT_URI',
    'CLIENT_URL',
    'OPENAI_API_KEY',
    'CLOUDINARY_URL',
    'JWT_SECRET',
    'REDIS_HOST',
    'REDIS_PORT',
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'DJANGO_ALLOWED_HOSTS',
    'DEBUG',  # Added DEBUG to required vars
]

# Check for missing environment variables
missing_env_vars = [var for var in REQUIRED_ENV_VARS if not env(var, default=None)]
if missing_env_vars:
    raise Exception(f"❌ Missing required environment variables: {', '.join(missing_env_vars)}")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG')

ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Application definition
INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'django_ratelimit',
    'django_filters',
    'drf_spectacular',
    'drf_spectacular_sidecar',  # Optional: for Swagger UI assets
    'django_redis',
    'axes',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',  # If using social accounts
    'storages',

    # Your apps
    'core',
    'ai',
    'messaging',
    'userprofiles',
    'spotify_auth',
    'uploads',
    'custom_auth.apps.AuthConfig',
    'posts',
]

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS
    'django.middleware.security.SecurityMiddleware',  # Security headers
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'axes.middleware.AxesMiddleware',  # django-axes for security
    # 'core.middleware.RateLimitMiddleware',  # Uncomment if you have a custom RateLimitMiddleware
]

ROOT_URLCONF = 'django_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR.parent / 'core' / 'templates'],  # Using pathlib for paths
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',  # Required by allauth
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_project.wsgi.application'
ASGI_APPLICATION = 'django_project.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DATABASE_NAME', os.getenv('POSTGRES_DB')),
        'USER': os.getenv('DATABASE_USER', os.getenv('POSTGRES_USER')),
        'PASSWORD': os.getenv('DATABASE_PASSWORD', os.getenv('POSTGRES_PASSWORD')),
        'HOST': os.getenv('DATABASE_HOST', os.getenv('POSTGRES_HOST')),
        'PORT': os.getenv('DATABASE_PORT', os.getenv('POSTGRES_PORT')),
    }
}

# Redis Configuration (for caching and sessions)
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{env('REDIS_HOST')}:{env.int('REDIS_PORT')}/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Session Engine
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'  # Adjust as needed
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'

# This is where the collected static files will be stored
STATIC_ROOT = BASE_DIR / 'staticfiles'  # Points to backend/staticfiles

# This points to the 'static' directory at the backend level
STATICFILES_DIRS = [
    BASE_DIR / 'static',  # Points to backend/static
]

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary Configuration
CLOUDINARY_STORAGE = {
    'CLOUDINARY_URL': env('CLOUDINARY_URL'),
}
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://ec2-54-197-63-5.compute-1.amazonaws.com",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type', 'dnt',
    'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'drf_spectacular.renderers.OpenApiJsonRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated',],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend',],
}

# drf-spectacular Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Your Project API',
    'DESCRIPTION': 'API documentation for Your Project.',
    'VERSION': '1.0.0',
    # Add other settings as needed
}

# Simple JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'SIGNING_KEY': env('JWT_SECRET'),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# django-axes Configuration
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=30)
AXES_LOCKOUT_CALLABLE = None  # Ensure this is set correctly or remove it

# Logging Configuration
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'custom': {
            '()': 'core.utils.logger.SensitiveInfoFormatter',  # Ensure this formatter exists
            'format': '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'verbose': {
            'format': '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s',
            'datefmt': '%d/%b/%Y %H:%M:%S',
        },
        'simple': {
            'format': '%(levelname)s %(message)s',
        },
    },
    'handlers': {
        'file_error': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'error.log',
            'maxBytes': 5 * 1024 * 1024,  # 5 MB
            'backupCount': 5,
            'formatter': 'custom',
        },
        'file_info': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'combined.log',
            'maxBytes': 10 * 1024 * 1024,  # 10 MB
            'backupCount': 5,
            'formatter': 'custom',
        },
    },
    'loggers': {
        '': {  # Root logger
            'handlers': ['file_info', 'file_error'],
            'level': 'INFO',
            'propagate': True,
        },
        'django': {
            'handlers': ['file_info', 'file_error'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file_error'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Add other loggers as needed
    },
}

# Add console handler only in development
if DEBUG:
    LOGGING['handlers']['console'] = {
        'level': 'INFO',
        'class': 'logging.StreamHandler',
        'formatter': 'simple',
    }
    LOGGING['loggers']['']['handlers'].append('console')

# Security Settings
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SECURE_HSTS_SECONDS = 3600 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# Channels Configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(env('REDIS_HOST'), env.int('REDIS_PORT'))],
        },
    },
}

# Authentication User Model
AUTH_USER_MODEL = 'core.User'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Spotify Configuration
SPOTIFY_CLIENT_ID = env('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = env('SPOTIFY_CLIENT_SECRET')
SPOTIFY_REDIRECT_URI = env('SPOTIFY_REDIRECT_URI')

# OpenAI API Key
OPENAI_API_KEY = env('OPENAI_API_KEY')

# Ensure `DJANGO_ALLOWED_HOSTS` is set correctly
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# If you have 'DATABASE_URL' in your environment and are using it with dj-database-url
# Uncomment the following lines and adjust accordingly
# import dj_database_url
# DATABASES['default'] = dj_database_url.parse(env('DATABASE_URL'))
