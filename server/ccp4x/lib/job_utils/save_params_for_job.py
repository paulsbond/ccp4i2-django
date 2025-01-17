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
logger = logging.getLogger(f"ccp4x:{__name__}")


@using_django_pm
def save_params_for_job(
    the_job_plugin: CCP4PluginScript.CPluginScript,
    the_job: models.Job,
    mode="JOB_INPUT",
    exclude_unset=True,
):
    fileName = the_job_plugin.makeFileName(mode)
    # Rework to the directory of "the_job"
    relocated_file_path = the_job.directory / pathlib.Path(fileName).name

    if relocated_file_path.exists():
        CCP4Utils.backupFile(str(relocated_file_path), delete=False)

    f = CCP4File.CI2XmlDataFile(fullPath=(relocated_file_path))
    f.header = the_job_plugin.container.header
    f.header.function.set("PARAMS")
    f.header.projectName.set(the_job.project.name)
    f.header.projectId.set(str(the_job.project.uuid))
    f.header.jobNumber.set(the_job.number)
    f.header.jobId.set(str(the_job.uuid))
    f.header.setCurrent()
    f.header.pluginName.set(the_job.task_name)
    f.header.userId.set(getpass.getuser())
    old_job_container: CCP4Container.CContainer = the_job_plugin.container
    body_etree = old_job_container.getEtree()
    f.saveFile(bodyEtree=body_etree)
