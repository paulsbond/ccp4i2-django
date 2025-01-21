from pathlib import Path
import logging
import uuid

from ccp4i2.core import CCP4TaskManager

from ...db import models
from ...db.ccp4i2_django_wrapper import using_django_pm
from .remove_container_default_values import remove_container_default_values
from .save_params_for_job import save_params_for_job


logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


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
    """
    Create a new job within a project.

    Args:
        projectId (str, optional): The UUID of the project. Defaults to None.
        projectName (str, optional): The name of the project. Defaults to None.
        parentJobId (str, optional): The UUID of the parent job. Defaults to None.
        taskName (str, optional): The name of the task to be executed. Defaults to None.
        jobNumber (str, optional): The job number. Defaults to None.
        jobId (str, optional): The UUID of the job. Defaults to None.
        saveParams (bool, optional): Whether to save parameters for the job. Defaults to True.
        title (str, optional): The title of the job. Defaults to None.

    Returns:
        str: The UUID of the newly created job.

    Raises:
        models.Job.DoesNotExist: If the parent job or project does not exist.
    """
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
            parent__isnull=True
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

    new_jobDir = Path(theProject.directory).joinpath(
        *(["CCP4_JOBS"] + [f"job_{jNo}" for jNo in nextJobNumber.split(".")])
    )

    if jobId is None:
        new_jobId = uuid.uuid4()
    elif "-" not in new_jobId:
        new_jobId = uuid.UUID(new_jobId)

    taskManager = CCP4TaskManager.CTaskManager()
    pluginClass = taskManager.getPluginScriptClass(taskName)
    if saveParams:
        new_jobDir.mkdir(exist_ok=True, parents=True)
    the_job_plugin = pluginClass(workDirectory=str(new_jobDir))

    if title is None:
        title = taskManager.getTitle(taskName)
    arg_dict = dict(
        uuid=new_jobId,
        number=str(nextJobNumber),
        status=1,
        evaluation=0,
        title=title,
        project=theProject,
        task_name=taskName,
        parent=parentJob,
    )
    logger.info("arg_dict %s", arg_dict)
    new_job = models.Job(**arg_dict)

    if saveParams:
        remove_container_default_values(the_job_plugin.container)
        save_params_for_job(the_job_plugin, new_job)
    new_job.save()

    return str(new_job.uuid)
