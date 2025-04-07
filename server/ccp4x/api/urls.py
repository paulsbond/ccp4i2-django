from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register("projects", views.ProjectViewSet)
router.register("project-tags", views.ProjectTagViewSet)
router.register("files", views.FileViewSet)
router.register("jobs", views.JobViewSet)
router.register("filetypes", views.FileTypeViewSet)


urlpatterns = [
    path("", include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
