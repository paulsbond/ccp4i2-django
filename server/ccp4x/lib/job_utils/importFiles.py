from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4File
from ccp4i2.dbapi import CCP4DbApi
from ...db import models
from ...lib.utils import uuid_from_no_hyphens, save_params_for_job


def findInputs(ofContainer, inputsFound=[]):
    for child in ofContainer.children():
        if isinstance(child, CCP4Container.CContainer):
            if child.objectName() != "outputData":
                findInputs(child, inputsFound)
        else:
            if isinstance(child, CCP4File.CDataFile):
                if not child in inputsFound:
                    inputsFound.append(child)
    return inputsFound


def _processInput(theJob, plugin, input):
    theFile = None
    if input.dbFileId is not None and len(str(input.dbFileId)) != 0:
        theFile = models.File.objects.get(
            uuid=str(uuid_from_no_hyphens(input.dbFileId))
        )
    else:
        if input.baseName is not None and len(str(input.baseName).strip()) != 0:
            sourceFilePath = pathlib.Path(str(input.relPath)) / str(input.baseName)
            if not sourceFilePath.exists():
                sourceFilePath = (
                    pathlib.Path(theJob.projectid.projectdirectory)
                    / str(input.relPath)
                    / str(input.baseName)
                )
            # Load file
            input.loadFile()
            input.setContentFlag()
            destFilePath = (
                pathlib.Path(theJob.projectid.projectdirectory)
                / "CCP4_IMPORTED_FILES"
                / sourceFilePath.name
            )
            while destFilePath.exists():
                fileRoot, fileExt = os.path.splitext(destFilePath.name)
                destFilePath = destFilePath.parent / "{}_1{}".format(fileRoot, fileExt)
            # print('src, UniqueDestFilePath', sourceFilePath, destFilePath)
            shutil.copyfile(sourceFilePath, destFilePath)
            # Now have to change the plugin to reflect the new location

            try:
                filetypeid = CCP4DbApi.FILETYPES_CLASS.index(
                    input.__class__.__name__[1:]
                )
                fileType = models.Filetypes.objects.get(filetypeid=filetypeid)
                # print('What I know about import is', str(valueDictForObject(input)))
                if (
                    not hasattr(input, "annotation")
                    or input.annotation is None
                    or len(str(input.annotation).strip()) == 0
                ):
                    annotation = "Imported from file {}".format(sourceFilePath.name)
                else:
                    annotation = str(input.annotation)
                createDict = {
                    "filename": str(destFilePath.name),
                    "annotation": annotation,
                    "filetypeid": fileType,
                    "jobid": theJob,
                    "jobparamname": input.objectName(),
                    "pathflag": 2,
                }
                # print(createDict)
                theFile = models.Files(**createDict)
                theFile.save()

                input.dbFileId.set(theFile.fileid)
                input.project.set(theJob.projectid.projectid)
                input.relPath.set("CCP4_IMPORTED_FILES")
                input.baseName.set(destFilePath.name)

                createDict = {
                    "fileid": theFile,
                    "sourcefilename": str(sourceFilePath),
                    "annotation": "",
                    "creationtime": time.time(),
                    "lastmodifiedtime": time.time(),
                    "checksum": input.checksum(),
                    "importnumber": "1",
                    "reference": "",
                }
                # print(createDict)
                newImportfile = models.Importfiles()
                newImportfile.save()
                for key in createDict:
                    setattr(newImportfile, key, createDict[key])
                    newImportfile.save()
            except ValueError as err:
                theFile = None
                logger.error(f"Encountered issue importing file {input.baseName}")

    if theFile is not None:
        theRole = models.Fileroles.objects.get(roletext="in")
        createDict = {
            "fileid": theFile,
            "jobid": theJob,
            "roleid": theRole,
            "jobparamname": input.objectName(),
        }
        fileUse = models.Fileuses(**createDict)
        fileUse.save()


def importFiles(theJob, plugin):
    inputs = findInputs(plugin.container, inputsFound=[])
    for input in inputs:
        _processInput(theJob, plugin, input)

    # removeDefaults(plugin.container)
    save_params_for_job(plugin, theJob, mode="JOB_INPUT")

    return plugin
