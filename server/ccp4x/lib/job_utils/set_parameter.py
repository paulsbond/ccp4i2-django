import logging
from typing import Union
from ccp4i2.core.CCP4Container import CContainer
from core import CCP4XtalData
from core import CCP4ModelData
from core import CCP4File
from ccp4i2.core.CCP4File import CDataFile
from .save_params_for_job import save_params_for_job
from .find_objects import find_object_by_path
from .get_job_plugin import get_job_plugin
from ...db import models
import xml.etree.ElementTree as ET


logger = logging.getLogger(f"ccp4x:{__name__}")


def set_parameter(
    job: models.Job, object_path: str, value: Union[str, int, dict, None]
):
    the_job_plugin = get_job_plugin(job)
    the_container: CContainer = the_job_plugin.container

    try:
        object_element = set_parameter_container(the_container, object_path, value)
        logger.debug(
            "Parameter %s now has value %s in job number %s",
            object_element.objectName(),
            object_element.__dict__,
            job.number,
        )
        save_params_for_job(the_job_plugin=the_job_plugin, the_job=job)

        return ET.tostring(object_element.getEtree()).decode("utf-8")
    except IndexError as err:
        logger.exception(
            "Failed to set parameter for path %s", object_path, exc_info=err
        )
        return ""


def set_parameter_container(
    the_container: CContainer, object_path: str, value: Union[str, int, dict, None]
):
    object_element = find_object_by_path(the_container, object_path)
    # e = object_element.getEtree()
    # print(ET.tostring(e).decode("utf-8"))
    object_element.unSet()
    if value is None:
        object_element.unSet()
    elif isinstance(
        object_element,
        (
            CDataFile,
            CCP4File.CDataFile,
        ),
    ) and isinstance(value, str):
        logger.debug("Setting file with string %s", object_element)
        object_element.set(value)
        logger.debug("Set file with string %s", object_element)
    elif hasattr(object_element, "update"):
        object_element.update(value)
        logger.debug(
            "Updating parameter %s with dict %s",
            object_element.objectName(),
            value,
        )
    elif isinstance(object_element, CCP4XtalData.CSpaceGroup):
        symMan = CCP4XtalData.CSymmetryManager()
        symMan.loadSymLib()
        status, corrected_spacegroup = symMan.spaceGroupValidity(str(value))
        if corrected_spacegroup == value:
            pass
        elif isinstance(corrected_spacegroup, list):
            value = corrected_spacegroup[0]
        else:
            value = corrected_spacegroup
    elif isinstance(object_element.parent(), CCP4ModelData.CPdbEnsembleItem):
        if (
            not object_element.parent().identity_to_target.isSet()
            and not object_element.parent().rms_to_target.isSet()
        ):
            object_element.parent().identity_to_target.set(0.9)
        logger.error(
            f"CPdbEnsembleItem baseElement is {str(object_element)}, {str(object_element.parent())} {value}"
        )
    try:
        object_element.set(value)
    except Exception as err:
        logger.exception(
            "Failed to set parameter %s with value %s",
            object_element.objectName(),
            value,
            exc_info=err,
        )
        raise
    logger.info(
        "Setting parameter %s to %s",
        object_element.objectPath(),
        value,
    )

    return object_element
