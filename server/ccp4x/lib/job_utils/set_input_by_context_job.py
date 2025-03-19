import logging
import uuid
from typing import List
from xml.etree import ElementTree as ET

from core import CCP4Container
from ccp4i2.core.CCP4Container import CContainer
from core import CCP4File
from core import CCP4Data
from ccp4i2.core.CCP4Data import CList
from ccp4i2.core.CCP4File import CDataFile

from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db import models
from .get_job_plugin import get_job_plugin
from .save_params_for_job import save_params_for_job
from .get_file_by_job_context import get_file_by_job_context
from .find_objects import find_objects

logger = logging.getLogger(f"ccp4x:{__name__}")


def set_input_by_context_job(job_id: str = None, context_job_id: str = None):
    """
    Sets input data for a job based on the context of another job.
    This function retrieves the job and its associated plugin, then finds and updates
    input data files based on the context of a specified job. It ensures that the input
    data files are correctly set with relevant information from the context job.

    Args:
        job_id (str): The UUID of the job for which input data is to be set.
        context_job_id (str): The UUID of the context job from which input data is derived.

    Raises:
        AssertionError: If either `job_id` or `context_job_id` is None.
        models.Job.DoesNotExist: If the job with the specified `job_id` does not exist.
        models.File.DoesNotExist: If a file with the specified UUID does not exist.
    """

    assert job_id is not None
    assert context_job_id is not None

    logger.debug(f"In set_input_by_context_job {job_id} {context_job_id}")

    job_uuid = uuid.UUID(job_id)

    the_job = models.Job.objects.get(uuid=job_uuid)
    the_job_plugin = get_job_plugin(the_job)
    the_container: CContainer = the_job_plugin.container
    input_data: CContainer = the_container.inputData

    dobj_list = find_objects(
        input_data,
        lambda item: isinstance(item, CCP4File.CDataFile)
        and item.qualifiers("fromPreviousJob"),
        multiple=True,
    )

    # Now find input data that is a list of files, add an item of such lists to the list of dObjs for which we need to set the input
    list_list = find_objects(
        input_data,
        lambda item: isinstance(item, CCP4Data.CList)
        and item.qualifiers("fromPreviousJob"),
        multiple=True,
    )
    a_list: CList
    for a_list in list_list:
        try:
            a_list_item = a_list.makeItem()
            if isinstance(a_list_item, CCP4File.CDataFile):
                a_list.append(a_list_item)
                dobj_list.append(a_list_item)
        except Exception as err:
            logger.exception(
                "Exception in set_input_by_context_job for %s",
                a_list.objectPath(),
                exc_info=err,
            )

    dobj: CDataFile
    for dobj in dobj_list:
        file_id_list = get_file_by_job_context(
            contextJobId=context_job_id,
            fileType=dobj.qualifiers("mimeTypeName"),
            subType=dobj.qualifiers("requiredSubType"),
            contentFlag=dobj.qualifiers("requiredContentFlag"),
            projectId=str(the_job.project.uuid),
        )

        if len(file_id_list) > 0:
            the_file = models.File.objects.get(uuid=file_id_list[0])
            dobj.set(
                {
                    "baseName": str(the_file.name),
                    "relPath": str(the_file.rel_path),
                    "project": str(the_job.project.uuid).replace("-", ""),
                    "annotation": str(the_file.annotation),
                    "dbFileId": str(the_file.uuid).replace("-", ""),
                    "content": the_file.content,
                    "subType": the_file.sub_type,
                }
            )
            dobj.loadFile()
            dobj.setContentFlag(reset=True)

    save_params_for_job(the_job_plugin, the_job=the_job)
