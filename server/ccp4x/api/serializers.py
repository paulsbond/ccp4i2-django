from rest_framework.serializers import ModelSerializer
from ..db import models


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = models.Project
        fields = "__all__"
        read_only_fields = ["created", "uuid"]


class FileSerializer(ModelSerializer):
    class Meta:
        model = models.File
        fields = "__all__"
        read_only_fields = ["name", "size", "uuid"]
