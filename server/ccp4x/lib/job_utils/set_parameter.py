import logging
from typing import Union
from ccp4i2.core.CCP4Container import CContainer
from .save_params_for_job import save_params_for_job
from .find_objects import find_objects
from .get_job_plugin import get_job_plugin
from ...db import models
import xml.etree.ElementTree as ET


logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def set_parameter(job: models.Job, object_path: str, value: Union[str, int, dict]):
    the_job_plugin = get_job_plugin(job)
    the_container: CContainer = the_job_plugin.container
    print("object_path", object_path)
    object_elements = find_objects(
        the_container, lambda a: a.objectPath() == object_path, multiple=False
    )
    object_element = object_elements[0]
    e = object_element.getEtree()
    print(ET.tostring(e).decode("utf-8"))
    print(object_elements, len(object_elements), value)
    object_element.unSet()
    if value is None:
        object_element.unSet()
    elif hasattr(object_element, "update"):
        object_element.update(value)
        logger.warning(
            "Updating parameter %s with dict %s",
            object_element.objectName(),
            value,
        )
    else:
        object_element.set(value)
        logger.warning(
            "Setting parameter %s to %s",
            object_element.objectName(),
            value,
        )
    print(object_element)

    logger.warning(
        "Parameter %s now has value %s",
        object_element.objectName(),
        object_element,
    )

    save_params_for_job(the_job_plugin=the_job_plugin, the_job=job)

    return ET.tostring(object_element.getEtree()).decode("utf-8")
