from pathlib import Path
import logging
import os
import uuid
from ccp4i2.core import CCP4ModelData

from . import models
from .ccp4i2_django_dbapi import CCP4i2DjangoDbApi
from ..lib.job_utils.set_output_file_names import set_output_file_names


logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


class CCP4i2DjangoProjectsManager(object):

    def __init__(self):
        logger.debug("FakePM Init in")
        self._db = CCP4i2DjangoDbApi()
        logger.debug("FakePM Init out")
        super().__init__()

    def db(self):
        logger.debug("FakePM db")
        return self._db

    def __getattribute__(self, __name):
        logger.debug("CCP4i2DjangoProjectsManager being interrogated for %s", __name)
        return super().__getattribute__(__name)

    def setOutputFileNames(
        self, container=None, projectId=None, jobNumber=None, force=True
    ):
        return set_output_file_names(container, projectId, jobNumber, force)

    def interpretDirectory(self, path):
        absPath = os.path.abspath(path)
        theProject = None
        for project in models.Project.objects.all():
            # print(project.name, '{}/'.format(project.directory))
            if absPath.startswith("{}/".format(project.directory)):
                theProject = project
                break
        if theProject is not None:
            # projectName, relPath, projectId
            return (
                theProject.name,
                absPath[len(theProject.directory) + 1 :],
                str(theProject.uuid),
            )
        else:
            return [None, None, None]

    def getProjectDirectory(self, projectName=None, testAlias=True, projectId=None):
        logger.debug(
            "*****In FakeGetProjectDirectory %s, %s, %s",
            projectName,
            testAlias,
            projectId,
        )
        if projectId is not None:
            # Baffling edge case
            if testAlias and projectId == "CCP4I2_TOP":
                return str(Path(CCP4ModelData.__file__).parent.parent)
            try:
                projectId = uuid.UUID(projectId)
                theProject = models.Project.objects.get(uuid=projectId)
            except models.Project.DoesNotExist as err:
                logger.error(
                    "Error %s - In getProjectDirectory for non existent projectId %s",
                    err,
                    projectId,
                )
                return None
        else:
            try:
                theProject = models.Project.objects.get(name=projectName)
            except models.Project.DoesNotExist as err:
                logger.error(
                    "Error %s - In getProjectDirectory for non existent projectName %s",
                    err,
                    projectName,
                )
                return None
        return theProject.directory

    def jobDirectory(self, jobId=None, projectName=None, jobNumber=None):
        assert jobId is not None or (projectName is not None and jobNumber is not None)
        # logger.info('in FPM %s, %s, %s', jobId, projectName, jobNumber)
        if jobId is not None:
            return str(models.Job.objects.get(uuid=jobId).directory)
        else:
            return str(
                models.Job.objects.get(
                    project__name=projectName, number=jobNumber
                ).directory
            )

    def makeFileName(self, jobId=None, mode="PROGRAMXML"):
        the_job = models.Job.objects.get(uuid=jobId)
        defNames = {
            "ROOT": "",
            "PARAMS": "params.xml",
            "JOB_INPUT": "input_params.xml",
            "PROGRAMXML": "program.xml",
            "LOG": "log.txt",
            "STDOUT": "stdout.txt",
            "STDERR": "stderr.txt",
            "INTERRUPT": "interrupt_status.xml",
            "DIAGNOSTIC": "diagnostic.xml",
            "REPORT": "report.html",
            "DIAGNOSTIC_REPORT": "diagnostic_report.html",
            "TABLE_RTF": "tables.rtf",
            "TABLES_DIR": "tables_as_csv_files",
            "XML_TABLES_DIR": "tables_as_xml_files",
            "COM": "com.txt",
            "MGPICDEF": "report.mgpic.py",
            "PIC": "report.png",
            "RVAPIXML": "i2.xml",
        }
        jobPath = Path(the_job.directory) / defNames[mode]
        return str(jobPath)
