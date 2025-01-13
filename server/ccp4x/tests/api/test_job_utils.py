from pathlib import Path
from shutil import rmtree
from django.test import Client
from django.conf import settings
from django.test import TestCase, override_settings
from ...db.import_i2xml import import_i2xml_from_file
from ...db import models


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent.parent / "CCP4I2_TEST_PROJECT_DIRECTORY"
)
class ApiTestCase(TestCase):
    def setUp(self):
        Path(settings.CCP4I2_PROJECTS_DIR).mkdir()
        import_i2xml_from_file(
            Path(__file__).parent.parent.parent / "db" / "DATABASE.db.xml",
            relocate_path=settings.CCP4I2_PROJECTS_DIR,
        )
        self.client = Client()
        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_import_test_dbxml(self):
        self.assertEqual(len(list(models.Project.objects.all())), 1)

    def test_projects(self):
        response = self.client.get(
            "/projects/", {"username": "john", "password": "smith"}
        )
        project_list = response.json()
        self.assertEqual(project_list[0]["name"], "MDM2CCP4X")

    def test_project_files(self):
        response = self.client.get(
            "/projects/1/files/",
        )
        self.assertEqual(len(response.json()), 24)

    def test_project_tags(self):
        response = self.client.get(
            "/projects/1/tags/",
        )
        self.assertEqual(len(response.json()), 1)
