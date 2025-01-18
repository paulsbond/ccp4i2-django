import logging

from ccp4i2.core import CCP4TaskManager
from ccp4i2.core import CCP4Container
from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db.models import Job

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


@using_django_pm
def get_job_container(the_job: Job):
    """
    Retrieves and loads a job container for the given job.

    This function looks up the definition file for the specified job task,
    creates a container, and loads its contents from the definition file.
    It then attempts to load additional data from either 'params.xml' or
    'input_params.xml' located in the job's directory.

    Args:
        the_job (Job): The job object containing task information and directory paths.

    Returns:
        CCP4Container.CContainer: The loaded job container.
    """
    defFile = CCP4TaskManager.CTaskManager().lookupDefFile(
        name=the_job.task_name, version=None
    )
    # print 'CProjectDirToDb.globJobs defFile',defFile
    container = CCP4Container.CContainer()
    container.loadContentsFromXml(defFile, guiAdmin=True)
    if (the_job.directory / "params.xml").exists():
        container.loadDataFromXml(str(the_job.directory / "params.xml"))
    else:
        container.loadDataFromXml(str(the_job.directory / "input_params.xml"))
    return container
