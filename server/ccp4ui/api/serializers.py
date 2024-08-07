from rest_framework.serializers import ModelSerializer, PrimaryKeyRelatedField
from ..db import models


class ProjectSerializer(ModelSerializer):
    imported_files = PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = models.Project
        fields = "__all__"


class ImportedFileSerializer(ModelSerializer):
    class Meta:
        model = models.ImportedFile
        fields = "__all__"
