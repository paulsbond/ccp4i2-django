import logging
from xml.etree import ElementTree as ET
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from . import serializers
from ..db import models
from ..lib.ccp4i2_report import make_old_report
from ..lib.job_utils.clone_job import clone_job

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger("root")


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
        serializer = serializers.FileSerializer(
            models.File.objects.filter(job__project=project), many=True
        )
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def jobs(self, request, pk=None):
        project = models.Project.objects.get(pk=pk)
        serializer = serializers.JobSerializer(
            models.Job.objects.filter(project=project), many=True
        )
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobFloatValueSerializer,
    )
    def job_float_values(self, request, pk=None):
        project = models.Project.objects.get(pk=pk)
        serializer = serializers.JobFloatValueSerializer(
            models.JobFloatValue.objects.filter(job__project=project), many=True
        )
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobCharValueSerializer,
    )
    def job_char_values(self, request, pk=None):
        project = models.Project.objects.get(pk=pk)
        serializer = serializers.JobCharValueSerializer(
            models.JobCharValue.objects.filter(job__project=project), many=True
        )
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.ProjectTagSerializer,
    )
    def tags(self, request, pk=None):
        project = models.Project.objects.get(pk=pk)
        # print(project.tags)
        project_tag_serializer = serializers.ProjectTagSerializer(
            project.tags, many=True
        )
        return Response(project_tag_serializer.data)


class ProjectTagViewSet(ModelViewSet):
    queryset = models.ProjectTag.objects.all()
    serializer_class = serializers.ProjectTagSerializer


class FileViewSet(ModelViewSet):
    queryset = models.File.objects.all()
    serializer_class = serializers.FileSerializer
    parser_classes = [FormParser, MultiPartParser]

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def by_uuid(self, request, pk=None):
        the_file = models.File.objects.get(uuid=pk)
        serializer = serializers.FileSerializer(the_file, many=False)
        return Response(serializer.data)


class JobViewSet(ModelViewSet):
    queryset = models.Job.objects.all()
    serializer_class = serializers.JobSerializer
    parser_classes = [FormParser, MultiPartParser]
    filterset_fields = ["project"]

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def params_xml(self, request, pk=None):
        the_job = models.Job.objects.get(id=pk)
        try:
            with open(
                the_job.directory / "params.xml", "r", encoding="UTF-8"
            ) as params_xml_file:
                params_xml = params_xml_file.read()
            return Response({"status": "Success", "params_xml": params_xml})
        except FileNotFoundError as err:
            logger.error(err)
            try:
                with open(
                    the_job.directory / "input_params.xml", "r", encoding="UTF-8"
                ) as params_xml_file:
                    params_xml = params_xml_file.read()
                    return Response({"status": "Success", "params_xml": params_xml})
            except FileNotFoundError as err:
                return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def report_xml(self, request, pk=None):
        the_job = models.Job.objects.get(id=pk)
        try:
            report_xml = make_old_report(the_job)
            ET.indent(report_xml, space="\t", level=0)
            report_xml = ET.tostring(make_old_report(the_job))
            return Response({"status": "Success", "report_xml": report_xml})
        except FileNotFoundError as err:
            return Response({"status": "Failed", "reason": str(err)})
        except Exception as err:
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def clone(self, request, pk=None):
        old_job_id = models.Job.objects.get(id=pk).uuid
        new_job = clone_job(old_job_id)
        serializer = serializers.JobSerializer(new_job)
        return Response(serializer.data)
