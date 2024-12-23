from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from . import serializers
from ..db import models
from rest_framework.response import Response


class ProjectViewSet(ModelViewSet):
    queryset = models.Project.objects.all()
    serializer_class = serializers.ProjectSerializer

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def files(self, request, pk=None):
        project = models.Project.objects.get(pk=pk)
        file_serializer = serializers.FileSerializer(
            models.File.objects.filter(job__project=project), many=True
        )
        return Response(file_serializer.data)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.ProjectTagSerializer,
    )
    def tags(self, request, pk=None):
        project = models.Project.objects.get(pk=pk)
        print(project.tags)
        project_tag_serializer = serializers.ProjectTagSerializer(
            project.tags, many=True
        )
        return Response(project_tag_serializer.data)


class FileViewSet(ModelViewSet):
    queryset = models.File.objects.all()
    serializer_class = serializers.FileSerializer
    parser_classes = [FormParser, MultiPartParser]
    filterset_fields = ["project"]


class JobViewSet(ModelViewSet):
    queryset = models.Job.objects.all()
    serializer_class = serializers.FileSerializer
    parser_classes = [FormParser, MultiPartParser]
    filterset_fields = ["project"]
