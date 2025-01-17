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

    taskManager = CCP4TaskManager.CTaskManager()

    pluginClass = taskManager.getPluginScriptClass(the_job.task_name)
    try:
        pluginInstance = pluginClass(
            workDirectory=str(the_job.directory), parent=parent, dbHandler=dbHandler
        )
    except Exception as err:
        logger.error("Error in get_job_plugin %s", err)
        traceback.print_exc()
        return None

    defFile = the_job.directory / "params.xml"
    if not defFile.exists():
        # logger.info('No params.xml at %s', defFile)
        defFile1 = the_job.directory / "input_params.xml"
        if not defFile1.exists():
            # logger.info('No params.xml at %s', defFile1)
            raise Exception("no defFile found")
        defFile = defFile1
    pluginInstance.container.loadDataFromXml(
        str(defFile), check=False, loadHeader=False
    )
    return pluginInstance
