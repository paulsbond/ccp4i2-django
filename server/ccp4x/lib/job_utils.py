import pathlib
import uuid
import datetime
import getpass
import logging
from pytz import timezone
from ..db import models
from ccp4i2.core import CCP4TaskManager
from ccp4i2.core import CCP4File
from ccp4i2.core import CCP4Utils
from ccp4i2.core import CCP4PluginScript
from ccp4i2.core import CCP4Container

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger("root")


def clone_job(jobId=None):
    old_job = models.Job.objects.get(uuid=jobId)
    the_project = old_job.project
    taskName = old_job.task_name
    try:
        last_job_number = max(
            int(job.number)
            for job in models.Job.objects.filter(project=the_project).filter(
                parent__isnull=True
            )
        )
    except ValueError:
        last_job_number = 0

    next_job_number = str(last_job_number + 1)
    new_job_dir = (
        pathlib.Path(the_project.directory) / "CCP4_JOBS" / f"job_{next_job_number}"
    )
    new_jobId = uuid.uuid4()

    task_manager = CCP4TaskManager.CTaskManager()
    plugin_class = task_manager.getPluginScriptClass(taskName)
    new_job_dir.mkdir(exist_ok=True, parents=True)
    the_job_plugin: CCP4Container.CContainer = plugin_class(
        workDirectory=str(new_job_dir)
    )
    # Load cloned parameters
    the_job_plugin.container.loadDataFromXml(
        str(old_job.directory / "input_params.xml")
    )

    try:
        dataList = the_job_plugin.container.outputData.dataOrder()
        for object_name in dataList:
            dobj = the_job_plugin.container.outputData.find(object_name)
            if isinstance(dobj, CCP4File.CDataFile):
                dobj.unSet()
    except Exception as err:
        raise (err)

    new_job = models.Job(
        uuid=new_jobId,
        number=str(next_job_number),
        finish_time=datetime.datetime.fromtimestamp(0),
        status=1,
        evaluation=0,
        title=task_manager.getTitle(taskName),
        project=the_project,
        task_name=taskName,
        parent=None,
    )
    remove_container_default_values(the_job_plugin.container)
    save_params_for_job(the_job_plugin, new_job)
    new_job.save()
    the_project.last_access = datetime.datetime.now(tz=timezone("UTC"))
    the_project.last_job_number = new_job.number
    the_project.save()

    return new_job.uuid


def remove_container_default_values(container):
    for child in container.children():
        try:
            if _should_remove_child(child):
                remove_child(container, child)
        except Exception as err:
            logger.info("Issue with %s %s. %s", child, container, err)
            continue


def _should_remove_child(child):
    if hasattr(child, "object_name") and child.get("object_name")() not in [
        "inputData",
        "outputData",
    ]:
        if isinstance(child, CCP4Container.CContainer):
            return child.object_name() != "outputData"
        else:
            return not child.isSet(allowDefault=False, allSet=False)
    return False


def remove_child(container, child):
    if container.object_name() != "temporary":
        try:
            container.deleteObject(child.object_name())
        except Exception as err:
            logger.info(
                "Issue deleting %s from %s. %s",
                child.object_name(),
                container.object_name(),
                err,
            )


def save_params_for_job(
    the_job_plugin: CCP4PluginScript.CPluginScript,
    theJob: models.Job,
    mode="JOB_INPUT",
    excludeUnset=True,
):
    fileName = the_job_plugin.makeFileName(mode)
    if pathlib.Path(fileName).exists():
        CCP4Utils.backupFile(fileName, delete=False)

    f = CCP4File.CI2XmlDataFile(fullPath=fileName)
    f.header = the_job_plugin.container.header
    f.header.function.set("PARAMS")
    f.header.projectName.set(theJob.project.name)
    f.header.projectId.set(theJob.project.uuid)
    f.header.jobNumber.set(theJob.number)
    f.header.jobId.set(theJob.uuid)
    f.header.jobId.set(theJob.uuid)
    f.header.setCurrent()
    f.header.pluginName.set(theJob.task_name)
    f.header.userId.set(getpass.getuser())
    old_job_container: CCP4Container.CContainer = the_job_plugin.container
    bodyEtree = old_job_container.getEtree(excludeUnset=excludeUnset)
    f.saveFile(bodyEtree=bodyEtree)

    return
