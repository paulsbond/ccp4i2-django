import logging
from xml.etree import ElementTree as ET
from core import CCP4Container
from core import CCP4ModelData
from core import CCP4Data
from core import CCP4File
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4Data import CList

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def find_objects(within, func, multiple=False, growing_list=None):
    """
    Recursively searches for objects within a container or list that match a given condition.

    Args:
        within (CCP4Container.CContainer or list): The container or list to search within.
        func (callable): A function that takes an object and returns True if the object matches the condition.
        multiple (bool, optional): If True, find all matching objects. If False, stop after finding the first match. Defaults to True.
        growing_list (list, optional): A list to accumulate the matching objects. If None, a new list is created. Defaults to None.

    Returns:
        list: A list of objects that match the given condition.
    """
    if growing_list is None:
        growing_list = []
    original_length = len(growing_list)
    search_domain = (
        within.CONTENTS
        if isinstance(
            within,
            (
                CCP4Container.CContainer,
                CCP4File.CDataFile,
                CCP4ModelData.CAtomSelection,
                CContainer,
            ),
        )
        else (
            within.__dict__["_value"]
            if isinstance(
                within,
                (
                    CCP4Data.CList,
                    CList,
                ),
            )
            else within
        )
    )
    for iChild, child_ref in enumerate(search_domain):
        child = None
        if isinstance(
            within,
            (
                CContainer,
                CCP4Container.CContainer,
                CCP4File.CDataFile,
                CCP4ModelData.CAtomSelection,
            ),
        ):
            child = getattr(within, child_ref, None)
        else:
            child = child_ref
        if func(child):
            growing_list.append(child)
            if not multiple:
                logger.warning("Match for %s", child.objectName())
                return growing_list
        elif isinstance(
            child,
            (
                CCP4Container.CContainer,
                CContainer,
                CCP4Data.CList,
                CList,
                list,
                CCP4File.CDataFile,
                CCP4ModelData.CAtomSelection,
            ),
        ):
            find_objects(child, func, multiple, growing_list)
            if (not multiple) and (len(growing_list) > original_length):
                return growing_list
    return growing_list
