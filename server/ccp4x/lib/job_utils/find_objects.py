import logging
import re
from xml.etree import ElementTree as ET
from core import CCP4Container
from core import CCP4ModelData
from core import CCP4Data
from ccp4i2.core.CCP4Data import CData
from core import CCP4File
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4Data import CList

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def find_objects(within, func, multiple=False, growing_list=None, growing_name=None):
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

    if growing_name is None:
        growing_name = within.objectPath()

    search_domain = (
        within._value
        if isinstance(within, (CCP4Data.CList, CList))
        else within.CONTENTS
    )
    for ichild, child_ref in enumerate(search_domain):
        child = (
            child_ref
            if isinstance(within, (CCP4Data.CList, CList))
            else getattr(within, child_ref, None)
        )
        current_name = (
            f"{growing_name}[{ichild}]"
            if isinstance(within._value, (CCP4Data.CList, CList, list))
            else f"{growing_name}.{child.objectName()}"
        )

        if func(child):
            growing_list.append(child)
            if not multiple:
                logger.warning("Match for %s", child.objectName())
                return growing_list
        elif isinstance(child, (CCP4Data.CList, CList, list)) or hasattr(
            child, "CONTENTS"
        ):
            find_objects(child, func, multiple, growing_list, current_name)
            if not multiple and len(growing_list) > original_length:
                return growing_list

    return growing_list


def find_object_by_path(base_element: CData, object_path: str):
    # MN 2023-07-16 A method that searches through the content
    # of this data object to find the given objectPath
    path_elements = object_path.split(".")
    array_finder = re.compile(r"(?P<base_element>.*)\[(?P<index>\d+)\]$")
    for path_element in path_elements[1:]:
        matches = array_finder.match(path_element)
        if matches is not None or isinstance(base_element, CCP4Data.CList):
            if matches is not None:
                element_list = getattr(
                    base_element, matches.groupdict()["base_element"]
                )
                element_index = int(matches.groupdict()["index"])
            elif isinstance(base_element, CCP4Data.CList):
                element_list = getattr(base_element, path_element)
                element_index = 0
            while len(element_list) <= element_index:
                element_list.append(element_list.makeItem())
            try:
                base_element = element_list[element_index]
            except TypeError as err:
                logger.error(f"Failed deindexing {object_path} at {path_element}")
                raise err
        else:
            base_element = getattr(base_element, path_element)
    return base_element
