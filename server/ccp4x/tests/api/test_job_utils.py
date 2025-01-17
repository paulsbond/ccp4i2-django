from pathlib import Path
from shutil import rmtree
from django.test import Client
from django.conf import settings
from django.test import TestCase, override_settings
from ...db.import_i2xml import import_ccp4_project_zip
from ...db.ccp4i2_django_projects_manager import CCP4i2DjangoProjectsManager
from ...db import models
from ...lib.job_utils.clone_job import clone_job
from ...lib.job_utils.run_job import run_job
from ...lib.job_utils.glean_job_files import glean_job_files
from ...lib.job_utils.get_job_container import get_job_container


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent.parent / "CCP4I2_TEST_PROJECT_DIRECTORY"
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
        self.pm = CCP4i2DjangoProjectsManager()
        self.client = Client()
        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_clone_job(self):
        old_job = models.Job.objects.all()[0]
        new_job = clone_job(old_job.uuid)
        self.assertEqual(new_job.task_name, old_job.task_name)

    def test_run_job(self):
        old_job = models.Job.objects.all()[0]
        new_job = clone_job(old_job.uuid)
        run_job(new_job.uuid)
        self.assertEqual(new_job.task_name, old_job.task_name)

    def test_glean_job_files(self):
        job = models.Job.objects.all()[0]
        container = get_job_container(job)
        # Delete old file_use entries
        file_uses = models.FileUse.objects.filter(job=job)
        for file_use in file_uses:
            file_use.delete()
        # Delete old file entries
        files = models.File.objects.filter(job=job)
        for file in files:
            file.delete()
        glean_job_files(str(job.uuid), container, [0, 1], True)
