from rest_framework.viewsets import ModelViewSet
from . import serializers
from ..db import models


class ProjectViewSet(ModelViewSet):
    queryset = models.Project.objects.all()
    serializer_class = serializers.ProjectSerializer
