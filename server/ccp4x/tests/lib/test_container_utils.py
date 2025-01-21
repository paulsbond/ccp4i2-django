from pathlib import Path
from shutil import rmtree
from xml.etree import ElementTree as ET
from django.test import TestCase, override_settings
from django.conf import settings
from core import CCP4PerformanceData
from core import CCP4Data
from ccp4i2.core import CCP4Container
from ...db.models import Job
from ...db.import_i2xml import import_ccp4_project_zip
from ...db.ccp4i2_django_projects_manager import CCP4i2DjangoProjectsManager

from ...lib.job_utils.get_job_plugin import get_job_plugin
from ...lib.job_utils.unset_output_data import unset_output_data
from ...lib.job_utils.remove_container_default_values import (
    remove_container_default_values,
)
from ...lib.job_utils.find_objects import find_objects

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
                print(kpi_param_name, value, isinstance(value, CCP4Data.CString))
                print(kpi_param_name, value, isinstance(value, CCP4Data.CFloat))
