import json
import logging
from core import CCP4Container
from core import CCP4Data
from core import CCP4File


logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def base_class(o):
    if isinstance(o, CCP4File.CDataFile):
        result = "CDataFile"
    elif isinstance(o, CCP4Data.CList):
        result = "CList"
    elif isinstance(o, CCP4Container.CContainer):
        result = "CContainer"
    elif isinstance(o, CCP4Data.CString):
        result = "CString"
    elif isinstance(o, CCP4Data.CInt):
        result = "CInt"
    elif isinstance(o, CCP4Data.CFloat):
        result = "CFloat"
    elif isinstance(o, CCP4Data.CBoolean):
        result = "CBoolean"
    else:
        result = "CData"
    return result


class CCP4i2JsonEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, CCP4Data.CData):
            qualifiers = {}
            qualifiers.update(type(o).QUALIFIERS)
            qualifiers.update(o._qualifiers)
            qualifiers = dict(
                filter(lambda elem: elem[1] != NotImplemented, qualifiers.items())
            )
            result = {
                "_class": type(o).__name__,
                "_value": o._value,
                "_qualifiers": qualifiers,
                "_CONTENTS_ORDER": o.__class__.CONTENTS_ORDER,
                "_objectPath": o.objectPath(),
            }
            result["_baseClass"] = base_class(o)
            if isinstance(o, CCP4Data.CList):
                result["_subItem"] = o.makeItem()
            # print(result)
            return result
        if o is NotImplemented:
            return None
        if o.__class__.__name__ == "ObjectType":
            # This is a hack to deal with the fact that (for now) container objects are Rooted as QObjects
            return None
        try:
            result = json.dumps(o)
        except TypeError as exc:
            logger.exception(
                "Exception in json encoding CData object %s", type(o), exc_info=exc
            )
            result = json.dumps(str(o), indent="\t")
        return result
