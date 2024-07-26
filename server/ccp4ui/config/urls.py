"""
URL configuration

https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""

from django.urls import include, path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView

_index = TemplateView.as_view(template_name="index.html")
_index = ensure_csrf_cookie(_index)

urlpatterns = [
    path("api/", include("ccp4ui.api.urls")),
    path("", _index),
]
