from django.conf import settings
from django.core.management.base import BaseCommand

from ccp4x.db.import_i2xml import import_ccp4_project_zip


class Command(BaseCommand):

    help = "Import a project"
    requires_system_checks = []

    def add_arguments(self, parser):
        parser.add_argument("zip_file", nargs="*")

    def handle(self, *args, **options):
        self.stdout.write(f"{options}")
        for zip_file in options["zip_file"]:
            import_ccp4_project_zip(
                zip_file, relocate_path=settings.CCP4I2_PROJECTS_DIR
            )
