from rest_framework.serializers import ModelSerializer
from ..db import models


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = models.Project
        fields = "__all__"


class JobSerializer(ModelSerializer):
    class Meta:
        model = models.Job
        fields = "__all__"
