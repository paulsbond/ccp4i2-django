import logging
from django.http import FileResponse
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from ..lib.job_utils.preview_file import preview_file
from ..lib.job_utils.digest_file import digest_file
from xml.etree import ElementTree as ET
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from . import serializers
from ..db import models

logger = logging.getLogger(f"ccp4x:{__name__}")


class FileViewSet(ModelViewSet):
    queryset = models.File.objects.all()
    serializer_class = serializers.FileSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def by_uuid(self, request, pk=None):
        try:
            the_file = models.File.objects.get(uuid=pk)
            serializer = serializers.FileSerializer(the_file, many=False)
            return Response(serializer.data)
        except models.File.DoesNotExist as err:
            logging.exception("Failed to retrieve file with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def download(self, request, pk=None):
        try:
            the_file = models.File.objects.get(id=pk)
            return FileResponse(open(the_file.path, "rb"), filename=the_file.name)
        except models.File.DoesNotExist as err:
            logging.exception("Failed to retrieve file with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def download_by_uuid(self, request, pk=None):
        try:
            the_file = models.File.objects.get(uuid=pk)
            return FileResponse(open(the_file.path, "rb"), filename=the_file.name)
        except models.File.DoesNotExist as err:
            logging.exception("Failed to retrieve file with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def digest(self, request, pk=None):
        try:
            the_file = models.File.objects.get(id=pk)
            result = digest_file(the_file)
            return Response(result)
        except models.File.DoesNotExist as err:
            logging.exception("Failed to retrieve file with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def preview(self, request, pk=None):
        try:
            the_file = models.File.objects.get(id=pk)
            the_viewer = request.data.get("viewer")
            preview_file(the_viewer, str(the_file.path))
            return Response({"status": "Success"})
        except models.File.DoesNotExist as err:
            logging.exception("Failed to retrieve file with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
