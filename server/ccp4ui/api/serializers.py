from rest_framework.serializers import ModelSerializer, PrimaryKeyRelatedField
from ..db import models


class ProjectSerializer(ModelSerializer):
    files = PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = models.Project
        fields = "__all__"


class FileSerializer(ModelSerializer):
    class Meta:
        model = models.File
        fields = "__all__"
