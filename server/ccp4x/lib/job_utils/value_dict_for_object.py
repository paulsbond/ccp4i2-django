import logging
from core import CCP4Data
from ccp4i2.core.CCP4Data import CData

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(f"ccp4x:{__name__}")


def value_dict_for_object(ccp4i2_object: CData):
    if isinstance(ccp4i2_object, dict):
        return handle_dict(ccp4i2_object)
    elif isinstance(ccp4i2_object, list):
        return handle_list(ccp4i2_object)
    elif not hasattr(ccp4i2_object, "_value"):
        logger.info("No value on %s", ccp4i2_object)
        return None
    return handle_value(ccp4i2_object)


def handle_dict(ccp4i2_object):
    result = {}
    for key in ccp4i2_object:
        result[key] = value_dict_for_object(ccp4i2_object[key])
    if len(result.items()) == 0:
        return None
    return result


def handle_list(ccp4i2_object):
    result = []
    for value in ccp4i2_object:
        result.append(value_dict_for_object(value))
    return result


def handle_value(ccp4i2_object):
    if isinstance(
        ccp4i2_object._value,
        (
            str,
            CCP4Data.CString,
        ),
    ):
        return str(ccp4i2_object._value)
    elif isinstance(
        ccp4i2_object._value,
        (
            float,
            CCP4Data.CFloat,
        ),
    ):
        return float(ccp4i2_object._value)
    elif isinstance(
        ccp4i2_object._value,
        (
            bool,
            CCP4Data.CBoolean,
        ),
    ):
        return bool(ccp4i2_object._value)
    elif isinstance(ccp4i2_object._value, (int, CCP4Data.CInt)):
        return int(ccp4i2_object._value)
    elif hasattr(ccp4i2_object, "_value"):
        if isinstance(ccp4i2_object._value, dict):
            return handle_dict(ccp4i2_object._value)
        elif isinstance(ccp4i2_object._value, list):
            return handle_list(ccp4i2_object._value)
    return {}
