import json
import logging
from core import CCP4File
from core import CCP4ModelData
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4File import CDataFile
from .find_objects import find_objects
from .get_job_container import get_job_container
from .json_encoder import CCP4i2JsonEncoder
from .value_dict_for_object import value_dict_for_object

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def digest_file(the_job, object_path):
    the_container: CContainer = get_job_container(the_job)
    object_elements = find_objects(
        the_container, lambda a: a.objectPath() == object_path, multiple=False
    )
    try:
        file_object: CDataFile = object_elements[0]
    except IndexError as err:
        logger.exception("Error finding object with path %s", object_path, exc_info=err)
        return {"status": "Failed", "reason": str(err)}
    content_dict = {}
    if isinstance(file_object, CCP4File.CDataFile):
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
    return content_dict
