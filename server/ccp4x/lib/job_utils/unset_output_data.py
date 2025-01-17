import logging
from ccp4i2.core import CCP4PluginScript
from core import CCP4File

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def unset_output_data(the_job_plugin: CCP4PluginScript.CPluginScript):
    # Unset the output file data, which should be recalculated for the new plugin, I guess
    data_list = the_job_plugin.container.outputData.children()
    for dobj in data_list:
        # dobj = getattr(the_job_plugin.container.outputData, object_name)
        if isinstance(dobj, CCP4File.CDataFile):
            dobj.unSet()
