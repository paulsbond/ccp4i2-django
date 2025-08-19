import logging
from core import CCP4Data
from ccp4i2.core.CCP4Data import CData, CList, CFloat, CInt, CString, CBoolean

logger = logging.getLogger(f"ccp4x:{__name__}")


def value_dict_for_object(ccp4i2_object: CData):
    logger.debug("In value_dict_for_object: %s", ccp4i2_object.__class__.__name__)
    if isinstance(ccp4i2_object, dict):
        return handle_dict(ccp4i2_object)
    elif isinstance(ccp4i2_object, (list, CCP4Data.CList, CList)):
        return handle_list(ccp4i2_object)
    elif not hasattr(ccp4i2_object, "_value"):
        logger.info("No value on %s", ccp4i2_object)
        return None
    return handle_value(ccp4i2_object)


def handle_dict(ccp4i2_object):
    logger.debug("Handling dict: %s", ccp4i2_object)
    result = {}
    for key in ccp4i2_object:
        result[key] = value_dict_for_object(ccp4i2_object[key])
    if len(result.items()) == 0:
        return None
    return result


def handle_list(ccp4i2_object):
    logger.debug("Handling list: %s", ccp4i2_object)
    result = []
    for value in ccp4i2_object:
        result.append(value_dict_for_object(value))
    return result


def handle_value(ccp4i2_object):
    logger.debug(
        "Handling value: %s %s", ccp4i2_object, hasattr(ccp4i2_object, "_value")
    )
    if isinstance(
        ccp4i2_object._value,
        (str, CCP4Data.CString, CString),
    ):
        logger.debug("Handling string value: %s", ccp4i2_object._value)
        return str(ccp4i2_object._value)
    elif isinstance(
        ccp4i2_object._value,
        (float, CCP4Data.CFloat, CFloat),
    ):
        logger.debug("Handling float value: %s", ccp4i2_object._value)
        return float(ccp4i2_object._value)
    elif isinstance(
        ccp4i2_object._value,
        (bool, CCP4Data.CBoolean, CBoolean),
    ):
        logger.debug("Handling boolean value: %s", ccp4i2_object._value)
        return bool(ccp4i2_object._value)
    elif isinstance(ccp4i2_object._value, (int, CCP4Data.CInt, CInt)):
        logger.debug("Handling integer value: %s", ccp4i2_object._value)
        return int(ccp4i2_object._value)
    elif hasattr(ccp4i2_object, "_value"):
        logger.debug(
            "Handling complex value: %s %s",
            ccp4i2_object._value,
            ccp4i2_object._value.__class__,
        )
        if isinstance(ccp4i2_object._value, dict):
            return handle_dict(ccp4i2_object._value)
        elif isinstance(ccp4i2_object._value, list):
            return handle_list(ccp4i2_object._value)
    return {}
