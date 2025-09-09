import logging
import uuid
from typing import Union
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4Data import CDict
import json
from core import CCP4XtalData
from core import CCP4ModelData
from core import CCP4File
from core import CCP4Data
from ccp4i2.core.CCP4File import CDataFile
from .save_params_for_job import save_params_for_job
from .find_objects import find_object_by_path
from .get_job_plugin import get_job_plugin
from .json_encoder import CCP4i2JsonEncoder
from .value_dict_for_object import value_dict_for_object
from ...db import models
import xml.etree.ElementTree as ET


logger = logging.getLogger(f"ccp4x:{__name__}")


def set_parameter(
    job: models.Job, object_path: str, value: Union[str, int, dict, None]
):
    the_job_plugin = get_job_plugin(job)
    the_container: CContainer = the_job_plugin.container

    try:
        previous_object_element = find_object_by_path(the_container, object_path)
        if isinstance(previous_object_element, (CCP4File.CDataFile, CDataFile)):
            previous_value = value_dict_for_object(previous_object_element)
            previous_file_id = previous_value.get("dbFileId", None)
            if previous_file_id is not None and not isinstance(previous_file_id, dict):
                logger.warning("Deleting previous file with id %s", previous_file_id)
                try:
                    previous_file = models.File.objects.get(
                        uuid=uuid.UUID(previous_file_id)
                    )
                    if previous_file.job.uuid == job.uuid:
                        try:
                            previous_file_import = models.FileImport.objects.get(
                                file=previous_file
                            )
                            previous_file_import.delete()
                        except models.FileImport.DoesNotExist:
                            pass
                        previous_file.path.unlink(missing_ok=True)
                        previous_file.delete()
                except models.File.DoesNotExist:
                    pass
        object_element = set_parameter_container(the_container, object_path, value)
        logger.debug(
            "Parameter %s now has value %s in job number %s",
            object_element.objectName(),
            object_element.__dict__,
            job.number,
        )
        save_params_for_job(the_job_plugin=the_job_plugin, the_job=job)

        return json.loads(json.dumps(object_element, cls=CCP4i2JsonEncoder))
    except IndexError as err:
        logger.exception(
            "Failed to set parameter for path %s", object_path, exc_info=err
        )
        return ""


def set_parameter_container(
    the_container: CContainer, object_path: str, value: Union[str, int, dict, None]
):
    try:
        object_element = find_object_by_path(the_container, object_path)
    except AttributeError as err:
        # A possible explanation is that we have the key (the last path element)
        # of a dictionary item here.  Test if that is the case and proceed acordingly
        parent_path = ".".join(object_path.split(".")[:-1])
        key_name = object_path.split(".")[-1]

        try:
            logger.info("Now searching for parent element %s", parent_path)
            parent_element = find_object_by_path(the_container, parent_path)
            if isinstance(parent_element, (dict, CCP4Data.CDict, CDict)):
                parent_element[key_name] = value
                return parent_element
            else:
                logger.exception(
                    "Failed to set parameter with name %s with value %s",
                    object_path,
                    value,
                    exc_info=err,
                )
                raise
        except Exception as err1:
            logger.exception(
                "Failed to set parameter with name %s with value %s",
                object_path,
                value,
                exc_info=err1,
            )
            raise
    except Exception as err:
        logger.exception(
            "Failed to set parameter with name %s with value %s",
            object_path,
            value,
            exc_info=err,
        )
        raise

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
