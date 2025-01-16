import logging
import pathlib
import getpass

from ccp4i2.core import CCP4File
from ccp4i2.core import CCP4Utils
from ccp4i2.core import CCP4PluginScript
from ccp4i2.core import CCP4Container
from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db import models

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")


@using_django_pm
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
    f.header.setCurrent()
    f.header.pluginName.set(theJob.task_name)
    f.header.userId.set(getpass.getuser())
    old_job_container: CCP4Container.CContainer = the_job_plugin.container
    bodyEtree = old_job_container.getEtree(excludeUnset=excludeUnset)
    f.saveFile(bodyEtree=bodyEtree)
