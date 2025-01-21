import logging
from pathlib import Path
from django.utils.text import slugify
from ccp4i2.core import CCP4ErrorHandling
from ccp4i2.core import CCP4Container
from core import CCP4File
from core import CCP4ModelData
from ...db import models

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def set_output_file_names(
    container: CCP4Container.CContainer = None,
    projectId: str = None,
    jobNumber: str = None,
    force: bool = True,
):
    """
    Sets the output file names for a given job in a CCP4 project.
    Args:
        container (CCP4Container.CContainer, optional): The container holding the output data. Defaults to None.
        projectId (str, optional): The UUID of the project. Defaults to None.
        jobNumber (str, optional): The job number in the project. Defaults to None.
        force (bool, optional): If True, forces the setting of output paths even if they are already set. Defaults to True.
    Returns:
        CCP4ErrorHandling.CErrorReport: An error report object containing any errors encountered during the process.
    """
    myErrorReport = CCP4ErrorHandling.CErrorReport()
    relPath = Path("CCP4_JOBS").joinpath(
        *[f"job_{numberElement}" for numberElement in jobNumber.split(".")]
    )
    the_job = models.Job.objects.get(project__uuid=projectId, number=jobNumber)
    jobName = f"{jobNumber}_{slugify(the_job.project.name)}_{the_job.task_name}_"
    dataList = container.outputData.dataOrder()
    for objectName in dataList:
        try:
            dobj = container.outputData.find(objectName)
            if isinstance(dobj, CCP4File.CDataFile) and (force or not dobj.isSet()):
                dobj.setOutputPath(
                    jobName=jobName, projectId=projectId, relPath=str(relPath)
                )
            if isinstance(dobj, CCP4ModelData.CPdbDataFile):
                oldBaseName = str(Path(str(dobj.baseName)).stem)
                if dobj.contentFlag is None or int(dobj.contentFlag) == 1:
                    dobj.baseName.set(f"{oldBaseName}.pdb")
                elif int(dobj.contentFlag) == 2:
                    dobj.baseName.set(f"{oldBaseName}.cif")

        except Exception as err:
            logger.exception(
                "Exception in setOutputFileNames for %s",
                dobj.objectPath(),
                exc_info=err,
            )
    return myErrorReport
