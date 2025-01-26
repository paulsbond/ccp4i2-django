import logging
from xml.etree import ElementTree as ET
from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4ErrorHandling


logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def getEtree(error_report: CCP4ErrorHandling.CErrorReport):
    element = ET.Element("errorReportList")
    for item in error_report._reports:
        try:
            ele = ET.Element("errorReport")
            e = ET.Element("className")
            e.text = item["class"].__name__
            ele.append(e)
            e = ET.Element("code")
            e.text = str(item["code"])
            ele.append(e)
            e = ET.Element("description")
            desc, severity = error_report.description(item)
            e.text = desc
            ele.append(e)
            e = ET.Element("severity")
            e.text = CCP4ErrorHandling.SEVERITY_TEXT[severity]
            ele.append(e)
            if item["details"] is not None:
                e = ET.Element("details")
                e.text = str(item["details"])
                ele.append(e)
            if item.get("time", None) is not None:
                e = ET.Element("time")
                e.text = str(item["time"])
                ele.append(e)
            if item.get("stack", None) is not None:
                e = ET.Element("stack")
                # print 'CErrorReport.getEtree stack',item['stack'],type(item['stack']),type(item['stack'][0])
                text = ""
                for line in item["stack"]:
                    text = text + line
                e.text = text
                ele.append(e)
            element.append(ele)
        except Exception as e:
            logger.exception("Error in validate_container", exc_info=e)
    return element


def validate_container(
    container: CCP4Container.CContainer,
) -> ET.Element:
    error_report: CCP4ErrorHandling.CErrorReport = container.validity()
    error_etree: ET.Element = getEtree(error_report)

    # Remove stacks (too nasty to live with)
    namespace = ""
    error_reports = error_etree.findall(".//{0}errorReport".format(namespace))
    for error_report in error_reports:
        stack_children = error_report.findall("./stack")
        for stack_child in stack_children:
            error_report.remove(stack_child)
        description_children = error_report.findall("./description")

        for description_child in description_children:
            description_text = description_child.text
            broken_text = description_text.split(":")
            if len(broken_text) > 1:
                object_element = ET.Element("objectPath")
                object_element.text = broken_text[0].strip()
                error_report.append(object_element)

    ET.indent(error_etree, " ")
    # print(error_log)
    return error_etree
