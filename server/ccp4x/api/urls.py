from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework import routers
from .ProjectViewSet import ProjectViewSet
from .ProjectTagViewSet import ProjectTagViewSet
from .FileViewSet import FileViewSet
from .JobViewSet import JobViewSet
from .FileTypeViewSet import FileTypeViewSet
from . import views

router = routers.DefaultRouter()
router.register("projects", ProjectViewSet)
router.register("project-tags", ProjectTagViewSet)
router.register("files", FileViewSet)
router.register("jobs", JobViewSet)
router.register("filetypes", FileTypeViewSet)


urlpatterns = [
    path("", include(router.urls)),
    path("task_tree/", views.task_tree, name="task_tree"),
    path("active_jobs/", views.active_jobs, name="active_jobs"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
