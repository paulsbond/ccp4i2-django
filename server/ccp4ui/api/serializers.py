from rest_framework.serializers import HyperlinkedModelSerializer
from ..db import models


class ProjectSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = models.Project
        fields = "__all__"
        read_only_fields = ["created", "uuid"]


class FileSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = models.File
        fields = "__all__"
        read_only_fields = ["name", "size", "uuid"]
