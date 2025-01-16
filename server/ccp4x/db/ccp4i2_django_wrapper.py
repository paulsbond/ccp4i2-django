import logging
import traceback
from core import CCP4ProjectsManager
from .ccp4i2_django_projects_manager import CCP4i2DjangoProjectsManager

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("root")


# Decoorator to install and use FakeProjectManager
def using_django_pm(func):
    def wrapper(*args, **kwargs):
        logger.debug("Something is happening before the function is called.")
        oldPM = CCP4ProjectsManager.CProjectsManager.insts
        # result = None
        try:
            CCP4ProjectsManager.CProjectsManager.insts = CCP4i2DjangoProjectsManager()
            result = func(*args, **kwargs)
        except Exception as err:
            logging.error("Encountered issue while in FakePM decorator %s" % err)
            traceback.print_exc()
        finally:
            if oldPM is not None:
                CCP4ProjectsManager.CProjectsManager.insts = oldPM
            logger.warning("Something is happening after the function is called.")
        return result

    return wrapper
