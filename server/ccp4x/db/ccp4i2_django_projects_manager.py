import os
from pathlib import Path
import logging
from django.utils.text import slugify
from ccp4i2.core import CCP4File
from ccp4i2.core import CCP4ErrorHandling
from ccp4i2.core import CCP4ModelData
from . import models
from ..lib.utils import uuid_from_no_hyphens

from .ccp4i2_django_dbapi import CCP4i2DjangoDbApi

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")


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
        myErrorReport = CCP4ErrorHandling.CErrorReport()
        relPath = Path("CCP4_JOBS").joinpath(
            [f"job_{numberElement}" for numberElement in jobNumber.split(".")]
        )
        the_job = models.Job.objects.get(project__uuid=projectId, number=jobNumber)
        jobName = f"{jobNumber}_{slugify(the_job.uuid.name)}_{the_job.taskname}_"
        dataList = container.outputData.dataOrder()
        for objectName in dataList:
            try:
                dobj = container.outputData.find(objectName)
                # print 'setOutputData get',objectName,dobj.get(),dobj.isSet()
                if isinstance(dobj, CCP4File.CDataFile) and (force or not dobj.isSet()):
                    dobj.setOutputPath(
                        jobName=jobName, projectId=projectId, relPath=relPath
                    )
                if isinstance(dobj, CCP4ModelData.CPdbDataFile):
                    oldBaseName, _ = os.path.splitext(str(dobj.baseName))
                    if dobj.contentFlag is None or int(dobj.contentFlag) == 1:
                        dobj.baseName.set(f"{oldBaseName}.pdb")
                    if int(dobj.contentFlag) == 2:
                        dobj.baseName.set(f"{oldBaseName}.cif")

            except Exception as err:
                logger.error(
                    "Exception in setOutputFileNames for %s %s",
                    dobj.objectPath(),
                    str(err),
                )
        return myErrorReport

    def interpretDirectory(self, path):
        absPath = os.path.abspath(path)
        logger.info("absPath %s", absPath)
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
                theProject.uuid,
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
                if "-" not in projectId:
                    projectId = uuid_from_no_hyphens(projectId)
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


def upload_file_to_job(fileRoot="output", jobId=None, fileExtension=".txt", file=b""):
    the_job = models.Job.objects.get(uuid=jobId)
    baseName = f"{fileRoot}{fileExtension}"
    filePath = os.path.join(the_job.directory, baseName)
    iFile = 0
    while os.path.exists(filePath):
        baseName = f"{fileRoot}_{iFile}{fileExtension}"
        filePath = os.path.join(the_job.directory, baseName)
        iFile += 1
    with open(filePath, "wb") as outputFile:
        outputFile.write(file)
    relPath = os.path.join(
        "CCP4_JOBS", "/".join([f"job_{jN}" for jN in the_job.jobnumber.split(".")])
    )
    return {
        "project": the_job.uuid.uuid,
        "relPath": relPath,
        "baseName": baseName,
    }


def getProjectDirectory(projectId=None, projectName=None, jobId=None):
    if projectId is not None:
        return models.Project.objects.get(uuid=projectId).directory
    elif projectName is not None:
        return models.Project.objects.get(name=projectName).directory
    elif jobId is not None:
        return models.Job.objects.get(uuid=jobId).project.directory
    return None


def updateJobStatus(jobId=None, statusId=None):
    the_job = models.Jobs.objects.get(jobid=jobId)
    theStatus = models.Jobstatus.objects.get(statusid=statusId)
    the_job.status = theStatus
    the_job.save()
    return the_job.jobid, the_job.uuid.uuid, theStatus.statustext
