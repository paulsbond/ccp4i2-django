import logging
import datetime
import json
import pathlib
import os
import platform
from xml.etree import ElementTree as ET
from pytz import timezone
from django.http import Http404
from django.http import FileResponse
from django.core.management import call_command
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, JSONParser
from ccp4i2.core import CCP4TaskManager
from ccp4i2.core.CCP4Container import CContainer
from core import CCP4ErrorHandling
from ..lib.job_utils.load_nested_xml import load_nested_xml
from ..lib.job_utils.validate_container import validate_container
from ..lib.job_utils.digest_file import digest_file
from ..lib.job_utils.list_project import list_project
from ..lib.job_utils.validate_container import getEtree
from ..lib.job_utils.get_task_tree import get_task_tree
from ..lib.job_utils.create_task import create_task
from ..lib.job_utils.preview_file import preview_file

"""
This module defines several viewsets for handling API requests related to projects, project tags, files, and jobs in the CCP4X application.

Classes:
    ProjectViewSet(ModelViewSet): Handles CRUD operations and custom actions for Project model.
        - files: Retrieves files associated with a project.
        - jobs: Retrieves jobs associated with a project.
        - job_float_values: Retrieves job float values associated with a project.
        - job_char_values: Retrieves job char values associated with a project.
        - tags: Retrieves tags associated with a project.

    ProjectTagViewSet(ModelViewSet): Handles CRUD operations for ProjectTag model.

    FileViewSet(ModelViewSet): Handles CRUD operations and custom actions for File model.
        - by_uuid: Retrieves a file by its UUID.

    JobViewSet(ModelViewSet): Handles CRUD operations and custom actions for Job model.
        - params_xml: Retrieves the params.xml or input_params.xml file content for a job.
        - report_xml: Generates and retrieves the report XML for a job.
        - dependent_jobs: Retrieves jobs dependent on a given job.
        - clone: Clones a job.
        - run: Runs a job using a subprocess.
        - diagnostic_xml: Retrieves the diagnostic.xml file content for a job.

Logging:
    Configured to log errors with the logger named "ccp4x:<module_name>".
"""
import subprocess
from xml.etree import ElementTree as ET
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from . import serializers
from ..db import models
from ..lib.job_utils.ccp4i2_report import make_old_report
from ..lib.job_utils.clone_job import clone_job
from ..lib.job_utils.find_dependent_jobs import find_dependent_jobs
from ..lib.job_utils.find_dependent_jobs import delete_job_and_dependents
from ..lib.job_utils.set_parameter import set_parameter
from ..lib.job_utils.upload_file_param import upload_file_param
from ..lib.job_utils.get_job_container import get_job_container
from ..lib.job_utils.json_for_job_container import json_for_job_container
from ..lib.job_utils.object_method import object_method
from django.http import JsonResponse
from django.conf import settings
from django.utils.text import slugify

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
