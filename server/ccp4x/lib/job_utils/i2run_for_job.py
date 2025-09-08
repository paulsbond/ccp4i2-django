from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4Data

from ...db import models
from .get_job_container import get_job_container


def i2run_for_job(job: models.Job):
    container = get_job_container(job)
    if not container:
        return None
    command: str = f"i2run {job.task_name}"
    for child in container.children():
        if isinstance(child, (CCP4Container.CContainer,)):
            if child.objectName() not in [
                "outputData",
                "guiAdmin",
                "guiControls",
                "patchSelection",
                "guiParameters",
                "temporary",
            ]:
                command = extend_i2run(command, child)
    return command


def extend_i2run(command: str, container: CCP4Container) -> str:
    for child in container.children():
        if isinstance(child, (CCP4Container.CContainer,)):
            command = extend_i2run(command, child)
        elif hasattr(child, "isSet") and child.isSet(allowDefault=False):
            command += f" --{child.objectPath()} {str(child)}"

        elif isinstance(child, (CCP4Data.CList,)) and len(child) > 0:
            command += f"list {child.objectPath()}"
    return command
