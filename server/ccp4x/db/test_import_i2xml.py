from pathlib import Path
from shutil import rmtree
from django.test import TestCase, override_settings
from django.conf import settings
from .models import Project
from .import_i2xml import import_i2xml


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent / "CCP4I2_TEST_PROJECT_DIRECTORY"
)
class ImportI2xmlCase(TestCase):
    def setUp(self):
        Path(settings.CCP4I2_PROJECTS_DIR).mkdir()
        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_import_test_dbxml(self):
        import_i2xml(
            Path(__file__).parent / "DATABASE.db.xml",
            relocate_path=settings.CCP4I2_PROJECTS_DIR,
        )
        self.assertEqual(len(list(Project.objects.all())), 1)
