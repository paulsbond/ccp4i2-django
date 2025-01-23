from typing import Union
from ccp4i2.core.CCP4Container import CContainer
from .save_params_for_job import save_params_for_job
from .find_objects import find_objects
from .get_job_plugin import get_job_plugin
from ...db import models
import xml.etree.ElementTree as ET


def set_parameter(job: models.Job, object_path: str, value: Union[str, int, dict]):
    the_job_plugin = get_job_plugin(job)
    the_container: CContainer = the_job_plugin.container
    object_elements = find_objects(
        the_container, lambda a: a.objectPath() == object_path, multiple=False
    )
    print(object_elements)
    object_element = object_elements[0]
    object_element.unSet()
    if hasattr(object_element, "update"):
        object_element.update(value)
    else:
        object_element.set(value)
    save_params_for_job(the_job_plugin=the_job_plugin, the_job=job)
    return ET.tostring(object_element.getEtree()).decode("utf-8")
