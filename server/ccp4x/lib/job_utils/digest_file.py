import json
import logging
import gemmi
from core import CCP4File
from core import CCP4XtalData
from core import CCP4ModelData
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4XtalData import CGenericReflDataFile
from ccp4i2.core.CCP4File import CDataFile
from ccp4i2.core.CCP4File import CDataFile
from ccp4i2.pipelines.import_merged.script import mmcifutils
from .find_objects import find_objects, find_object_by_path
from .get_job_container import get_job_container
from .json_encoder import CCP4i2JsonEncoder
from .value_dict_for_object import value_dict_for_object

logger = logging.getLogger(f"ccp4x:{__name__}")


def is_basic_type(obj):
    return isinstance(obj, (str, int, float, bool, type(None)))


def is_custom_class_instance(obj):
    return not is_basic_type(obj) and not isinstance(obj, (list, dict, tuple))


def flatten_instance(obj):
    if is_basic_type(obj):
        return obj
    elif isinstance(obj, list):
        return [flatten_instance(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(flatten_instance(item) for item in obj)
    elif isinstance(obj, dict):
        return {key: flatten_instance(value) for key, value in obj.items()}
    elif hasattr(obj, "__dict__"):
        return {
            key: flatten_instance(value)
            for key, value in vars(obj).items()
            if not callable(value) and not key.startswith("_")
        }
    elif hasattr(obj, "__slots__"):
        return {
            slot: flatten_instance(getattr(obj, slot))
            for slot in obj.__slots__
            if hasattr(obj, slot)
        }
    else:
        # fallback: use repr to avoid exceptions
        return repr(obj)


def digest_file(the_job, object_path):
    the_container: CContainer = get_job_container(the_job)
    try:
        file_object: CDataFile = find_object_by_path(the_container, object_path)
    except IndexError as err:
        logger.exception("Error finding object with path %s", object_path, exc_info=err)
        return {"status": "Failed", "reason": str(err)}
    content_dict = {}
    if isinstance(file_object, CCP4File.CDataFile):
        if not file_object.isSet():
            return content_dict
        try:
            file_object.loadFile()
            file_object.setContentFlag(reset=True)
            contents = file_object.getFileContent()
            if isinstance(contents, CCP4ModelData.CPdbData):
                contents.loadFile(file_object.fullPath)
                contents.loadSequences(contents.molHnd)
                content_dict = {
                    "sequences": contents.sequences,
                    "composition": {
                        key: getattr(contents.composition, key)
                        for key in [
                            "chains",
                            "peptides",
                            "nucleics",
                            "solventChains",
                            "monomers",
                            "nresSolvent",
                            "moleculeType",
                            "containsHydrogen",
                        ]
                    },
                }
            else:
                content_dict = value_dict_for_object(contents)
        except Exception as err:
            logger.exception("Error digesting file %s", object_path, exc_info=err)
        print("Hi")
        try:
            content_dict["format"] = file_object.getFormat()
            content_dict["merged"] = file_object.getMerged()
            if isinstance(
                file_object, (CGenericReflDataFile, CCP4XtalData.CGenericReflDataFile)
            ):
                if file_object.getFormat() == "mmcif":
                    mmcif = gemmi.cif.read_file(file_object.fullPath.__str__())
                    rblocks = gemmi.as_refln_blocks(mmcif)
                    rblock_infos = []
                    for rb in rblocks:
                        blkinfo = mmcifutils.CifBlockInfo(rb)
                        rblock_infos.append(flatten_instance(blkinfo))

                    content_dict["rblock_infos"] = rblock_infos
        except Exception as err:
            logger.exception("Error digesting file %s", object_path, exc_info=err)
    return content_dict
