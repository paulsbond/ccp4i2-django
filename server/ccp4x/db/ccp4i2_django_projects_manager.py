import os
from pathlib import Path
import uuid
import traceback
import logging
from django.utils.text import slugify
from ccp4i2.core import CCP4Utils
from ccp4i2.core import CCP4File
from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4TaskManager
from ccp4i2.core import CCP4ErrorHandling
from core import CCP4ProjectsManager
from ccp4i2.core import CCP4ModelData
from xml.etree import ElementTree as ET
from . import models
from ..lib.utils import uuid_from_no_hyphens
from ..lib.job_utils import remove_container_default_values
from .ccp4i2_django_dbapi import ccp4i2_django_dbapi

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")

# Decoorator to install and use FakeProjectManager


def using_django_pm(func):
    def wrapper(*args, **kwargs):
        logger.debug("Something is happening before the function is called.")
        oldPM = CCP4ProjectsManager.CProjectsManager.insts
        # result = None
        try:
            CCP4ProjectsManager.CProjectsManager.insts = CCP4i2DjangoProjectsManager()
            result = func(*args, **kwargs)
        except Exception as err:
            logging.error("Encountered issue while in FakePM decorator %s" % err)
            traceback.print_exc()
        finally:
            if oldPM is not None:
                CCP4ProjectsManager.CProjectsManager.insts = oldPM
            logger.warning("Something is happening after the function is called.")
        return result

    return wrapper


class CCP4i2DjangoProjectsManager(object):

    def __init__(self):
        logger.debug("FakePM Init in")
        self._db = ccp4i2_django_dbapi()
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
                return os.environ["CCP4I2_TOP"]
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


def getproject_jobFileName(
    projectId=None, fileName=None, jobNumber="1", subJobNumber=""
):
    # MN: This is mostly deeply flawed logic, and not at all how job numbers should work ! Copied from CDbApi and rescued for
    # "." in jobNumber
    if subJobNumber != "":
        fname = os.path.join(
            getProjectDirectory(projectId=projectId),
            "CCP4_JOBS",
            "job_" + jobNumber,
            "job_" + subJobNumber,
            fileName,
        )
    else:
        if "." in jobNumber:
            jobNumberPathElements = [f"job_{number}" for number in jobNumber.split(".")]
            fname = os.path.join(
                getProjectDirectory(projectId=projectId),
                "CCP4_JOBS",
                *jobNumberPathElements,
                fileName,
            )
        else:
            fname = os.path.join(
                getProjectDirectory(projectId=projectId),
                "CCP4_JOBS",
                "job_" + jobNumber,
                fileName,
            )
    return fname


@using_django_pm
def getproject_jobFile(
    projectId=None, projectName=None, fileName=None, jobNumber="1", subJobNumber=""
):
    if projectId is None:
        if projectName is not None:
            projectId = models.Projects.objects.get(projectname=projectName).uuid
    fname = getproject_jobFileName(projectId, fileName, jobNumber, subJobNumber)
    d = fname
    if fname.endswith(".png"):
        with open(fname, "rb") as f:
            d = f.read()
    else:
        with open(fname, "rb") as f:
            d = f.read()
    return d


def updateJobStatus(jobId=None, statusId=None):
    the_job = models.Jobs.objects.get(jobid=jobId)
    theStatus = models.Jobstatus.objects.get(statusid=statusId)
    the_job.status = theStatus
    the_job.save()
    return the_job.jobid, the_job.uuid.uuid, theStatus.statustext


@using_django_pm
def create_job(
    projectId=None,
    projectName=None,
    parentJobId=None,
    taskName=None,
    jobNumber=None,
    jobId=None,
    saveParams=True,
    title=None,
):
    logger.debug("%s, %s", projectName, projectId)
    if parentJobId is not None and projectId is None:
        parentJob = models.Job.objects.get(uuid=parentJobId)
        theProject = parentJob.project
    elif projectId is None and projectName is not None:
        parentJob = None
        theProject = models.Project.objects.get(name=projectName)
        projectId = theProject.uuid
    else:
        parentJob = None
        theProject = models.Project.objects.get(uuid=projectId)

    if jobNumber is None:
        project_jobs = models.Job.objects.filter(project__uuid=projectId).filter(
            parent_job__isnull=True
        )
        if len(project_jobs) == 0:
            lastJobNumber = 0
        else:
            lastJobNumber = sorted([int(a.number) for a in project_jobs])[-1]
        lastJobNumber = str(lastJobNumber)
    else:
        jobNumberElements = jobNumber.split(".")
        jobNumberElements[-1] = str(int(jobNumberElements[-1]) - 1)
        lastJobNumber = ".".join(jobNumberElements)

    jobNumberElements = lastJobNumber.split(".")
    jobNumberElements[-1] = str(int(jobNumberElements[-1]) + 1)
    nextJobNumber = ".".join(jobNumberElements)

    newJobDir = Path(theProject.directory).joinpath(
        ["CCP4_JOBS"] + [f"job_{jNo}" for jNo in nextJobNumber.split(".")]
    )

    if jobId is None:
        newJobId = uuid.uuid4()
    else:
        if "-" not in newJobId:
            newJobId = uuid_from_no_hyphens(newJobId)

    taskManager = CCP4TaskManager.CTaskManager()
    pluginClass = taskManager.getPluginScriptClass(taskName)
    if saveParams:
        newJobDir.mkdir(exist_ok=True, parents=True)
    the_job_plugin = pluginClass(workDirectory=str(newJobDir))

    if title is None:
        title = taskManager.getTitle(taskName)
    argDict = dict(
        uuid=newJobId,
        number=str(nextJobNumber),
        status=1,
        evaluation=None,
        title=title,
        project=theProject,
        task_name=taskName,
        parent_job=parentJob,
    )
    logger.info("argDict %s", argDict)
    newJob = models.Job(**argDict)

    if saveParams:
        remove_container_default_values(the_job_plugin.container)
        save_params_for_job(the_job_plugin, newJob)
    newJob.save()

    return newJob.jobid, newJob.jobnumber, theProject.uuid, parentJobId


@using_django_pm
def get_job_plugin(the_job, parent=None, dbHandler=None):
    taskManager = CCP4TaskManager.CTaskManager()

    pluginClass = taskManager.getPluginScriptClass(the_job.taskname)
    try:
        pluginInstance = pluginClass(
            workDirectory=the_job.jobDirectory, parent=parent, dbHandler=dbHandler
        )
    except Exception as err:
        logger.error("Error in get_job_plugin %s", err)
        traceback.print_exc()
        return None

    defFile = os.path.join(the_job.jobDirectory, "params.xml")
    if not os.path.exists(defFile):
        # logger.info('No params.xml at %s', defFile)
        defFile1 = os.path.join(the_job.jobDirectory, "input_params.xml")
        if not os.path.exists(defFile1):
            # logger.info('No params.xml at %s', defFile1)
            raise Exception("no defFile found")
        defFile = defFile1
    pluginInstance.container.loadDataFromXml(defFile, check=False, loadHeader=False)
    return pluginInstance


@using_django_pm
def save_params_for_job(the_job_plugin, the_job, mode="JOB_INPUT", excludeUnset=True):
    # logger.info('into saveParams for %s excludeUnset: %s', the_job.jobnumber, excludeUnset)
    # sys.stdout.flush()
    fileName = the_job_plugin.makeFileName(mode)
    # logger.info('saveParams in %s', fileName)
    # sys.stdout.flush()
    if os.path.exists(fileName):
        _ = CCP4Utils.backupFile(fileName, delete=False)
    if the_job_plugin.container.header is None:
        the_job_plugin.container.addHeader()
    the_job_plugin.container.header.name.set(the_job.uuid.name)
    the_job_plugin.container.header.uuid.set(the_job.uuid.uuid)
    the_job_plugin.container.header.jobNumber.set(the_job.jobnumber)
    the_job_plugin.container.header.jobId.set(the_job.jobid)
    f = CCP4File.CI2XmlDataFile(fullPath=fileName)
    f.header.set(the_job_plugin.container.header)
    f.header.function.set("PARAMS")
    f.header.setCurrent()
    bodyEtree = the_job_plugin.container.getEtree(excludeUnset=excludeUnset)
    ET.indent(bodyEtree)
    f.saveFile(bodyEtree=bodyEtree)
    # logger.info('out of saveParams for %s excludeUnset: %s', the_job.jobnumber, excludeUnset)
    # sys.stdout.flush()

    return


@using_django_pm
def getJobContainer(the_job: models.Job):
    defFile = CCP4TaskManager.CTaskManager().lookupDefFile(
        name=the_job.task_name, version=None
    )
    # print 'CProjectDirToDb.globJobs defFile',defFile
    container = CCP4Container.CContainer()
    container.loadContentsFromXml(defFile, guiAdmin=True)
    if os.path.exists(os.path.join(the_job.jobDirectory, "params.xml")):
        container.loadDataFromXml(os.path.join(the_job.jobDirectory, "params.xml"))
    else:
        container.loadDataFromXml(
            os.path.join(the_job.jobDirectory, "input_params.xml")
        )
    return container


@using_django_pm
def setJobParameterByXML(jobId, objectPath, valueXMLText):
    newValueEtree = ET.fromstring(valueXMLText)
    the_job = models.Job.objects.get(uuid=jobId)
    the_job_plugin = get_job_plugin(the_job)
    objectElement = the_job_plugin.container.locateElement(objectPath)
    objectElement.unSet()
    objectElement.setEtree(newValueEtree)
    save_params_for_job(the_job_plugin=the_job_plugin, the_job=the_job)
    return ET.tostring(objectElement.getEtree()).decode("utf-8")
