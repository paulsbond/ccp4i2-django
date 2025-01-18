import uuid
from typing import List, TypedDict
import logging
from core import CCP4Container
from ccp4i2.core.CCP4Container import CContainer as CContainer
from core import CCP4File
from ccp4i2.core.CCP4File import CDataFile as CDataFile
from ccp4i2.core.CCP4File import CI2XmlDataFile as CI2XmlDataFile
from ccp4i2.dbapi import CCP4DbApi
from ...db import models

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


def find_file_objects(
    container: CContainer, role=None, starting_list: List[ItemAndRole] = None
) -> List[ItemAndRole]:

    assert role is not None

    if starting_list is None:
        starting_list: List[ItemAndRole] = []

    search_domain = []
    if isinstance(container, CContainer) or isinstance(
        container, CCP4Container.CContainer
    ):
        search_domain = container.children()

    elif isinstance(container, list):
        search_domain = container

    for child in search_domain:
        if (
            isinstance(child, CContainer)
            or isinstance(child, CCP4Container.CContainer)
            or isinstance(child, list)
        ):
            find_file_objects(child, role=role, starting_list=starting_list)
        elif isinstance(child, CDataFile) or isinstance(child, CCP4File.CDataFile):
            starting_list.append({"item": child, "role": role})

    return starting_list


def make_files_and_uses(job: models.Job, item_dicts: List[ItemAndRole]):
    for item_dict in item_dicts:
        item: CDataFile = item_dict["item"]
        role: int = item_dict["role"]
        if item.exists():
            logger.error(
                "File for param %s exists=%s" % (item.objectName(), item.exists())
            )
            the_file = create_new_file(job, item)
            # create_file_use(job, item, the_file, role)


def create_new_file(job: models.Job, item: CDataFile):
    logger.error("Creating new file %s" % item.objectName())
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
        logger.error(
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
