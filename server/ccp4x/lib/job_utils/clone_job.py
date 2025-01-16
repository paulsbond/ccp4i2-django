import logging
import uuid
from pathlib import Path
import datetime
from pytz import timezone
from ccp4i2.core import CCP4TaskManager
from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4File
from ...db import models
from ...db.ccp4i2_django_wrapper import using_django_pm
from .save_params_for_job import save_params_for_job
from .remove_container_default_values import remove_container_default_values

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")


@using_django_pm
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
    new_job_dir = Path(the_project.directory) / "CCP4_JOBS" / f"job_{next_job_number}"
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
        finish_time=datetime.datetime.fromtimestamp(0, tz=timezone("UTC")),
        status=1,
        evaluation=0,
        title=task_manager.getTitle(taskName),
        project=the_project,
        task_name=taskName,
        parent=None,
    )
    new_job.save()
    remove_container_default_values(the_job_plugin.container)
    save_params_for_job(the_job_plugin, new_job)
    the_project.last_access = datetime.datetime.now(tz=timezone("UTC"))
    the_project.last_job_number = new_job.number
    the_project.save()

    return new_job
