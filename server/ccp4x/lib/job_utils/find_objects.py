from core import CCP4Container


def find_objects(within, func, multiple=True, growing_list=None):
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
    search_domain = []
    if isinstance(within, CCP4Container.CContainer):
        search_domain = within.children()
    elif isinstance(within, list):
        search_domain = within
    original_length = len(growing_list)
    for child in search_domain:
        if func(child):
            growing_list.append(child)
            if not multiple:
                break
        elif isinstance(child, CCP4Container.CContainer) or isinstance(child, list):
            find_objects(child, func, multiple, growing_list)
            if not multiple and len(growing_list) > original_length:
                break
    return growing_list
