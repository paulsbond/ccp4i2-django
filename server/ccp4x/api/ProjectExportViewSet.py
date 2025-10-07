import logging
from django.http import FileResponse
from rest_framework.parsers import MultiPartParser, JSONParser, FormParser
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from . import serializers
from ..db import models

logger = logging.getLogger(f"ccp4x:{__name__}")


class ProjectExportViewSet(ModelViewSet):
    queryset = models.ProjectExport.objects.all()
    serializer_class = serializers.ProjectExportSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
    )
    def download(self, request, pk=None):
        export = self.get_object()
        project = export.project

        # Construct the expected file path based on the export creation logic
        from django.utils.text import slugify
        import os

        project_name = slugify(project.name or f"project_{project.id}")
        timestamp = export.time.strftime("%Y%m%d_%H%M%S")
        export_file_name = f"{project_name}_export_{timestamp}.ccp4_project.zip"
        export_file_path = os.path.join(
            project.directory, "CCP4_PROJECT_FILES", export_file_name
        )

        if os.path.exists(export_file_path):
            return FileResponse(open(export_file_path, "rb"), filename=export_file_name)
        else:
            return Response({"error": "Export file not found"}, status=404)
