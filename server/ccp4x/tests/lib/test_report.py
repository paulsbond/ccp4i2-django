from pathlib import Path
from shutil import rmtree
from django.test import TestCase, override_settings
from django.conf import settings
from ...db.models import Job
from ...db.import_i2xml import import_ccp4_project_zip
from ...lib.ccp4i2_report import get_report_job_info, get_job_container, make_old_report
from ...db.ccp4i2_django_projects_manager import (
    ccp4i2_django_projects_manager,
    using_django_pm,
)
from ...db.ccp4i2_django_dbapi import ccp4i2_django_dbapi


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent.parent.parent.parent.parent
    / "CCP4I2_TEST_PROJECT_DIRECTORY"
)
class CCP4i2ReportTestCase(TestCase):
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

    def test_status_labels(self):
        the_job = Job.objects.get(id=1)
        print(Job.Status(the_job.status).label)

    def test_get_job_container(self):
        the_job = Job.objects.get(id=1)
        container = get_job_container(the_job)
        print(container)

    def test_get_report_job_info(self):
        the_job = Job.objects.get(id=1)
        print(get_report_job_info(the_job.uuid))

    def test_make_old_report(self):
        the_job = Job.objects.get(id=1)
        print(make_old_report(the_job))

    def test_ccp4_db(self):
        a = ccp4i2_django_dbapi()
        print(a)

    def test_decorator(self):
        @using_django_pm
        def test_fn():
            print("Hello")

        test_fn()

    def test_ccp4_projects_manager(self):
        a = ccp4i2_django_projects_manager()
        print(a.db())
