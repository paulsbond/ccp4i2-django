from pathlib import Path
from shutil import rmtree
import json
from django.test import Client
from django.conf import settings
from django.test import TestCase, override_settings
from ...db.import_i2xml import import_i2xml_from_file
from ...db.import_i2xml import import_ccp4_project_zip
from ...db import models


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
        import_i2xml_from_file(
            Path(__file__).parent.parent / "db" / "DATABASE.db.xml",
            relocate_path=settings.CCP4I2_PROJECTS_DIR,
        )
        self.client = Client()
        return super().setUp()

    def tearDown(self):
        rmtree(settings.CCP4I2_PROJECTS_DIR)
        return super().tearDown()

    def test_import_test_dbxml(self):
        self.assertEqual(len(list(models.Project.objects.all())), 2)

    def test_projects(self):
        response = self.client.get(
            "/projects/", {"username": "john", "password": "smith"}
        )
        project_list = response.json()
        self.assertEqual(project_list[1]["name"], "MDM2CCP4X")

    def test_project_files(self):
        response = self.client.get(
            "/projects/2/files/",
        )
        self.assertEqual(len(response.json()), 24)

    def test_project_tags(self):
        response = self.client.get(
            "/projects/2/tags/",
        )
        self.assertEqual(len(response.json()), 1)

    def test_clone(self):
        response = self.client.post(
            "/jobs/1/clone/",
        )
        self.assertDictContainsSubset(
            {
                "id": 13,
                "number": "2",
                "title": "Refinement - Refmacat/Refmac5",
                "status": 1,
                "evaluation": 0,
                "comments": "",
                "finish_time": "1970-01-01T00:00:00Z",
                "task_name": "prosmart_refmac",
                "process_id": None,
                "project": 1,
                "parent": None,
            },
            response.json(),
        )

    def test_set_simple_parameter(self):
        response = self.client.post(
            "/jobs/1/set_parameter/",
            content_type="application/json; charset=utf-8",
            data=json.dumps(
                {
                    "object_path": "prosmart_refmac.controlParameters.NCYCLES",
                    "value": 20,
                }
            ),
        )
        result = response.json()
        self.assertDictEqual(
            result,
            {
                "status": "Success",
                "updated_item": "<NCYCLES>20</NCYCLES>",
            },
        )

    def test_set_file(self):
        response = self.client.post(
            "/jobs/1/set_parameter/",
            content_type="application/json; charset=utf-8",
            data=json.dumps(
                {
                    "object_path": "prosmart_refmac.inputData.XYZIN",
                    "value": {"dbFileId": "AFILEID", "subType": 1},
                }
            ),
        )
        result = response.json()
        self.assertDictEqual(
            result,
            {
                "status": "Success",
                "updated_item": "<XYZIN><dbFileId>AFILEID</dbFileId><subType>1</subType></XYZIN>",
            },
        )

    def test_set_file_null(self):
        response = self.client.post(
            "/jobs/1/set_parameter/",
            content_type="application/json; charset=utf-8",
            data=json.dumps(
                {
                    "object_path": "prosmart_refmac.inputData.XYZIN",
                    "value": None,
                }
            ),
        )
        result = response.json()
        print(result)
