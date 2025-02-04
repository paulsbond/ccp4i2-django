import logging
import pathlib
import json
from ccp4i2.core.CCP4File import CDataFile
from ccp4i2.core.CCP4XtalData import CMtzDataFile
from django.utils.text import slugify
from core import CCP4File
from core import CCP4XtalData

from .find_objects import find_object_by_path
from .available_file_name_based_on import available_file_name_based_on
from .get_job_container import get_job_container
from .get_job_plugin import get_job_plugin
from .gemmi_split_mtz import gemmi_split_mtz
from .save_params_for_job import save_params_for_job
from .json_encoder import CCP4i2JsonEncoder
from ...db import models

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(f"ccp4x:{__name__}")


def upload_file_param(job: models.Job, request) -> dict:

    logger.warning("Received %s %s", job, request.POST)
    plugin = get_job_plugin(the_job=job)
    container = plugin.container
    object_path = request.POST.get("objectPath")
    files = request.FILES.getlist("file")
    param_object = find_object_by_path(container, object_path)
    # Look for existing file import for this job/job_param_name and delete
    # the associated file if exists
    try:
        existing_file = models.File.objects.get(
            job=job, job_param_name=param_object.objectName()
        )
        logger.warning("Upload will replace existing file [%s]", existing_file.path)
        try:
            (existing_file.path / existing_file.name).unlink()
        except Exception as err:
            logger.exception("Problem replacing [%s]", existing_file.path, exc_info=err)
        try:
            file_import = models.FileImport.objects.get(file=existing_file)
            file_import.delete()
        except models.FileImport.DoesNotExist:
            logger.warning("Existing file had no import [%s]", existing_file.path)
        existing_file.delete()
    except models.File.DoesNotExist:
        logger.warning("Upload will not replace existing file")

    assert isinstance(
        param_object,
        (
            CCP4File.CDataFile,
            CDataFile,
            CCP4XtalData.CMtzDataFile,
            CMtzDataFile,
        ),
    )
    assert len(files) == 1
    # Reached here and confirmed that the param to which we are associatnig the file is
    # based on CDataFile
    initial_download_project_folder = (
        "CCP4_DOWNLOADED_FILES"
        if isinstance(
            param_object,
            (
                CCP4XtalData.CMtzDataFile,
                CMtzDataFile,
            ),
        )
        else "CCP4_IMPORTED_FILES"
    )
    downloaded_file_path = download_file(job, files[0], initial_download_project_folder)

    if isinstance(
        param_object,
        (
            CCP4XtalData.CMtzDataFile,
            CMtzDataFile,
        ),
    ):
        logger.error(
            "Dealing with an MTZ file %s %s",
            isinstance(param_object, (CMtzDataFile,)),
            isinstance(param_object, (CCP4XtalData.CMtzDataFile,)),
        )
        column_selector = request.POST.get("column_selector")
        dest = (
            pathlib.Path(job.project.directory)
            / "CCP4_IMPORTED_FILES"
            / slugify(pathlib.Path(files[0].name).stem)
        ).with_suffix(pathlib.Path(files[0].name).suffix)
        logger.error("Preferred imported file destination is %s", dest)
        imported_file_path = gemmi_split_mtz(
            downloaded_file_path, column_selector, dest
        )
    else:
        imported_file_path = downloaded_file_path

    logger.error(
        "Final imported file destination is %s %s",
        imported_file_path,
        imported_file_path.name,
    )

    param_object.setFullPath(str(imported_file_path))
    param_object.loadFile()
    param_object.setContentFlag(reset=True)
    logger.warning("Content flag is %s", param_object.contentFlag)

    new_file = models.File(
        job=job,
        name=str(imported_file_path.name),
        directory=models.File.Directory.IMPORT_DIR,
        content=param_object.contentFlag,
        type=models.FileType.objects.get(name=param_object.QUALIFIERS["mimeTypeName"]),
        annotation=f"Imported from {files[0].name}",
        job_param_name=param_object.objectName(),
    )
    # Note deliberate explicit for != None instead of is not None
    if param_object.subType != None:
        new_file.sub_type = int(param_object.subType)
    else:
        new_file.sub_type = 1
    new_file.save()

    new_file_import = models.FileImport(
        file=new_file, name=files[0].name, checksum=param_object.checksum()
    )
    new_file_import.save()

    param_object.set(
        {
            "project": str(job.project.uuid).replace("-", ""),
            "baseName": new_file.name,
            "relPath": "CCP4_IMPORTED_FILES",
            "annotation": new_file.annotation,
            "dbFileId": str(new_file.uuid).replace("-", ""),
            "subType": new_file.sub_type,
            # "contentFlag": new_file.content,
        }
    )

    save_params_for_job(the_job_plugin=plugin, the_job=job)
    return json.loads(json.dumps(param_object, cls=CCP4i2JsonEncoder))


def download_file(job: models.Job, the_file, initial_download_project_folder: str):
    logger.warning("the_file is %s", the_file.name)
    file_stem = pathlib.Path(the_file.name).stem
    file_suffix = pathlib.Path(the_file.name).suffix
    destination_dir = (
        pathlib.Path(job.project.directory) / initial_download_project_folder
    )
    if not destination_dir.is_dir():
        destination_dir.mkdir()
    dest = (destination_dir / slugify(file_stem)).with_suffix(file_suffix)
    dest = available_file_name_based_on(dest)

    assert dest.is_relative_to(destination_dir)

    logger.warning("Settled on destination path %s", dest)
    with open(dest, "wb") as uploadFile:
        CHUNK = 1024 * 1024
        while True:
            chunk = the_file.read(CHUNK)
            if not chunk:
                break
            uploadFile.write(chunk)
        uploadFile.close()
    logger.warning("Upload complete")
    return dest
