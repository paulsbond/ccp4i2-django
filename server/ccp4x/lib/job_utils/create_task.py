import uuid
import logging
from .create_job import create_job
from .set_input_by_context_job import set_input_by_context_job
from ...db import models

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def create_task(the_project: models.Project, arg: any):
    """
    Creates a new task within the given project.

    Args:
        the_project (models.Project): The project in which the task will be created.
        arg (dict): A dictionary containing the task details. Must include 'task_name'.

    Returns:
        models.Job: The newly created job object.

    Raises:
        KeyError: If 'task_name' is not found in arg.
        models.Job.DoesNotExist: If the job with the created UUID does not exist.
    """

    task_name = arg["task_name"]
    new_job_uuid = create_job(projectId=the_project.uuid, taskName=task_name)
    context_job_uuid = arg.get("context_job_uuid", None)
    if context_job_uuid is None:
        context_job = models.Job.objects.filter(project=the_project).last()
        print(context_job)
        if context_job is not None:
            set_input_by_context_job(str(new_job_uuid), str(context_job.uuid))
    new_job = models.Job.objects.get(uuid=new_job_uuid)
    return new_job
