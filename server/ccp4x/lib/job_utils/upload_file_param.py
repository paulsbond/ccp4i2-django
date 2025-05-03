import logging
import pathlib
import json
import gemmi
from ccp4i2.core.CCP4File import CDataFile
from ccp4i2.core.CCP4XtalData import CMtzDataFile
from django.utils.text import slugify
from django.http import HttpRequest
from core import CCP4File
from core import CCP4XtalData
from core.CCP4XtalData import CMtzDataFile

from .find_objects import find_object_by_path
from .available_file_name_based_on import available_file_name_based_on
from .get_job_plugin import get_job_plugin
from .gemmi_split_mtz import gemmi_split_mtz
from .save_params_for_job import save_params_for_job
from .json_encoder import CCP4i2JsonEncoder
from .value_dict_for_object import value_dict_for_object
from .detect_file_type import detect_file_type
from .set_parameter import set_parameter, set_parameter_container
from ...db import models

logger = logging.getLogger(f"ccp4x:{__name__}")


def upload_file_param(job: models.Job, request: HttpRequest) -> dict:

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
            existing_file.path.unlink()
        except Exception as err:
            logger.exception("Problem replacing [%s]", existing_file.path, exc_info=err)
        try:
            file_import = models.FileImport.objects.get(file=existing_file)
            file_import.delete()
        except models.FileImport.DoesNotExist:
            logger.debug("Existing file had no import [%s]", existing_file.path)
        existing_file.delete()
    except models.File.DoesNotExist:
        logger.debug("Upload will not replace existing file")

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
    assert downloaded_file_path.exists()
    file_type = detect_file_type(downloaded_file_path)

    logger.error(
        "param_object is %s cls__name__ %s file_type %s",
        param_object,
        param_object.__class__.__name__,
        file_type,
    )

    if isinstance(
        param_object,
        (
            CCP4XtalData.CMtzDataFile,
            CMtzDataFile,
        ),
    ):
        column_selector = request.POST.get("column_selector", None)
        imported_file_path = handle_reflections(
            job, param_object, files[0].name, column_selector, downloaded_file_path
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
    logger.debug("Content flag is %s", param_object.contentFlag)

    try:
        type = models.FileType.objects.get(name=param_object.QUALIFIERS["mimeTypeName"])
    except models.FileType.DoesNotExist:
        type = models.FileType.objects.get(name="Unknown")
    new_file = models.File(
        job=job,
        name=str(imported_file_path.name),
        directory=models.File.Directory.IMPORT_DIR,
        type=type,
        annotation=f"Imported from {files[0].name}",
        job_param_name=param_object.objectName(),
    )
    # Note deliberate explicit for != None instead of is not None
    try:
        new_file.sub_type = int(param_object.subType)
    except Exception:
        new_file.sub_type = 1
    try:
        contentFlag = int(param_object.contentFlag)
        new_file.content = contentFlag
    except Exception:
        new_file.content = 0
        logging.warning("Unsettable contentFlag on %s", param_object.objectName())
    new_file.save()

    new_file_import = models.FileImport(
        file=new_file, name=files[0].name, checksum=param_object.checksum()
    )
    new_file_import.save()
    # Note: calling set_parameter here would invalidate "param_object" (since it takes job argument and constructs a new container),
    # replacing it with updated
    updated_object = set_parameter_container(
        container,
        object_path,
        {
            "project": str(job.project.uuid).replace("-", ""),
            "baseName": new_file.name,
            "relPath": initial_download_project_folder,
            "annotation": new_file.annotation,
            "dbFileId": str(new_file.uuid).replace("-", ""),
            "subType": new_file.sub_type,
        },
    )
    logger.error("Updated object %s", updated_object)
    save_params_for_job(the_job_plugin=plugin, the_job=job)

    return json.loads(json.dumps(updated_object, cls=CCP4i2JsonEncoder))


def download_file(job: models.Job, the_file, initial_download_project_folder: str):
    logger.debug("the_file is %s", the_file.name)
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

    logger.debug("Settled on destination path %s", dest)
    with open(dest, "wb") as uploadFile:
        CHUNK = 1024 * 1024
        while True:
            chunk = the_file.read(CHUNK)
            if not chunk:
                break
            uploadFile.write(chunk)
        uploadFile.close()
    logger.debug("Upload complete")
    return dest


def handle_reflections(
    job: models.Job,
    param_object: CMtzDataFile,
    file_name: str,
    column_selector: str,
    downloaded_file_path: pathlib.Path,
):
    logger.error(
        "Dealing with a reflection object %s %s",
        isinstance(param_object, (CMtzDataFile,)),
        isinstance(param_object, (CCP4XtalData.CMtzDataFile,)),
    )
    try:
        _ = gemmi.read_mtz_file(str(downloaded_file_path))
    except RuntimeError as err:
        logger.exception(
            "Error reading MTZ file %s", downloaded_file_path, exc_info=err
        )
        downloaded_file_path, default_column_selector = gemmi_convert_to_mtz(
            param_object, downloaded_file_path
        )
        if column_selector is None:
            column_selector = default_column_selector

    dest = (
        pathlib.Path(job.project.directory)
        / "CCP4_IMPORTED_FILES"
        / slugify(pathlib.Path(file_name).stem)
    ).with_suffix(pathlib.Path(file_name).suffix)
    logger.error("Preferred imported file destination is %s", dest)
    imported_file_path = gemmi_split_mtz(downloaded_file_path, column_selector, dest)
    return imported_file_path


def gemmi_convert_to_mtz(dobj: CMtzDataFile, downloaded_file_path: pathlib.Path):
    document = gemmi.cif.read_file(str(downloaded_file_path))
    block = gemmi.as_refln_blocks(document)[0]
    converter = gemmi.CifToMtz()
    returned_mtz = converter.convert_block_to_mtz(block)
    # print(returned_mtz.column_labels())
    dest = downloaded_file_path.with_suffix(".mtz")
    deduped_dest = available_file_name_based_on(dest)
    returned_mtz.write_to_file(str(deduped_dest))
    # print("dest", deduped_dest)
    analysis = find_column_selections(dobj, deduped_dest)
    # print(analysis)
    # FOr now assume that there is at least one matching column group and take the first
    selected_columns = analysis["options"][0]["columnPath"]
    print("selected_columns", selected_columns)
    return deduped_dest, selected_columns


def find_column_selections(data_object: CMtzDataFile, deduped_dest: pathlib.Path):
    data_object.setFullPath(str(deduped_dest))
    data_object.loadFile()
    # Data object suitable columns depend on the contents of the file...
    contents = data_object.getFileContent()
    # ...
    column_groups = contents.getColumnGroups()
    groups_dict = value_dict_for_object(column_groups)

    possibilities = []
    if isinstance(data_object, CCP4XtalData.CObsDataFile):
        possibilities = [
            column_group
            for column_group in groups_dict
            if column_group["columnGroupType"] == "Obs"
        ]
    elif isinstance(data_object, CCP4XtalData.CFreeRDataFile):
        possibilities = [
            column_group
            for column_group in groups_dict
            if column_group["columnGroupType"] == "FreeR"
        ]
    elif isinstance(data_object, CCP4XtalData.CPhsDataFile):
        possibilities = [
            column_group
            for column_group in groups_dict
            if column_group["columnGroupType"] == "Phs"
        ]
    elif isinstance(data_object, CCP4XtalData.CMapCoeffsDataFile):
        possibilities = handle_map_coeffs(groups_dict)

    if len(possibilities) == 0:
        return {"options": [], "originalName": deduped_dest.name}

    possibilities = sorted(possibilities, key=lambda example: -example["contentFlag"])
    for possibility in possibilities:
        possibility_column_path = "/*/{}/[{}]".format(
            possibility["dataset"],
            ",".join([column["columnLabel"] for column in possibility["columnList"]]),
        )
        possibility["columnPath"] = possibility_column_path
    # print("possibilities", possibilities)
    return {"options": possibilities, "originalName": deduped_dest.name}


def handle_map_coeffs(groups_dict: dict):
    fs = {}
    phis = {}
    for group in groups_dict:
        for column in group["columnList"]:
            if column["columnType"] == "F":
                fs[group["dataset"]] = column
            elif column["columnType"] == "P":
                phis[group["dataset"]] = column
    possibilities = []

    for key, f_column in fs.items():
        if key in phis:
            f_column["groupIndex"] = len(possibilities) + 1
            phis[key]["groupIndex"] = len(possibilities) + 1
            possibility = {
                "columnGroupType": "MapCoeffs",
                "contentFlag": 1,
                "dataset": key,
                "columnList": [f_column, phis[key]],
            }
            possibilities.append(possibility)

    return possibilities
