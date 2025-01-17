import logging

from core import CCP4Container

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def remove_container_default_values(container: CCP4Container.CContainer):
    # Unset the output file data, which should be recalculated for the new plugin, I guess
    data_list = container.children()
    for dobj in data_list:
        # dobj = getattr(the_job_plugin.container.outputData, object_name)
        if isinstance(dobj, CCP4Container.CContainer):
            remove_container_default_values(dobj)
        else:
            is_set = dobj.isSet(allowUndefined=False, allowDefault=False, allSet=True)
            if not is_set:
                try:
                    container.deleteObject(dobj.objectName())
                except Exception as err:
                    logger.exception("Error deleting default values", exc_info=err)
