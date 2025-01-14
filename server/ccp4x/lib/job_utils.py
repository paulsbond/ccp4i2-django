import pathlib
import uuid
import datetime
from pytz import timezone
from ..db import models
from ccp4i2.core import CCP4TaskManager
from ccp4i2.core import CCP4File
from ccp4i2.core import CCP4Utils
from ccp4i2.core import CCP4PluginScript


def CloneJob(jobId=None):
    oldJob = models.Job.objects.get(uuid=jobId)
    theProject = oldJob.project
    taskName = oldJob.task_name
    try:
        last_job_number = max(
            int(job.number)
            for job in models.Job.objects.filter(project=theProject).filter(
                parent__isnull=True
            )
        )
    except ValueError:
        last_job_number = 0

    nextJobNumber = str(last_job_number + 1)
    newJobDir = (
        pathlib.Path(theProject.directory) / "CCP4_JOBS" / f"job_{nextJobNumber}"
    )
    newJobId = uuid.uuid4()

    task_manager = CCP4TaskManager.CTaskManager()
    plugin_class = task_manager.getPluginScriptClass(taskName)
    newJobDir.mkdir(exist_ok=True, parents=True)
    the_job_plugin = plugin_class(workDirectory=str(newJobDir))
    # Load cloned parameters
    the_job_plugin.container.loadDataFromXml(str(oldJob.directory / "input_params.xml"))

    try:
        dataList = the_job_plugin.container.outputData.dataOrder()
        for objectName in dataList:
            dobj = the_job_plugin.container.outputData.find(objectName)
            if isinstance(dobj, CCP4File.CDataFile):
                dobj.unSet()
    except Exception as err:
        raise (err)

    newJob = models.Job(
        uuid=newJobId,
        number=str(nextJobNumber),
        finish_time=datetime.datetime.fromtimestamp(0),
        status=1,
        evaluation=0,
        title=task_manager.getTitle(taskName),
        project=theProject,
        task_name=taskName,
        parent=None,
    )
    # removeDefaults(the_job_plugin.container)
    saveParamsForJob(the_job_plugin, newJob)
    newJob.save()
    theProject.last_access = datetime.datetime.now(tz=timezone("UTC"))
    theProject.last_job_number = newJob.number
    theProject.save()

    return newJob.uuid


def saveParamsForJob(
    the_job_plugin: CCP4PluginScript.CPluginScript,
    theJob: models.Job,
    mode="JOB_INPUT",
    excludeUnset=True,
):
    fileName = the_job_plugin.makeFileName(mode)
    if pathlib.Path(fileName).exists():
        CCP4Utils.backupFile(fileName, delete=False)
    if the_job_plugin.container.header is None:
        the_job_plugin.container.addHeader()
    the_job_plugin.container.header.projectName.set(theJob.project.name)
    the_job_plugin.container.header.projectId.set(theJob.project.uuid)
    the_job_plugin.container.header.jobNumber.set(theJob.number)
    the_job_plugin.container.header.jobId.set(theJob.uuid)

    f = CCP4File.CI2XmlDataFile(fullPath=fileName)
    f.header = the_job_plugin.container.header
    f.header.function.set("PARAMS")
    f.header.setCurrent()
    bodyEtree = the_job_plugin.container.getEtree(excludeUnset=excludeUnset)
    f.saveFile(bodyEtree=bodyEtree)

    return
