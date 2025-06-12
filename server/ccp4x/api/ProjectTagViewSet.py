import logging
from rest_framework.viewsets import ModelViewSet
from . import serializers
from ..db import models

logger = logging.getLogger(f"ccp4x:{__name__}")


class ProjectTagViewSet(ModelViewSet):
    queryset = models.ProjectTag.objects.all()
    serializer_class = serializers.ProjectTagSerializer
