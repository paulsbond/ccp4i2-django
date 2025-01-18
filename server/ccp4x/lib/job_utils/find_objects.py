from core import CCP4Container


def find_objects(within, func, multiple=True, growing_list=None):
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
