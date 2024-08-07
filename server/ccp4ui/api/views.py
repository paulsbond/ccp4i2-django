from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.viewsets import ModelViewSet
from . import serializers
from ..db import models


class ProjectViewSet(ModelViewSet):
    queryset = models.Project.objects.all()
    serializer_class = serializers.ProjectSerializer


class ImportedFileViewSet(ModelViewSet):
    queryset = models.ImportedFile.objects.all()
    serializer_class = serializers.ImportedFileSerializer
    parser_classes = [FormParser, MultiPartParser]
