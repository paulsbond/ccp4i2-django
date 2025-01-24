from pathlib import Path
from shutil import rmtree
from xml.etree import ElementTree as ET
from django.test import TestCase, override_settings
from django.conf import settings
from core import CCP4PerformanceData
from core import CCP4ErrorHandling
from core import CCP4Data
from ccp4i2.core import CCP4Container
from ccp4i2.core.CCP4ErrorHandling import CErrorReport, CException
from ...db.models import Job
from ...db.import_i2xml import import_ccp4_project_zip
from ...db.ccp4i2_django_projects_manager import CCP4i2DjangoProjectsManager

from ...lib.job_utils.get_job_plugin import get_job_plugin
from ...lib.job_utils.unset_output_data import unset_output_data
from ...lib.job_utils.remove_container_default_values import (
    remove_container_default_values,
)
from ...lib.job_utils.find_objects import find_objects
from ...lib.job_utils.load_nested_xml import load_nested_xml
from ...lib.job_utils.validate_container import validate_container
from ...lib.job_utils.clone_job import clone_job

from ...db.ccp4i2_django_dbapi import CCP4i2DjangoDbApi


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent.parent.parent.parent.parent
    / "CCP4I2_TEST_PROJECT_DIRECTORY"
)
class CCP4i2TestCase(TestCase):
    def setUp(self):
        Path(settings.CCP4I2_PROJECTS_DIR).mkdir()
        import_ccp4_project_zip(
            Path(__file__).parent.parent.parent.parent.parent.parent
            / "test101"
            / "ProjectZips"
            / "refmac_gamma_test_0.ccp4_project.zip",
            relocate_path=(settings.CCP4I2_PROJECTS_DIR),
        )
        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_unset_output_data(self):
        job = Job.objects.get(pk=1)
        the_job_plugin = get_job_plugin(job)
        unset_output_data(the_job_plugin)
        et = the_job_plugin.container.getEtree()
        ET.indent(et, "\t", 0)
        self.assertEqual(1, 1)

    def test_remove_container_default_values(self):
        job = Job.objects.get(pk=1)
        the_job_plugin = get_job_plugin(job)
        remove_container_default_values(the_job_plugin.container)
        container: CCP4Container.CContainer = the_job_plugin.container
        et = container.getEtree()
        ET.indent(et, "\t", 0)
        self.assertEqual(1, 1)

    def test_find_objects(self):
        job = Job.objects.get(pk=1)
        the_job_plugin = get_job_plugin(job)
        container: CCP4Container.CContainer = the_job_plugin.container
        kpis = find_objects(
            container,
            lambda a: isinstance(a, CCP4PerformanceData.CPerformanceIndicator),
            True,
        )
        for kpi in kpis:
            for kpi_param_name in kpi.dataOrder():
                value = getattr(kpi, kpi_param_name)
                self.assertTrue(isinstance(value, CCP4Data.CString))
                self.assertTreu(isinstance(value, CCP4Data.CFloat))

    def test_load_nested_xml(self):
        startXML = ET.fromstring(prosmart_defmac_xml)
        result = load_nested_xml(startXML)
        ET.indent(result, " ")
        # print(ET.tostring(result).decode("utf-8"))

    def test_validate_container(self):
        job = Job.objects.get(pk=1)
        the_job_plugin = get_job_plugin(job)
        container: CCP4Container.CContainer = the_job_plugin.container
        error_etree: ET.Element = validate_container(container)

        self.assertEqual(len(error_etree.findall(".//errorReport")), 47)
        ET.indent(error_etree, " ")

    def test_validate_container_no_XYZIN(self):
        job = Job.objects.get(project__name="refmac_gamma_test_0", number="1")
        cloned_job = clone_job(job.uuid)
        the_job_plugin = get_job_plugin(cloned_job)
        container: CCP4Container.CContainer = the_job_plugin.container
        XYZIN = container.find("XYZIN")
        XYZIN.unSet()
        error_etree: ET.Element = validate_container(container)
        ET.indent(error_etree, " ")
        print(ET.tostring(error_etree).decode("utf-8"))
        self.assertEqual(len(error_etree.findall(".//errorReport")), 45)

    def test_validate_container_NCYCLES_MINUS_1(self):
        job = Job.objects.get(project__name="refmac_gamma_test_0", number="1")
        cloned_job = clone_job(job.uuid)
        the_job_plugin = get_job_plugin(cloned_job)
        container: CCP4Container.CContainer = the_job_plugin.container
        NCYCLES = container.find("NCYCLES")
        with self.assertRaises(CCP4ErrorHandling.CException):
            NCYCLES.set(-1)


prosmart_defmac_xml = """<ns0:ccp4i2 xmlns:ns0="http://www.ccp4.ac.uk/ccp4ns">
  <ccp4i2_header>
    <function>DEF</function>
    <comment/>
    <creationTime>14:00 19/Jul/12</creationTime>
    <userId>cowtan</userId>
    <ccp4iVersion>0.0.1</ccp4iVersion>
    <jobId/>
    <project/>
    <pluginName>prosmart_refmac</pluginName>
    <pluginVersion/>
    <jobNumber/>
  </ccp4i2_header>
  <ccp4i2_body id="prosmart_refmac">
    <file>
      <CI2XmlDataFile>
        <project>CCP4I2_TOP</project>
        <relPath>wrappers/refmac_i2/script</relPath>
        <baseName>refmac.def.xml</baseName>
      </CI2XmlDataFile>
    </file>
    <container id="inputData">
      <content id="AMINOACID_CHAINS">
        <className>CList</className>
        <qualifiers>
          <allowUndefined>True</allowUndefined>
        </qualifiers>
      </content>
      <content id="NUCLEOTIDE_CHAINS">
        <className>CList</className>
        <qualifiers>
          <allowUndefined>True</allowUndefined>
        </qualifiers>
      </content>
    </container>
  </ccp4i2_body>
</ns0:ccp4i2>"""
