import logging
import uuid
from pathlib import Path
from ...db import models
from ...db.ccp4i2_django_wrapper import using_django_pm
from ...lib.utils import uuid_from_no_hyphens
from ccp4i2.core import CCP4TaskManager
from .save_params_for_job import save_params_for_job
from .remove_container_default_values import remove_container_default_values

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")


@using_django_pm
def create_job(
    projectId: str = None,
    projectName: str = None,
    parentJobId: str = None,
    taskName: str = None,
    jobNumber: str = None,
    jobId: str = None,
    saveParams: bool = True,
    title: str = None,
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

    return newJob.uuid, newJob.number, theProject.uuid, parentJobId
