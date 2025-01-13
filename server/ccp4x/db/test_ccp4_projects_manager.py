from pathlib import Path
from shutil import rmtree
from glob import glob
from django.test import TestCase, override_settings
from django.conf import settings
from .models import Project, Job
from .import_i2xml import import_i2xml_from_file, import_ccp4_project_zip
from .ccp4i2_projects_manager import UsingFakePM, FakeProjectsManager


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent / "CCP4I2_TEST_PROJECT_DIRECTORY"
)
class Tests(TestCase):
    def setUp(self):
        Path(settings.CCP4I2_PROJECTS_DIR).mkdir()
        import_ccp4_project_zip(
            Path(__file__).parent.parent.parent.parent.parent
            / "test101"
            / "ProjectZips"
            / "refmac_gamma_test_0.ccp4_project.zip",
            relocate_path=(settings.CCP4I2_PROJECTS_DIR),
        )
        self.pm = FakeProjectsManager()
        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_getProjectInfo(self):
        import_ccp4_project_zip(
            Path(__file__).parent.parent.parent.parent.parent
            / "test101"
            / "ProjectZips"
            / "refmac_gamma_test_0.ccp4_project.zip",
            relocate_path=(settings.CCP4I2_PROJECTS_DIR),
        )
        project = Project.objects.get(name="refmac_gamma_test_0")
        project_dir = self.pm.getProjectDirectory(projectName=project.name)
        self.assertEqual(project_dir, project.directory)
        project_info = self.pm.db().getProjectInfo(
            projectName=project.name, mode="projectcreated"
        )
        self.assertEqual(project_info, 1594563098.31)

    def test_getJobInfo(self):
        project = Project.objects.get(name="refmac_gamma_test_0")
        job_info = self.pm.db().getJobInfo(projectName=project.name, jobNumber="1")
        print(job_info)
