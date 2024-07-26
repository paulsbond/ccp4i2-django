"""
URL configuration

https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""

from django.urls import include, path


urlpatterns = [
    path("/", include("ccp4ui.api.urls")),
]
