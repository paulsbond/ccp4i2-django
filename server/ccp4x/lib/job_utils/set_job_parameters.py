import logging
from xml.etree import ElementTree as ET

from ...db.ccp4i2_django_wrapper import using_django_pm
from ...db.models import Job
from .get_job_plugin import get_job_plugin
from .save_params_for_job import save_params_for_job

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


@using_django_pm
def setJobParameterByXML(jobId, objectPath, valueXMLText):

    newValueEtree = ET.fromstring(valueXMLText)
    the_job = Job.objects.get(uuid=jobId)
    the_job_plugin = get_job_plugin(the_job)
    objectElement = the_job_plugin.container.locateElement(objectPath)
    objectElement.unSet()
    objectElement.setEtree(newValueEtree)
    save_params_for_job(the_job_plugin=the_job_plugin, the_job=the_job)
    return ET.tostring(objectElement.getEtree()).decode("utf-8")
