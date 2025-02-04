import logging
import traceback

from ccp4i2.core import CCP4TaskManager
from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db.ccp4i2_django_db_handler import CCP4i2DjangoDbHandler
from ...db.models import Job

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


@using_django_pm
def get_job_plugin(the_job: Job, parent=None, dbHandler: CCP4i2DjangoDbHandler = None):
    """
    Retrieves and initializes a job plugin instance based on the provided job.

    Args:
        the_job (Job): The job object containing details such as task name and directory.
        parent (optional): The parent object, if any. Defaults to None.
        dbHandler (CCP4i2DjangoDbHandler, optional): The database handler for CCP4i2. Defaults to None.

    Returns:
        pluginInstance: An instance of the plugin class initialized with the job's parameters.
        None: If an error occurs during plugin initialization.

    Raises:
        Exception: If no parameter definition file (params.xml or input_params.xml) is found in the job directory.
    """

    taskManager = CCP4TaskManager.CTaskManager()

    pluginClass = taskManager.getPluginScriptClass(the_job.task_name)
    try:
        pluginInstance = pluginClass(
            workDirectory=str(the_job.directory), parent=parent, dbHandler=dbHandler
        )
    except Exception as err:
        logger.exception("Error in get_job_plugin", exc_info=err)
        return None

    params_path = the_job.directory / "params.xml"
    fallback_params_path = the_job.directory / "input_params.xml"
    if the_job.status in [Job.Status.UNKNOWN, Job.Status.PENDING]:
        params_path = the_job.directory / "input_params.xml"
        fallback_params_path = the_job.directory / "params.xml"

    defFile = params_path
    if not defFile.exists():
        # logger.info('No params.xml at %s', defFile)
        defFile1 = fallback_params_path
        if not defFile1.exists():
            # logger.info('No params.xml at %s', defFile1)
            raise Exception("no defFile found")
        defFile = defFile1
    pluginInstance.container.loadDataFromXml(
        str(defFile), check=False, loadHeader=False
    )
    return pluginInstance
