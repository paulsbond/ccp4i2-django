from pathlib import Path
from shutil import rmtree
from django.test import Client
from django.conf import settings
from django.test import TestCase, override_settings
from ...db.import_i2xml import import_ccp4_project_zip
from ...db.ccp4i2_projects_manager import FakeProjectsManager
from ...db import models
from ...lib.job_utils import CloneJob


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent.parent / "CCP4I2_TEST_PROJECT_DIRECTORY"
)
class ApiTestCase(TestCase):
    def setUp(self):
        Path(settings.CCP4I2_PROJECTS_DIR).mkdir()
        import_ccp4_project_zip(
            Path(__file__).parent.parent.parent.parent.parent.parent
            / "test101"
            / "ProjectZips"
            / "refmac_gamma_test_0.ccp4_project.zip",
            relocate_path=(settings.CCP4I2_PROJECTS_DIR),
        )
        self.pm = FakeProjectsManager()
        self.client = Client()
        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_clone_job(self):
        old_job = models.Job.objects.all()[0]
        new_id = CloneJob(old_job.uuid)
        print(new_id)
