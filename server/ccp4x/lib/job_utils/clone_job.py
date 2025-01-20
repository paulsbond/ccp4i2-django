import logging
import uuid
from pathlib import Path
import datetime
from pytz import timezone
from ccp4i2.core import CCP4TaskManager
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core import CCP4File
from ...db import models
from ...db.ccp4i2_django_wrapper import using_django_pm
from .save_params_for_job import save_params_for_job
from .remove_container_default_values import remove_container_default_values
from .unset_output_data import unset_output_data

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


@using_django_pm
def clone_job(jobId: str = None):
    """
    Clone an existing job by creating a new job with the same parameters.

    Args:
        jobId (str, optional): The UUID of the job to be cloned. Defaults to None.

    Returns:
        models.Job: The newly created job instance.

    Raises:
        models.Job.DoesNotExist: If the job with the given UUID does not exist.
        Exception: If there is an error during the cloning process.
    """
    old_job = models.Job.objects.get(uuid=jobId)
    the_project = old_job.project
    task_name = old_job.task_name
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
    new_job_dir = Path(the_project.directory) / "CCP4_JOBS" / f"job_{next_job_number}"
    new_jobId = uuid.uuid4()

    task_manager = CCP4TaskManager.CTaskManager()
    plugin_class = task_manager.getPluginScriptClass(task_name)
    new_job_dir.mkdir(exist_ok=True, parents=True)
    the_job_plugin: CContainer = plugin_class(workDirectory=str(new_job_dir))
    # Load cloned parameters
    the_job_container: CContainer = the_job_plugin.container
    the_job_container.loadDataFromXml(str(old_job.directory / "input_params.xml"))

    # Unset the output file data, which should be recalculated for the new plugin, I guess
    # unset_output_data(the_job_plugin)

    new_job = models.Job(
        uuid=new_jobId,
        number=str(next_job_number),
        finish_time=datetime.datetime.fromtimestamp(0, tz=timezone("UTC")),
        status=1,
        evaluation=0,
        title=task_manager.getTitle(task_name),
        project=the_project,
        task_name=task_name,
        parent=None,
    )
    new_job.save()
    # remove_container_default_values(the_job_plugin.container)
    save_params_for_job(the_job_plugin, new_job)
    the_project.last_access = datetime.datetime.now(tz=timezone("UTC"))
    the_project.last_job_number = new_job.number
    the_project.save()

    return new_job
