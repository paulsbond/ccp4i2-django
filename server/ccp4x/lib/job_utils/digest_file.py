import json
import logging
import gemmi
from core import CCP4File
from core import CCP4XtalData
from core import CCP4ModelData
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4XtalData import CGenericReflDataFile
from ccp4i2.core.CCP4ModelData import CPdbDataFile
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


def digest_param_file(the_job, object_path):
    the_container: CContainer = get_job_container(the_job)
    try:
        file_object: CDataFile = find_object_by_path(the_container, object_path)
        return digest_file_object(file_object)
    except IndexError as err:
        logger.exception("Error finding object with path %s", object_path, exc_info=err)
        return {"status": "Failed", "reason": str(err), "digest": {}}
    except Exception as err:
        logger.exception("Other exception %s", object_path, exc_info=err)
        return {"status": "Failed", "reason": str(err), "digest": {}}


def digest_file_object(file_object: CDataFile):
    content_dict = {}
    if not isinstance(file_object, CCP4File.CDataFile):
        return {"status": "Failed", "reason": "Not a valid file object", "digest": {}}
    if not file_object.isSet():
        return {"status": "Failed", "reason": "File object is not set", "digest": {}}

    if isinstance(file_object, CCP4ModelData.CPdbDataFile):
        return digest_cpdbdata_file_object(file_object)
    if isinstance(file_object, CCP4XtalData.CGenericReflDataFile):
        return digest_cgenericrefldatafile_file_object(file_object)

    try:
        file_object.loadFile()
        file_object.setContentFlag(reset=True)
        contents = file_object.getFileContent()
        content_dict = value_dict_for_object(contents)
        return content_dict
    except Exception as err:
        logger.exception("Error digesting file %s", file_object, exc_info=err)
        return {
            "status": "Failed",
            "reason": f"Failed digesting CDataFile {err}",
            "digest": {},
        }


def digest_cpdbdata_file_object(file_object: CPdbDataFile):
    content_dict = {}
    if not isinstance(file_object, CCP4ModelData.CPdbDataFile):
        return {"status": "Failed", "reason": "Not a CPdbDataFile object", "digest": {}}
    if not file_object.isSet():
        return {"status": "Failed", "reason": "File object is not set", "digest": {}}
    try:
        file_object.loadFile()
        file_object.setContentFlag(reset=True)
        contents = file_object.getFileContent()
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
        return content_dict
    except Exception as err:
        logger.exception("Error digesting file %s", file_object, exc_info=err)
        return {
            "status": "Failed",
            "reason": f"Failed digesting CPdbDataFile {err}",
            "digest": {},
        }


def digest_cgenericrefldatafile_file_object(file_object: CGenericReflDataFile):
    content_dict = {}
    if not isinstance(file_object, CCP4XtalData.CGenericReflDataFile):
        return {
            "status": "Failed",
            "reason": "Not a CGenericReflDataFile object",
            "digest": {},
        }
    if not file_object.isSet():
        return {"status": "Failed", "reason": "File object is not set", "digest": {}}
    try:
        file_object.loadFile()
        file_object.setContentFlag(reset=True)
        contents = file_object.getFileContent()
        content_dict = value_dict_for_object(contents)
        content_dict["format"] = file_object.getFormat()
        content_dict["merged"] = file_object.getMerged()
        if file_object.getFormat() == "mmcif":
            mmcif = gemmi.cif.read_file(file_object.fullPath.__str__())
            rblocks = gemmi.as_refln_blocks(mmcif)
            rblock_infos = []
            for rb in rblocks:
                blkinfo = mmcifutils.CifBlockInfo(rb)
                rblock_infos.append(flatten_instance(blkinfo))
            content_dict["rblock_infos"] = rblock_infos
        return content_dict
    except Exception as err:
        logger.exception("Error digesting file %s", file_object, exc_info=err)
        return {
            "status": "Failed",
            "reason": f"Failed digesting CGenericReflDataFile {err}",
            "digest": {},
        }
