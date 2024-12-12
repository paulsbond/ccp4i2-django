"""
Django settings

https://docs.djangoproject.com/en/4.2/topics/settings/
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-xq@_ci4r3sl+1!3vt5xz5wurncfvfyq^$k5anjsi3+*wb)(5!v"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

INSTALLED_APPS = [
    "corsheaders",
    "django_filters",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "ccp4x.api.config.ApiConfig",
    "ccp4x.db.config.DbConfig",
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

ROOT_URLCONF = "ccp4x.api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
    },
]

STATIC_URL = "static/"
MEDIA_URL = "files/"

USER_DIR = Path.home().resolve() / ".ccp4x"
USER_DIR.mkdir(exist_ok=True)
MEDIA_ROOT = USER_DIR / "files"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": USER_DIR / "db.sqlite3",
    }
}

TIME_ZONE = "UTC"
USE_TZ = True
