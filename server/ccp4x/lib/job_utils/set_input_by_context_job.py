import logging
import uuid
from typing import List
from xml.etree import ElementTree as ET

from core import CCP4Container
from ccp4i2.core.CCP4Container import CContainer
from core import CCP4File
from ccp4i2.core.CCP4File import CDataFile

from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db import models
from .get_job_plugin import get_job_plugin
from .save_params_for_job import save_params_for_job
from .get_file_by_job_context import get_file_by_job_context
from .find_objects import find_objects

logging.basicConfig(level=logging.WARNING)
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

    save_params_for_job(the_job_plugin, the_job=the_job)
