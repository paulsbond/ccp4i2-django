from pathlib import Path
from shutil import rmtree
from xml.etree import ElementTree as ET
from django.test import TestCase, override_settings
from django.conf import settings
from ...db.models import Job, File, FileImport
from ...db.import_i2xml import import_ccp4_project_zip

from ...lib.job_utils.get_job_plugin import get_job_plugin
from ...lib.job_utils.mtz_as_dict import mtz_as_dict
from ...lib.job_utils.unset_output_data import unset_output_data
from ...lib.job_utils.remove_container_default_values import (
    remove_container_default_values,
)
from ...lib.job_utils.find_objects import find_objects
from ...lib.job_utils.load_nested_xml import load_nested_xml
from ...lib.job_utils.validate_container import validate_container
from ...lib.job_utils.clone_job import clone_job
from ...lib.job_utils.create_job import create_job
from ...lib.job_utils.json_for_job_container import json_for_job_container
from ...lib.job_utils.get_task_tree import get_task_tree
from ...lib.job_utils.ccp4i2_report import get_report_job_info
from ...lib.job_utils.gemmi_split_mtz import gemmi_split_mtz
from ...lib.job_utils.export_job_mtz_file import export_job_mtz_file
from ...lib.job_utils.get_source_reflection_file import get_source_reflection_file


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
        import_ccp4_project_zip(
            Path(__file__).parent.parent.parent.parent.parent.parent
            / "test101"
            / "ProjectZips"
            / "aimless_gamma_native_test_1.ccp4_project.zip",
            relocate_path=(settings.CCP4I2_PROJECTS_DIR),
        )

        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_aimless_get_source(self):
        the_job = Job.objects.filter(task_name="prosmart_refmac").first()
        print(File.objects.filter(job=the_job))
        print(FileImport.objects.filter(file__job=the_job))
        get_source_reflection_file(
            jobId=the_job.uuid,
            jobParamNameList=["F_SIGF"],
        )

    def test_export_job_mtz_file(self):
        job = Job.objects.filter(task_name="prosmart_refmac").first()
        if not job:
            raise ValueError("No job found with task_name 'prosmart_refmac'")
        export_job_mtz_file(job.uuid)
