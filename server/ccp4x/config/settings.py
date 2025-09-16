"""
Django settings

https://docs.djangoproject.com/en/4.2/topics/settings/
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import os
from pathlib import Path
from urllib.parse import urlparse
from ccp4i2.googlecode import diff_match_patch_py3

# BASE_DIR is the directory where your Django project is located (containing manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-xq@_ci4r3sl+1!3vt5xz5wurncfvfyq^$k5anjsi3+*wb)(5!v"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG", "True").lower() in ("true", "1", "yes")

# ALLOWED_HOSTS configuration with environment variable support
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS")
if ALLOWED_HOSTS_ENV:
    # Parse comma-separated list of hosts
    ALLOWED_HOSTS = [
        host.strip() for host in ALLOWED_HOSTS_ENV.split(",") if host.strip()
    ]
    print(f"Using ALLOWED_HOSTS from environment: {ALLOWED_HOSTS}")
else:
    # Default hosts for development
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
    if DEBUG:
        ALLOWED_HOSTS.append("*")  # Allow all hosts in debug mode
    print(f"Using default ALLOWED_HOSTS: {ALLOWED_HOSTS}")

INSTALLED_APPS = [
    "corsheaders",
    "django_filters",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "ccp4x.api.config.ApiConfig",
    "ccp4x.db.config.DbConfig",
    "rest_framework",
    "whitenoise",
]

MIDDLEWARE = [
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Add WhiteNoise middleware
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"]
}

# CORS configuration with environment variable support
CORS_ALLOWED_ORIGINS_ENV = os.environ.get("CORS_ALLOWED_ORIGINS")
if CORS_ALLOWED_ORIGINS_ENV:
    # Parse comma-separated list of origins
    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in CORS_ALLOWED_ORIGINS_ENV.split(",")
        if origin.strip()
    ]
    CORS_ALLOW_ALL_ORIGINS = False
    print(f"Using CORS_ALLOWED_ORIGINS from environment: {CORS_ALLOWED_ORIGINS}")
else:
    # Default behavior for development
    NEXT_ADDRESS = os.environ.get("NEXT_ADDRESS", "http://localhost:3000")
    if DEBUG:
        CORS_ALLOWED_ORIGINS = [NEXT_ADDRESS]
        CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins in debug mode
        print(
            f"Debug mode: CORS_ALLOWED_ORIGINS={CORS_ALLOWED_ORIGINS}, CORS_ALLOW_ALL_ORIGINS=True"
        )
    else:
        CORS_ALLOWED_ORIGINS = [NEXT_ADDRESS]
        CORS_ALLOW_ALL_ORIGINS = False
        print(f"Production mode: CORS_ALLOWED_ORIGINS={CORS_ALLOWED_ORIGINS}")

ROOT_URLCONF = "ccp4x.api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
    },
]

STATIC_URL = "/djangostatic/"
MEDIA_URL = "files/"

USER_DIR = Path.home().resolve() / ".ccp4x"
USER_DIR.mkdir(exist_ok=True)
MEDIA_ROOT = USER_DIR / "files"

# Database configuration with DATABASE_URL support
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Parse the DATABASE_URL
    url = urlparse(DATABASE_URL)

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": url.path[1:],  # Remove leading slash
            "USER": url.username,
            "PASSWORD": url.password,
            "HOST": url.hostname,
            "PORT": url.port or 5432,
            "OPTIONS": {
                "connect_timeout": 10,
            },
        }
    }
    print(
        f"Using PostgreSQL database: {url.username}@{url.hostname}:{url.port}/{url.path[1:]}"
    )
else:
    # Default SQLite configuration
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.environ.get("CCP4I2_DB_FILE", USER_DIR / "db.sqlite3"),
        }
    }
    print(f"Using SQLite database: {DATABASES['default']['NAME']}")

TIME_ZONE = "UTC"
USE_TZ = True
CCP4I2_PROJECTS_DIR = Path(
    os.environ.get(
        "CCP4I2_PROJECTS_DIR", Path.home().resolve() / ".ccp4x" / "CCP4X_PROJECTS"
    )
)
CCP4I2_PROJECTS_DIR.mkdir(exist_ok=True)

REST_FRAMEWORK = {
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    )
}

# Static files settings
STATIC_URL = "/djangostatic/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Modified settings for Electron
STATICFILES_STORAGE = (
    "django.contrib.staticfiles.storage.StaticFilesStorage"  # Use default storage
)

# Keep your existing STATICFILES_DIRS - WhiteNoise will serve directly from these
STATICFILES_DIRS = [
    ("qticons", str(Path(diff_match_patch_py3.__file__).parent.parent / "qticons")),
    ("svgicons", str(Path(diff_match_patch_py3.__file__).parent.parent / "svgicons")),
]

# Disable manifest storage features that require collectstatic
WHITENOISE_USE_FINDERS = True  # Serve directly from STATICFILES_DIRS
WHITENOISE_AUTOREFRESH = True  # Enable in development
