import logging
import pathlib
from typing import Union
from xml.etree import ElementTree as ET
from ccp4i2.core import CCP4File
from ...db.models import Project

logger = logging.getLogger(f"ccp4x:{__name__}")


def load_nested_xml(
    from_node: ET.Element, to_node: Union[ET.Element, None] = None
) -> ET.Element:
    new_node = ET.Element(from_node.tag, **from_node.attrib)
    new_node.text = from_node.text
    new_node.tail = from_node.tail
    file_nodes = []
    if to_node is None:
        to_node = new_node
    else:
        to_node.append(new_node)
        to_node = new_node
    for child_node in from_node:
        if child_node.tag == "file":
            file_nodes.append({"file_node": child_node, "dest_node": to_node})
        else:
            load_nested_xml(child_node, to_node)
    for file_node in file_nodes:
        child_node = file_node["file_node"]
        dest_node = file_node["dest_node"]
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
                    "Failed working out project dir %s", project, exc_info=err
                )
                continue
        embedded_xml_path = pathlib.Path(base_dir).joinpath(
            *(relPath.split("/") + [baseName])
        )
        with open(embedded_xml_path, "r") as embedded_xml_file:
            embedded_xml_string = embedded_xml_file.read()
            embedded_xml = ET.fromstring(embedded_xml_string)
            src_input_data = embedded_xml.find(".//container[@id='inputData']")
            dest_input_data = dest_node.find(".//container[@id='inputData']")
            # print(src_input_data)
            for child_element in src_input_data:
                load_nested_xml(child_element, dest_input_data)
            continue
    return to_node
