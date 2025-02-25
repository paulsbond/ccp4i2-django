import datetime
import logging
import os
import pathlib
import shutil
import uuid

from ccp4i2.core import CCP4Container
from ccp4i2.core.CCP4File import CDataFile
from core import CCP4File
from ccp4i2.core import CCP4PluginScript
from ccp4i2.core.CCP4Data import CList
from ccp4i2.dbapi import CCP4DbApi
from ccp4i2.core.CCP4File import CI2XmlDataFile as CI2XmlDataFile

from ...db import models
from .save_params_for_job import save_params_for_job
from .find_objects import find_objects


logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def _process_input(
    theJob: models.Job,
    plugin: CCP4PluginScript.CPluginScript,
    input: CCP4File.CDataFile,
):
    theFile = None
    if input.dbFileId is not None and len(str(input.dbFileId)) != 0:
        theFile = models.File.objects.get(uuid=uuid.UUID(input.dbFileId))
    else:
        if input.baseName is not None and len(str(input.baseName).strip()) != 0:
            sourceFilePath = pathlib.Path(str(input.relPath)) / str(input.baseName)
            if not sourceFilePath.exists():
                sourceFilePath = (
                    pathlib.Path(theJob.project.directory)
                    / str(input.relPath)
                    / str(input.baseName)
                )
            # Load file
            input.loadFile()
            input.setContentFlag()
            destFilePath = (
                pathlib.Path(theJob.project.directory)
                / "CCP4_IMPORTED_FILES"
                / sourceFilePath.name
            )
            while destFilePath.exists():
                fileRoot, fileExt = os.path.splitext(destFilePath.name)
                destFilePath = destFilePath.parent / "{}_1{}".format(fileRoot, fileExt)
            logger.warning(
                "src %s, UniqueDestFilePath %s", sourceFilePath, destFilePath
            )
            shutil.copyfile(sourceFilePath, destFilePath)
            # Now have to change the plugin to reflect the new location

            try:

                file_mime_type = input.qualifiers("mimeTypeName")
                if len(file_mime_type) == 0:
                    logger.error(
                        "Class %s Does not have an associated mimeTypeName....ASK FOR DEVELOPER FIX",
                        str(input.objectName()),
                    )
                    if isinstance(input, CCP4File.CI2XmlDataFile) or isinstance(
                        input, CI2XmlDataFile
                    ):
                        file_mime_type = "application/xml"
                file_type_object = models.FileType.objects.get(name=file_mime_type)

                # print('What I know about import is', str(valueDictForObject(input)))
                if (
                    not hasattr(input, "annotation")
                    or input.annotation is None
                    or len(str(input.annotation).strip()) == 0
                ):
                    annotation = f"Imported from file {sourceFilePath.name}"
                else:
                    annotation = str(input.annotation)
                createDict = {
                    "name": str(destFilePath.name),
                    "annotation": annotation,
                    "type": file_type_object,
                    "job": theJob,
                    "job_param_name": input.objectName(),
                    "directory": 2,
                }
                # print(createDict)
                theFile = models.File(**createDict)
                theFile.save()

                input.dbFileId.set(theFile.uuid)
                input.project.set(str(theJob.project.uuid))
                input.relPath.set("CCP4_IMPORTED_FILES")
                input.baseName.set(destFilePath.name)

                createDict = {
                    "file": theFile,
                    "name": str(sourceFilePath),
                    "time": datetime.datetime.now(),
                    "last_modified": datetime.datetime.now(),
                    "checksum": input.checksum(),
                }
                # print(createDict)
                newImportfile = models.FileImport()
                newImportfile.save()
                for key in createDict:
                    setattr(newImportfile, key, createDict[key])
                    newImportfile.save()
            except ValueError as err:
                theFile = None
                logger.error(
                    f"Encountered issue - {err} importing file {input.baseName}"
                )

    if theFile is not None:
        theRole = models.FileUse.Role.IN
        createDict = {
            "file": theFile,
            "job": theJob,
            "role": theRole,
            "job_param_name": input.objectName(),
        }
        fileUse = models.FileUse(**createDict)
        fileUse.save()


def import_files(theJob, plugin):
    inputs = find_objects(
        plugin.container.inputData,
        lambda a: isinstance(
            a,
            (
                CCP4File.CDataFile,
                CDataFile,
            ),
        ),
        True,
    )
    logger.warning("In import_files %s", len(inputs))
    for the_input in inputs:
        _process_input(theJob, plugin, the_input)

    # removeDefaults(plugin.container)
    save_params_for_job(plugin, theJob, mode="JOB_INPUT")

    return plugin
