import logging

from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4Data

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")


def remove_container_default_values(container: CCP4Container.CContainer):
    for child in container.children():
        try:
            if _should_remove_child(child):
                _remove_child(container, child)
        except Exception as err:
            logger.info("Issue with %s %s. %s", child, container, err)
            continue


def _should_remove_child(child: CCP4Data.CData):
    if hasattr(child, "object_name") and child.get("object_name")() not in [
        "inputData",
        "outputData",
    ]:
        if isinstance(child, CCP4Container.CContainer):
            return child.object_name() != "outputData"
        else:
            return not child.isSet(allowDefault=False, allSet=False)
    return False


def _remove_child(container: CCP4Container.CContainer, child: CCP4Data.CData):
    if container.object_name() != "temporary":
        try:
            container.deleteObject(child.object_name())
        except Exception as err:
            logger.info(
                "Issue deleting %s from %s. %s",
                child.object_name(),
                container.object_name(),
                err,
            )
