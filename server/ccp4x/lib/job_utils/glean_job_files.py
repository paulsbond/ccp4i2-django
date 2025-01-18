import uuid
from typing import List, TypedDict
import logging
from core import CCP4Container
from core import CCP4File
from core import CCP4PerformanceData
from core import CCP4Data
from ccp4i2.core.CCP4Container import CContainer as CContainer
from ccp4i2.core.CCP4File import CDataFile as CDataFile
from ccp4i2.core.CCP4File import CI2XmlDataFile as CI2XmlDataFile
from ccp4i2.core.CCP4PerformanceData import CPerformanceIndicator
from ...db import models
from .find_objects import find_objects

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


class ItemAndRole(TypedDict):
    item: CDataFile
    role: int


def glean_job_files(
    jobId: str = None,
    container: CContainer = None,
    roleList: List[int] = [0, 1],
    unSetMissingFiles=True,
):

    job = models.Job.objects.get(uuid=uuid.UUID(jobId))
    inputs = []
    outputs = []
    if 1 in roleList:
        inputs = find_file_objects(container.inputData, role=1)
        make_file_uses(job, inputs)
    if 0 in roleList:
        outputs = find_file_objects(container.outputData, role=0)
        make_files_and_uses(job, outputs)
    glean_performance_indicators(container.outputData, job)


def find_file_objects(
    container: CContainer, role=None, starting_list: List[ItemAndRole] = None
) -> List[ItemAndRole]:

    objects_found = find_objects(
        container, lambda a: isinstance(a, CCP4File.CDataFile), True
    )
    items_with_roles = [{"role": role, "item": item} for item in objects_found]

    return items_with_roles


def make_files_and_uses(job: models.Job, item_dicts: List[ItemAndRole]):
    for item_dict in item_dicts:
        item: CDataFile = item_dict["item"]
        if item.exists():
            logger.debug(
                "File for param %s exists=%s" % (item.objectName(), item.exists())
            )
            _ = create_new_file(job, item)
            # create_file_use(job, item, the_file, role)


def create_new_file(job: models.Job, item: CDataFile):
    logger.info("Creating new file %s" % item.objectName())
    file_type = item.qualifiers("mimeTypeName")
    if len(file_type) == 0:
        logger.info(
            "Class %s Does not have an associated mimeTypeName....ASK FOR DEVELOPER FIX",
            str(item.__class__),
        )
        if isinstance(type, CCP4File.CI2XmlDataFile) or isinstance(CI2XmlDataFile):
            file_type = "application/xml"
    file_type_object = models.FileType.objects.get(name=file_type)
    sub_type = getattr(item, "subType", None)
    if sub_type is not None:
        sub_type = int(sub_type)
    content = getattr(item, "contentFlag", None)
    if content is not None:
        content = str(content)
    annotation = getattr(item, "annotation", None)
    if annotation is not None:
        annotation = str(annotation)
    name = getattr(item, "baseName", None)
    if name is not None:
        name = str(name)
    job_param_name = item.objectName()
    directory = 1

    try:
        the_file = models.File(
            name=name,
            annotation=annotation,
            type=file_type_object,
            sub_type=sub_type,
            content=content,
            job=job,
            job_param_name=job_param_name,
            directory=directory,
        )
        the_file.save()
        item.dbFileId.set(str(the_file.uuid))
        logger.info("Created File for param %s" % item.objectName())
    except Exception as err:
        logger.exception("Exception harvesting %s", job_param_name, exc_info=err)
    return the_file


def create_file_use(job: models.Job, item: CDataFile, the_file: models.File, role: int):
    try:
        file_use = models.FileUse(
            file=the_file, job=job, job_param_name=item.objectName(), role=role
        )
        file_use.save()
    except Exception as err:
        logger.exception(
            "Failed in making file use for %s job %s role %s"
            % (
                item.objectName(),
                job.number,
                role,
            ),
            exc_info=err,
        )
    logger.info("Created FileUse for param %s" % item.objectName())


def make_file_uses(job: models.Job, item_dicts: List[ItemAndRole]):
    for item_dict in item_dicts:
        item: CDataFile = item_dict["item"]
        role: int = item_dict["role"]
        file_uuid_member = getattr(item, "dbFileId", None)
        if file_uuid_member is None:
            continue
        else:
            file_uuid_str = str(file_uuid_member)
            if len(file_uuid_str.strip()) == 0:
                logger.info(
                    "dbFileId on parameter %s is zero length" % item.objectName()
                )
                continue
            file_uuid = uuid.UUID(file_uuid_str)
        logger.debug(
            "objectName [%s] iSet[%s] exists[%s] uuid_str[%s]"
            % (
                item.objectName(),
                item.isSet(),
                item.exists(),
                file_uuid_str,
            )
        )
        if item.isSet() and item.exists() and hasattr(item, "objectName"):
            the_file = models.File.objects.get(uuid=file_uuid)
            try:
                file_use = models.FileUse.objects.get(file=the_file, job=job, role=role)
                logging.error(
                    "In trying to save [%s %s %s %s] found existing FileUse [%s %s %s %s]"
                    % (
                        the_file,
                        job,
                        role,
                        item.objectName(),
                        file_use.file,
                        file_use.job,
                        file_use.role,
                        file_use.job_param_name,
                    )
                )
            except models.FileUse.DoesNotExist:
                try:
                    fileUse: models.FileUse = models.FileUse(
                        file=the_file,
                        job=job,
                        role=role,
                        job_param_name=item.objectName(),
                    )
                    logger.info("Created FileUse for parameter %s" % item.objectName())
                    fileUse.save()
                except models.File.DoesNotExist as err:
                    logger.exception(
                        "Failed finding file for new file_use %s" % file_uuid,
                        exc_info=err,
                    )
                except Exception as err:
                    logger.exception(
                        "Different exception harvesting %s %s %s"
                        % (
                            job.number,
                            role,
                            item.objectName(),
                        ),
                        exc_info=err,
                    )


def glean_performance_indicators(container: CContainer, the_job: models.Job) -> None:
    kpis = find_objects(
        container,
        lambda a: isinstance(a, CCP4PerformanceData.CPerformanceIndicator),
        True,
    )
    for kpi in kpis:
        for kpi_param_name in kpi.dataOrder():
            value = getattr(kpi, kpi_param_name)
            if value is None:
                continue

            job_value_key, created = models.JobValueKey.objects.get_or_create(
                name=str(kpi_param_name), defaults={"description": str(kpi_param_name)}
            )
            try:
                if isinstance(value, CCP4Data.CFloat):
                    model_class = models.JobFloatValue
                    value = float(value)
                elif isinstance(value, CCP4Data.CString) and len(str(value)) > 0:
                    model_class = models.JobCharValue
                    value = str(value)
                else:
                    continue
            except TypeError as err:
                logging.debug("Failed to glean value", exc_info=err)
                continue

            try:
                kpi_object = model_class(job=the_job, key=job_value_key, value=value)
                kpi_object.save()
            except TypeError as err:
                logger.exception(
                    "Failed saving value %s for key %s" % (value, kpi_param_name),
                    exc_info=err,
                )
