import shlex
import os
import glob
from pathlib import Path
from shutil import rmtree
import uuid
from argparse import ArgumentParser
from xml.etree import ElementTree as ET
from django.test import TestCase, override_settings
from django.conf import settings
from core import CCP4PerformanceData
from core import CCP4ErrorHandling
from core import CCP4Data
from core import CCP4File
from ccp4i2.core.CCP4File import CDataFile
from core import CCP4Modules
from ccp4i2.core import CCP4Container
from ccp4i2.core import CCP4TaskManager
from ...db.models import Job, Project, File, JobCharValue, JobFloatValue
from ...db.import_i2xml import import_ccp4_project_zip

from ...i2run import CCP4i2RunnerDjango
from ccp4i2.pimple import MGQTmatplotlib

os.environ.setdefault("CCP4I2_TOP", str(Path(MGQTmatplotlib.__file__).parent.parent))

case1 = """aimless_pipe \
    --UNMERGEDFILES \
        crystalName=hg7 \
        dataset=DS1 \
        file=$CCP4I2_TOP/demo_data/mdm2/mdm2_unmerged.mtz \
    --project_name refmac_gamma_test_0"""


case2a = """aimless_pipe \
    --UNMERGEDFILES \
        crystalName=hg7 \
        dataset=DS1 \
        file=$CCP4I2_TOP/demo_data/mdm2/mdm2_unmerged.mtz \
    --XYZIN_REF fullPath=$CCP4I2_TOP/demo_data/mdm2/4hg7.pdb \
	--MODE MATCH \
	--REFERENCE_DATASET XYZ \
    --project_name refmac_gamma_test_0"""

case2b = """prosmart_refmac \
    --F_SIGF fileUse="aimless_pipe[-1].HKLOUT[0]" \
    --XYZIN \
        fullPath=$CCP4I2_TOP/demo_data/mdm2/4hg7.pdb \
        selection/text="not (HOH)" \
    --prosmartProtein.REFERENCE_MODELS \
        fullPath=$CCP4I2_TOP/demo_data/mdm2/4qo4.cif \
    --project_name refmac_gamma_test_0"""

OLD_CCP4I2_PROJECTS_DIR = settings.CCP4I2_PROJECTS_DIR


@override_settings(
    CCP4I2_PROJECTS_DIR=Path(__file__).parent.parent.parent.parent.parent
    / "CCP4I2_TEST_PROJECT_DIRECTORY"
)
class CCP4i2TestCase(TestCase):
    def setUp(self):
        Path(settings.CCP4I2_PROJECTS_DIR).mkdir()
        self.app = CCP4Modules.QTAPPLICATION()
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
        self.assertEqual(len(shlex.split(case1, comments=True)), 7)

    def test_case1(self):
        args = shlex.split(os.path.expandvars(case1), comments=True)
        print(args)
        i2Runner = CCP4i2RunnerDjango.CCP4i2RunnerDjango(
            the_args=args,
            parser=ArgumentParser(),
            parent=CCP4Modules.QTAPPLICATION(),
        )
        # i2Runner.parseArgs()
        print("Initial file count", File.objects.count())
        i2Runner.execute()
        self.assertEqual(Job.objects.last().project.name, "refmac_gamma_test_0")
        self.assertEqual(Job.objects.last().number, "2.5")
        the_job = Job.objects.get(uuid=uuid.UUID(i2Runner.jobId))
        self.assertEqual(JobCharValue.objects.filter(job=the_job)[0].value, "P 61 2 2")

    def test_case2(self):
        args = shlex.split(os.path.expandvars(case1), comments=True)
        i2Runner = CCP4i2RunnerDjango.CCP4i2RunnerDjango(
            the_args=args,
            parser=ArgumentParser(),
            parent=CCP4Modules.QTAPPLICATION(),
        )
        i2Runner.execute()
        self.assertEqual(Job.objects.last().project.name, "refmac_gamma_test_0")
        self.assertEqual(Job.objects.last().number, "2.5")
        the_job = Job.objects.get(uuid=uuid.UUID(i2Runner.jobId))
        self.assertEqual(JobCharValue.objects.filter(job=the_job)[0].value, "P 61 2 2")

        args = shlex.split(os.path.expandvars(case2b), comments=True)
        i2Runner = CCP4i2RunnerDjango.CCP4i2RunnerDjango(
            the_args=args,
            parser=ArgumentParser(),
            parent=CCP4Modules.QTAPPLICATION(),
        )
        i2Runner.execute()
        self.assertEqual(Job.objects.last().project.name, "refmac_gamma_test_0")
        self.assertEqual(Job.objects.filter(parent__isnull=True).last().number, "3")
        the_job = Job.objects.get(uuid=uuid.UUID(i2Runner.jobId))
        print(glob.glob(str(the_job.directory / "*")))
        self.assertEqual(the_job.status, Job.Status.FINISHED)
        self.assertEqual(JobFloatValue.objects.filter(job=the_job)[0].value, 0.3)
