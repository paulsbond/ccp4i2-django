"""
Django settings

https://docs.djangoproject.com/en/4.2/topics/settings/
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from os import environ
from . import BASE_DIR, STATIC_DIR, USER_DIR, get_secret_key


DEBUG = environ.get("CCP4UI_DEV", "").lower() == "true"

SECRET_KEY = get_secret_key()

ALLOWED_HOSTS = ["localhost", ".localhost", "127.0.0.1", "[::1]"]

INSTALLED_APPS = [
    "corsheaders",
    "django_filters",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "ccp4ui.api.config.ApiConfig",
    "ccp4ui.db.config.DbConfig",
    "rest_framework",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"]
}

CORS_ALLOWED_ORIGINS = ["http://localhost:3000"] if DEBUG else []

ROOT_URLCONF = "ccp4ui.config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [STATIC_DIR],
        "APP_DIRS": True,
    },
]

STATIC_URL = "static/"
STATIC_ROOT = STATIC_DIR
STATICFILES_DIRS = [BASE_DIR / "client/dist"]

MEDIA_URL = "files/"
MEDIA_ROOT = USER_DIR

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": USER_DIR / "db.sqlite3",
    }
}

TIME_ZONE = "UTC"
USE_TZ = True
