import logging

from ccp4i2.core import CCP4TaskManager
from ccp4i2.core import CCP4Container
from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db.models import Job

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")


@using_django_pm
def get_job_container(the_job: Job):
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
