import logging
import uuid
from typing import List
from xml.etree import ElementTree as ET

from core import CCP4Container
from ccp4i2.core.CCP4Container import CContainer
from core import CCP4File
from ccp4i2.core.CCP4File import CDataFile
from core

from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db import models
from .get_job_plugin import get_job_plugin
from .save_params_for_job import save_params_for_job
from .get_file_by_job_context import get_file_by_job_context
from .find_objects import find_objects

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")

def set_input_by_context_job(jobId:str=None, contextJobId:str=None):
    
    assert jobId is not None
    assert contextJobId is not None
    
    logger.debug(f'In setInputByContextJob {jobId} {contextJobId}')

    job_uuid = uuid.UUID(jobId)
    
    the_job = models.Job.objects.get(uuid=job_uuid)
    the_job_plugin = get_job_plugin(the_job)
    the_container:CContainer = the_job_plugin.container
    input_data:CContainer = the_container.inputData

    dobj_list = find_objects(input_data, lambda item:isinstance(item, CCP4File.CDataFile) and item.qualifiers('fromPreviousJob'), multiple=True)
    dobj:CDataFile
    for dobj in dobj_list:
        fileIdList = get_file_by_job_context(
            contextJobId=contextJobId,
            fileType=dobj.qualifiers('mimeTypeName'),
            subType=dobj.qualifiers('requiredSubType'),
            contentFlag=dobj.qualifiers('requiredContentFlag'),
            projectId=str(the_job.project.uuid))
        
        if len(fileIdList) > 0:
            the_file = models.File.objects.get(uuid=fileIdList[0])
            dobj.set({'baseName': the_file.name, 'relPath':  the_file.rel_path,
                        'project': str(the_job.project.uuid), 'annotation': the_file.annotation,
                        'dbFileId': str(the_file.uuid), 'content': the_file.content,
                        'subType': the_file.sub_type})
                

    save_params_for_job(the_job_plugin, the_job=the_job)
