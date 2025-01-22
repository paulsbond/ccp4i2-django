import logging
import pathlib
from typing import Union
from xml.etree import ElementTree as ET
from ccp4i2.core import CCP4File
from ...db.models import Project

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def load_nested_xml(
    from_node: ET.Element, to_node: Union[ET.Element, None] = None
) -> ET.Element:
    if to_node is None:
        to_node = ET.Element(from_node.tag, **from_node.attrib)
        to_node.text = from_node.text
        to_node.tail = from_node.tail
    for child_node in from_node:
        if child_node.tag == "file":
            project = child_node.findtext(".//CI2XmlDataFile/project")
            relPath = child_node.findtext(".//CI2XmlDataFile/relPath")
            baseName = child_node.findtext(".//CI2XmlDataFile/baseName")
            base_dir = None
            if project == "CCP4I2_TOP":
                base_dir = pathlib.Path(CCP4File.__file__).parent.parent
            else:
                try:
                    base_dir = Project.objects.get(uuid=project).directory
                except Project.DoesNotExist as err:
                    logging.exception(
                        "Failed working out project dir %s" % project, exc_info=err
                    )
                    continue
            embedded_xml_path = pathlib.Path(base_dir).joinpath(
                *(relPath.split("/") + [baseName])
            )
            with open(embedded_xml_path, "r") as embedded_xml_file:
                embedded_xml_string = embedded_xml_file.read()
                embedded_xml = ET.fromstring(embedded_xml_string)
                load_nested_xml(embedded_xml, to_node)
            continue
        else:
            new_node = ET.Element(child_node.tag, **child_node.attrib)
            new_node.text = child_node.text
            new_node.tail = child_node.tail
            to_node.append(new_node)
            load_nested_xml(child_node, to_node=new_node)
    return to_node
