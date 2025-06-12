import os
import logging
from django.utils.text import slugify
from ccp4i2.core.CCP4File import CDataFile
from ccp4i2.core.CCP4ModelData import CPdbDataFile
from ccp4i2.core.CCP4PluginScript import CPluginScript
from core import CCP4File
from core import CCP4Data
from core import CCP4ModelData
from ...db import models

logger = logging.getLogger(f"ccp4x:{__name__}")


def patch_output_file_paths(
    job_plugin: CPluginScript, job: models.Job, instance_string: str = ""
):
    container = job_plugin.container
    dataList = container.outputData.dataOrder()
    for objectName in dataList:
        dobj = container.outputData.find(objectName)
        if isinstance(dobj, (CDataFile, CCP4File.CDataFile)):
            handle_cdatafile(job, dobj)
        elif isinstance(dobj, CCP4Data.COutputFileList):
            # Empty the current output file list array
            while len(dobj) > 0:
                dobj.remove(dobj[-1])
            for iItem in range(dobj.qualifiers()["listMaxLength"]):
                new_instance = dobj.makeItem()
                dobj.append(new_instance)
                handle_cdatafile(
                    job,
                    new_instance,
                    instance_string="_" + str(iItem),
                )


def handle_cdatafile(job: models.Job, dobj, instance_string=""):
    partPath = os.path.join(
        f"{job.number}_{job.project.name}_{dobj.objectName()}_{job.task_name}"
    )
    partPath = str(slugify(str(partPath)))
    if (
        isinstance(dobj, (CPdbDataFile, CCP4ModelData.CPdbDataFile))
        and dobj.contentFlag.isSet()
        and int(dobj.contentFlag) == 2
    ):
        fullPath = os.path.join(
            str(job.directory),
            partPath + instance_string + "." + dobj.fileExtensions()[1],
        )
    else:
        fullPath = os.path.join(
            str(job.directory),
            partPath + instance_string + "." + dobj.fileExtensions()[0],
        )
    # MN 2020-07-09
    # The digestion of a fullpath into a relpath in setFullPath is done only if checkDb is True
    # I don't know why that was not the case, so I am switching the default behaviour to be
    # manually setting elements of the files location, failing over to checkDb False
    try:
        dobj.setFullPath(fullPath, checkDb=True)
    except Exception as e:
        dobj.setFullPath(fullPath, checkDb=False)
