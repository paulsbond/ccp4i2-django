import uuid
from typing import List, TypedDict
from core import CCP4Container
from ccp4i2.core.CCP4Container import CContainer as CContainer
from core import CCP4File
from ccp4i2.core.CCP4File import CDataFile as CDataFile
from ...db import models


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
        make_files(job, outputs)


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


def make_files(job: models.Job, item_dicts: List[ItemAndRole]):
    for item_dict in item_dicts:
        item: CDataFile = item_dict["item"]
        role: int = item_dict["role"]
        print(str(item), item.dbFileId)


def make_file_uses(job: models.Job, item_dicts: List[ItemAndRole]):
    for item_dict in item_dicts:
        item: CDataFile = item_dict["item"]
        role: int = item_dict["role"]
        if (
            hasattr(item, "dbFileId")
            and len(str(getattr(item, "dbFileId")).strip()) > 0
            and hasattr(item, "objectName")
        ):
            the_uuid = uuid.UUID(str(getattr(item, "dbFileId")).strip())
            fileUse: models.FileUse = models.FileUse(
                file=models.File.objects.get(uuid=the_uuid),
                job=job,
                role=role,
                job_param_name=item.objectName(),
            )
            # fileUse.save()
