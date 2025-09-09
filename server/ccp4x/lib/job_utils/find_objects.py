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
                logger.debug("Match for %s", child.objectName())
                return growing_list
        elif isinstance(child, (CCP4Data.CList, CList, list)) or hasattr(
            child, "CONTENTS"
        ):
            find_objects(child, func, multiple, growing_list, current_name)
            if not multiple and len(growing_list) > original_length:
                return growing_list

    return growing_list


def find_object_by_path(base_element: CData, object_path: str):
    """
    Efficiently finds a descendent CData item from a root element given a dot-separated path.
    Supports array access via [index] for CCP4Data.CList elements.
    Example path: name1.name2.arrayname[3].name3
    """

    array_finder = re.compile(r"^(?P<base>.+)\[(?P<index>\d+)\]$")
    path_elements = object_path.split(".")

    current = base_element
    for elem in path_elements[1:]:  # skip root element name
        match = array_finder.match(elem)
        if match:
            # Array access
            base_name = match.group("base")
            index = int(match.group("index"))
            list_obj = getattr(current, base_name, None)
            if list_obj is None or not isinstance(list_obj, (CCP4Data.CList, list)):
                raise ValueError(
                    f"Element '{base_name}' is not a CCP4Data.CList or list"
                )
            # Expand list if needed
            while len(list_obj) <= index:
                if hasattr(list_obj, "makeItem"):
                    list_obj.append(list_obj.makeItem())
                else:
                    raise IndexError(
                        f"Cannot expand list '{base_name}' to index {index}"
                    )
            current = list_obj[index]
        else:
            # Simple attribute access
            next_obj = getattr(current, elem, None)
            if next_obj is None:
                raise AttributeError(f"Element '{elem}' not found in '{current}'")
            # print(f"Successfully found '{elem}' in '{current.objectName()}'")
            current = next_obj
    return current
