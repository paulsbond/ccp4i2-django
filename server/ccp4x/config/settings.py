"""
Django settings

https://docs.djangoproject.com/en/4.2/topics/settings/
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import os
from pathlib import Path
from ccp4i2.pimple import MGQTmatplotlib

# BASE_DIR is the directory where your Django project is located (containing manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

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

NEXT_ADDRESS = os.environ.get("NEXT_ADDRESS", "http://localhost:3000")
CORS_ALLOWED_ORIGINS = [NEXT_ADDRESS] if DEBUG else []
CORS_ALLOW_ALL_ORIGINS = True
print("CORS_ALLOWED_ORIGINS", CORS_ALLOWED_ORIGINS)
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

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": USER_DIR / "db.sqlite3",
    }
}

TIME_ZONE = "UTC"
USE_TZ = True
CCP4I2_PROJECTS_DIR = Path.home().resolve() / ".ccp4x" / "CCP4X_PROJECTS"
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
STATICFILES_DIRS = [
    ("qticons", str(Path(MGQTmatplotlib.__file__).parent.parent / "qticons")),
    ("svgicons", str(Path(MGQTmatplotlib.__file__).parent.parent / "svgicons")),
]
print(str(Path(MGQTmatplotlib.__file__).parent.parent / "qticons"), str(STATIC_ROOT))

# Configure WhiteNoise for static file storage
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Optional compression and caching settings
WHITENOISE_COMPRESSION = True
WHITENOISE_MAX_AGE = 31536000
