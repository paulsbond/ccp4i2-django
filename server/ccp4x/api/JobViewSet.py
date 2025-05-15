import logging
import datetime
import json
import pathlib
import os
import platform
from xml.etree import ElementTree as ET
from pytz import timezone
from django.http import Http404
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from ccp4i2.core import CCP4TaskManager
from ccp4i2.core.CCP4Container import CContainer
from core import CCP4ErrorHandling
from ..lib.job_utils.load_nested_xml import load_nested_xml
from ..lib.job_utils.validate_container import validate_container
from ..lib.job_utils.digest_file import digest_param_file
from ..lib.job_utils.validate_container import getEtree
from ..lib.job_utils.set_input_by_context_job import set_input_by_context_job
from ..lib.job_utils.get_job_plugin import get_job_plugin
from ..lib.job_utils.preview_job import preview_job

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
from ..lib.job_utils.get_what_next import get_what_next
from django.http import JsonResponse
from django.conf import settings
from django.utils.text import slugify

logger = logging.getLogger(f"ccp4x:{__name__}")


class JobViewSet(ModelViewSet):
    queryset = models.Job.objects.all()
    serializer_class = serializers.JobSerializer
    parser_classes = [FormParser, MultiPartParser, JSONParser]
    filterset_fields = ["project"]

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            logger.warning("Deleting job %s", instance)
            delete_job_and_dependents(instance)
            # Note I am adding a bit of body to the response because of an odd
            # javascript feature which presents as network error if no body in response.
            return Response({"status": "Success"})
        except Http404:
            return Http404("Job not found")

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def what_next(self, request, pk=None):
        try:
            job = models.Job.objects.get(id=pk)
        except ValueError as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return JsonResponse({"status": "Failed", "reason": str(err)})
        except models.Job.DoesNotExist as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return JsonResponse({"status": "Failed", "reason": str(err)})
        except Exception as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return JsonResponse({"status": "Failed", "reason": str(err)})
        return JsonResponse(get_what_next(job))

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def set_context_job(self, request, pk=None):
        try:
            job = models.Job.objects.get(id=pk)
            form_data = json.loads(request.body.decode("utf-8"))
            context_job_uuid = form_data["context_job_uuid"]
            set_input_by_context_job(str(job.uuid), context_job_uuid)
            serializer = serializers.JobSerializer(job)
            return JsonResponse({"status": "Success", "new_job": serializer.data})
        except CCP4ErrorHandling.CException as err:
            error_tree = getEtree(err)
            ET.indent(error_tree, " ")
            return JsonResponse(
                {"status": "Failed", "reason": ET.tostring(error_tree).decode("utf-8")}
            )
        except models.Job.DoesNotExist as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return JsonResponse({"status": "Failed", "reason": str(err)})
        except Exception as err:
            return JsonResponse({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def object_method(self, request, pk=None):
        """
        Handles the request to execute a method on a job object.

        Args:
            request (HttpRequest): The HTTP request object.
            pk (int, optional): The primary key of the job.

        Returns:
            JsonResponse: A JSON response containing the status and the result of the method execution.
        """
        form_data = json.loads(request.body.decode("utf-8"))
        job = models.Job.objects.get(id=pk)
        object_path = form_data["object_path"]
        method_name = form_data["method_name"]
        args = form_data.get("args", [])
        kwargs = form_data.get("kwargs", {})
        try:
            result = object_method(job, object_path, method_name, args, kwargs)
            return JsonResponse({"status": "Success", "result": result})
        except CCP4ErrorHandling.CException as err:
            error_tree = getEtree(err)
            ET.indent(error_tree, " ")
            return JsonResponse(
                {"status": "Failed", "reason": ET.tostring(error_tree).decode("utf-8")}
            )

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def params_xml(self, request, pk=None):
        try:
            the_job = models.Job.objects.get(id=pk)
            params_path = the_job.directory / "params.xml"
            fallback_params_path = the_job.directory / "input_params.xml"
            if the_job.status in [models.Job.Status.UNKNOWN, models.Job.Status.PENDING]:
                params_path = the_job.directory / "input_params.xml"
                fallback_params_path = the_job.directory / "params.xml"
            with open(params_path, "r", encoding="UTF-8") as params_xml_file:
                params_xml = params_xml_file.read()
            return Response({"status": "Success", "xml": params_xml})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
        except FileNotFoundError as err:
            logger.info(err)
            try:
                with open(
                    fallback_params_path, "r", encoding="UTF-8"
                ) as params_xml_file:
                    params_xml = params_xml_file.read()
                    return Response({"status": "Success", "xml": params_xml})
            except FileNotFoundError as err1:
                return Response({"status": "Failed", "reason": str(err1)})

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
        try:
            the_job = models.Job.objects.get(id=pk)
            report_xml = ""
            if the_job.status in [models.Job.Status.PENDING, models.Job.Status.UNKNOWN]:
                report_xml = ET.Element("report")
                ET.SubElement(report_xml, "status").text = "PENDING"
            if the_job.status in [
                models.Job.Status.FAILED,
                models.Job.Status.UNSATISFACTORY,
                models.Job.Status.INTERRUPTED,
                models.Job.Status.FINISHED,
            ]:
                report_xml_path = the_job.directory / "report_xml.xml"
                logger.debug(
                    "report_xml_path: %s %s", report_xml_path, report_xml_path.exists()
                )
                if not report_xml_path.exists():
                    report_xml = make_old_report(the_job)
                    ET.indent(report_xml, space="\t", level=0)
                    with open(report_xml_path, "wb") as report_xml_file:
                        report_xml_file.write(ET.tostring(report_xml))
                    with open(
                        report_xml_path, "r", encoding="utf-8"
                    ) as report_xml_file:
                        report_xml = ET.fromstring(report_xml_file.read())
                else:
                    with open(
                        report_xml_path, "r", encoding="utf-8"
                    ) as report_xml_file:
                        report_xml = ET.fromstring(report_xml_file.read())
            else:
                report_xml = make_old_report(the_job)
            ET.indent(report_xml, space="\t", level=0)
            return Response({"status": "Success", "xml": ET.tostring(report_xml)})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
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
        try:
            the_job = models.Job.objects.get(id=pk)
            dependent_jobs = find_dependent_jobs(the_job)
            serializer = serializers.JobSerializer(dependent_jobs, many=True)
            return Response(serializer.data)
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

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
        try:
            old_job_id = models.Job.objects.get(id=pk).uuid
            new_job = clone_job(old_job_id)
            serializer = serializers.JobSerializer(new_job)
            return Response(serializer.data)
        except models.Job.DoesNotExist as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

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
        try:
            # Determine the program name based on the OS
            ccp4_python_program = "ccp4-python"
            if platform.system() == "Windows":
                ccp4_python_program += ".bat"
            ccp4_python = str(
                pathlib.Path(os.environ["CCP4"]) / "bin" / ccp4_python_program
            )
            manage_py = str(pathlib.Path(__file__).parent.parent.parent / "manage.py")
            job = models.Job.objects.get(id=pk)
            process = subprocess.Popen(
                [
                    ccp4_python,
                    manage_py,
                    "run_job",
                    "-ju",
                    f"{str(job.uuid)}",
                ],
                start_new_session=True,
            )
            job.process_id = process.pid
            job.save()
            serializer = serializers.JobSerializer(job)
            return Response(serializer.data)
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def container(self, request, pk=None):

        try:
            the_job = models.Job.objects.get(id=pk)
            container = json_for_job_container(the_job)
            return Response({"status": "Success", "result": container})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
        except FileNotFoundError as err:
            logger.exception(
                "Failed to find or encode json for job container",
                exc_info=err,
            )
            return Response({"status": "Failed", "reason": str(err)})

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

        try:
            the_job = models.Job.objects.get(id=pk)
            with open(
                the_job.directory / "diagnostic.xml", "r", encoding="UTF-8"
            ) as diagnostic_xml_file:
                diagnostic_xml = diagnostic_xml_file.read()
            return Response({"status": "Success", "xml": diagnostic_xml})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
        except FileNotFoundError as err:
            logger.exception(
                "Failed to find file %s",
                str(the_job.directory / "diagnostic.xml"),
                exc_info=err,
            )
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def digest(self, request, pk=None):

        try:
            the_job = models.Job.objects.get(id=pk)
            logger.info("Digesting file %s", request.GET.get("object_path"))
            response_dict = digest_param_file(
                the_job, request.GET.get("object_path")[:-1]
            )
            return Response({"status": "Success", "digest": response_dict})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def digest_param_file(self, request, pk=None):
        job_param_name = request.GET.get("job_param_name")
        object_path = job_param_name[:-1]
        try:
            the_job = models.Job.objects.get(id=pk)
            the_file = models.File.objects.get(
                job=the_job, job_param_name=job_param_name[:-1]
            )
            imports = models.FileImport.objects.filter(file=the_file)
            is_import = imports.count() > 0
            if is_import:
                object_path = f"{the_job.task_name}.inputData.{job_param_name[:-1]}"
            else:
                object_path = f"{the_job.task_name}.outputData.{job_param_name[:-1]}"
            response_dict = digest_param_file(the_job, object_path)
            return Response({"status": "Success", "digest": response_dict})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
        except Exception as err:
            logging.exception(
                "Failed to digest file %s %s", pk, object_path, exc_info=err
            )
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def def_xml(self, request, pk=None):
        """
        Retrieve the def XML file for a given job.

        Args:
            request: The HTTP request object.
            pk (int, optional): The primary key of the job.

        Returns:
            Response: A Response object containing the status and the def XML content
                      if the file is found, or an error message if the file is not found.
        Raises:
            FileNotFoundError: If the def XML file does not exist.
        """

        try:
            the_job = models.Job.objects.get(id=pk)
            def_xml_path = CCP4TaskManager.TASKMANAGER().lookupDefFile(
                name=the_job.task_name, version=None
            )
            with open(def_xml_path, "r") as def_xml_file:
                def_xml = def_xml_file.read()
                packedXML = ET.fromstring(def_xml)
                unpackedXML = load_nested_xml(packedXML)
                ET.indent(unpackedXML, " ")
                return Response({"status": "Success", "xml": ET.tostring(unpackedXML)})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
        except FileNotFoundError as err:
            logger.exception(
                "Failed to find file %s",
                def_xml_path,
                exc_info=err,
            )
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def validation(self, request, pk=None):
        """
        Retrieve the validation error_report in xml format.

        Args:
            request: The HTTP request object.
            pk (int, optional): The primary key of the job.

        Returns:
            Response: A Response object containing the status and the validation error_report in xml format.
        """

        try:
            the_job = models.Job.objects.get(id=pk)
            container: CContainer = get_job_container(the_job)
            error_etree: ET.Element = validate_container(container)
            stack_elements = error_etree.findall(".//stack")
            for stack_element in stack_elements:
                stack_element.getroot()
            ET.indent(error_etree, " ")
            return Response({"status": "Success", "xml": ET.tostring(error_etree)})
        except (ValueError, models.Job.DoesNotExist) as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
        except Exception as err:
            logger.exception(
                "Failed to validate plugin %s",
                the_job.task_name,
                exc_info=err,
            )
            return Response({"status": "Failed", "reason": str(err)})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def set_parameter(self, request, pk=None):
        """
        Set parameter in a job's input_params.xml

        Args:
            request. Unusually for a post, this will have the data JSON encoded
        """
        form_data = json.loads(request.body.decode("utf-8"))
        job = models.Job.objects.get(id=pk)
        object_path = form_data["object_path"]
        value = form_data["value"]
        try:
            result = set_parameter(job, object_path, value)

            return JsonResponse({"status": "Success", "updated_item": result})
        except CCP4ErrorHandling.CException as err:
            error_tree = getEtree(err)
            ET.indent(error_tree, " ")
            return JsonResponse(
                {"status": "Failed", "reason": ET.tostring(error_tree).decode("utf-8")}
            )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def upload_file_param(self, request, pk=None):
        """
        Set parameter in a job's input_params.xml

        Args:
            request. Unusually for a post, this will have the data JSON encoded
        """
        job = models.Job.objects.get(id=pk)
        try:
            result = upload_file_param(job, request)
            return JsonResponse({"status": "Success", "updated_item": result})
        except CCP4ErrorHandling.CException as err:
            error_tree = getEtree(err)
            ET.indent(error_tree, " ")
            return JsonResponse(
                {"status": "Failed", "reason": ET.tostring(error_tree).decode("utf-8")}
            )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[],
        serializer_class=serializers.JobSerializer,
    )
    def preview(self, request, pk=None):
        try:
            the_job = models.Job.objects.get(id=pk)
            the_viewer = request.data.get("viewer")
            preview_job(the_viewer, str(the_job.directory))
            return Response({"status": "Success"})
        except models.File.DoesNotExist as err:
            logging.exception("Failed to retrieve job with id %s", pk, exc_info=err)
            return Response({"status": "Failed", "reason": str(err)})
