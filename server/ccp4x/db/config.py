from django.apps import AppConfig


class DbConfig(AppConfig):
    name = "ccp4x.db"
    label = "ccp4x"
    default_auto_field = "django.db.models.BigAutoField"
