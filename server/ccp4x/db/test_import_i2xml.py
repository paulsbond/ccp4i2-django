from pathlib import Path
from shutil import rmtree
from glob import glob
from django.test import TestCase, override_settings
from django.conf import settings
from .models import Project
from .import_i2xml import import_i2xml_from_file, import_ccp4_project_zip


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
        import_i2xml_from_file(
            Path(__file__).parent / "DATABASE.db.xml",
            relocate_path=settings.CCP4I2_PROJECTS_DIR,
        )
        self.assertEqual(len(list(Project.objects.all())), 1)

    def test_import_project_zip(self):
        import_ccp4_project_zip(
            Path(__file__).parent.parent.parent.parent.parent
            / "test101"
            / "ProjectZips"
            / "refmac_gamma_test_0.ccp4_project.zip",
            relocate_path=(settings.CCP4I2_PROJECTS_DIR),
        )
        print(
            glob(
                str(
                    settings.CCP4I2_PROJECTS_DIR
                    / "refmac_gamma_test_0"
                    / "CCP4_IMPORTED_FILES"
                    / "*"
                )
            )
        )
