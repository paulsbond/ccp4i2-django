import shlex
import os
from pathlib import Path
from shutil import rmtree
import subprocess
from xml.etree import ElementTree as ET
from django.test import TestCase, override_settings
from django.conf import settings
from core import CCP4PerformanceData
from core import CCP4ErrorHandling
from core import CCP4Data
from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4TaskManager
from ...db.models import Job, Project
from ...db.import_i2xml import import_ccp4_project_zip

from ...lib.job_utils.get_job_plugin import get_job_plugin
from ...lib.job_utils.unset_output_data import unset_output_data
from ...lib.job_utils.remove_container_default_values import (
    remove_container_default_values,
)
from ...lib.job_utils.find_objects import find_objects
from ...lib.job_utils.load_nested_xml import load_nested_xml
from ...lib.job_utils.validate_container import validate_container
from ...lib.job_utils.clone_job import clone_job
from ...lib.job_utils.json_for_job_container import json_for_job_container
from ...lib.job_utils.get_task_tree import get_task_tree
from ...lib.ccp4i2_report import get_report_job_info
from ccp4i2.pimple import MGQTmatplotlib

os.environ.setdefault("CCP4I2_TOP", str(Path(MGQTmatplotlib.__file__).parent.parent))

case1 = """# Generate some mdm2 data
i2run aimless_pipe \
    --UNMERGEDFILES \
        crystalName=hg7 \
        dataset=DS1 \
        file=$CCP4I2_TOP/demo_data/mdm2/mdm2_unmerged.mtz \
    --project_name refmac_gamma_test_0"""

OLD_CCP4I2_PROJECTS_DIR = settings.CCP4I2_PROJECTS_DIR


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

    def test_shlex(self):
        self.assertEqual(len(shlex.split(case1, comments=True)), 8)

    def test_case1(self):
        args = ["ccp4-python", "manage.py"] + shlex.split(
            os.path.expandvars(case1), comments=True
        )
        print(args)
        subprocess.call(args)
        print(Job.objects.last())
