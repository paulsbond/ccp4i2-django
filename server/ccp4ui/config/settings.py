"""
Django settings

https://docs.djangoproject.com/en/4.2/topics/settings/
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from os import environ
from pathlib import Path
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent.parent
USER_DIR = Path.home().resolve() / ".ccp4ui"
STATIC_DIR = BASE_DIR / "static"

DEBUG = environ.get("CCP4UI_DEV", "").lower() == "true"

SECRET_KEY_PATH = USER_DIR / "secret-key.txt"
if not SECRET_KEY_PATH.exists():
    SECRET_KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SECRET_KEY_PATH, "w", encoding="utf-8") as f:
        f.write(f"{uuid4()}-{uuid4()}")
with open(SECRET_KEY_PATH, encoding="utf-8") as f:
    SECRET_KEY = f.read().strip()

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

ROOT_URLCONF = "ccp4ui.api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [STATIC_DIR],
        "APP_DIRS": True,
    },
]

STATIC_URL = "static/"
STATIC_ROOT = STATIC_DIR

MEDIA_URL = "media/"
MEDIA_ROOT = USER_DIR / "media"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": USER_DIR / "db.sqlite3",
    }
}

TIME_ZONE = "UTC"
USE_TZ = True
