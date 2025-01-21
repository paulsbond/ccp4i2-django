import logging

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
from ..lib.ccp4i2_report import make_old_report
from ..lib.job_utils.clone_job import clone_job
from ..lib.job_utils.find_dependent_jobs import find_dependent_jobs

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(f"ccp4x:{__name__}")


class ProjectViewSet(ModelViewSet):
    """ProjectViewSet is a view set for handling project-related operations.
    Methods:
        files(request, pk=None):
        jobs(request, pk=None):
        job_float_values(request, pk=None):
        job_char_values(request, pk=None):
        tags(request, pk=None):
    """

    queryset = models.Project.objects.all()
    serializer_class = serializers.ProjectSerializer

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.FileSerializer,
    )
    def files(self, request, pk=None):
        """
        Retrieve a list of files associated with a specific project.

        Parameters:

            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the project.

        Returns:
            Response: A Response object containing serialized file data.
        """

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
        """
        Retrieve a list of jobs associated with a specific project.
        Args:
            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the project.
        Returns:
            Response: A Response object containing serialized job data.
        """

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
        """
        Retrieve all JobFloatValue instances associated with a specific project.
        Args:
            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the project.
        Returns:
            Response: A Response object containing serialized data of JobFloatValue instances.
        """

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
        """
        Retrieve job characteristic values for a specific project.
        Args:
            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the project.
        Returns:
            Response: A Response object containing serialized job characteristic values.
        """

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
        """
        Retrieve tags for a specific project.
        Args:
            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the project.
        Returns:
            Response: A Response object containing serialized project tags data.
        """

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
        """
        Retrieve the contents of the 'params.xml' file for a given job.
        This method attempts to read the 'params.xml' file from the job's directory.
        If the 'params.xml' file is not found, it attempts to read the 'input_params.xml' file instead.
        If neither file is found, it returns a failure response.
        Args:
            request: The HTTP request object.
            pk (int, optional): The primary key of the job.
        Returns:
            Response: A JSON response containing the status and the contents of the XML file,
                      or an error message if the file is not found.
        """

        the_job = models.Job.objects.get(id=pk)
        try:
            with open(
                the_job.directory / "params.xml", "r", encoding="UTF-8"
            ) as params_xml_file:
                params_xml = params_xml_file.read()
            return Response({"status": "Success", "params_xml": params_xml})
        except FileNotFoundError as err:
            logger.info(err)
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
        """
        Generates an XML report for a given job and returns it in the response.
        Args:
            request: The HTTP request object.
            pk (int, optional): The primary key of the job for which the report is generated.
        Returns:
            Response: A Response object containing the status and the XML report or an error message.
        Raises:
            FileNotFoundError: If the report file is not found.
            Exception: For any other exceptions that occur during report generation.
        """

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
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def dependent_jobs(self, request, pk=None):
        """
        Retrieve dependent jobs for a given job.
        Args:
            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the job.
        Returns:
            list: Serialized data of dependent jobs.
        """

        the_job = models.Job.objects.get(id=pk)
        dependent_jobs = find_dependent_jobs(the_job)
        serializer = serializers.JobSerializer(dependent_jobs, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def clone(self, request, pk=None):
        """
        Clone an existing job and return the details of the new job.
        Args:
            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the job to be cloned.
        Returns:
            Response: A Response object containing the serialized data of the new job.
        """

        old_job_id = models.Job.objects.get(id=pk).uuid
        new_job = clone_job(old_job_id)
        serializer = serializers.JobSerializer(new_job)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def run(self, request, pk=None):
        """
        Executes a job by its primary key (pk) and returns the serialized job data.
        Args:
            request (Request): The HTTP request object.
            pk (int, optional): The primary key of the job to be executed.
        Returns:
            Response: A Response object containing the serialized job data.
        """

        job = models.Job.objects.get(id=pk)
        subprocess.Popen(
            [
                "ccp4-python",
                "manage.py",
                "run_job",
                "-ju",
                f"{str(job.uuid)}",
            ],
            start_new_session=True,
        )
        serializer = serializers.JobSerializer(job)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def diagnostic_xml(self, request, pk=None):
        """
        Retrieve the diagnostic XML file for a given job.
        Args:
            request: The HTTP request object.
            pk (int, optional): The primary key of the job.
        Returns:
            Response: A Response object containing the status and the diagnostic XML content
                      if the file is found, or an error message if the file is not found.
        Raises:
            FileNotFoundError: If the diagnostic XML file does not exist.
        """

        the_job = models.Job.objects.get(id=pk)
        try:
            with open(
                the_job.directory / "diagnostic.xml", "r", encoding="UTF-8"
            ) as diagnostic_xml_file:
                diagnostic_xml = diagnostic_xml_file.read()
            return Response({"status": "Success", "diagnostic_xml": diagnostic_xml})
        except FileNotFoundError as err:
            logger.exception(
                "Failed to find file %s" % (the_job.directory / "diagnostic.xml",),
                exc_info=err,
            )
            return Response({"status": "Failed", "reason": str(err)})
