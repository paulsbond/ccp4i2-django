from django.core.management.base import BaseCommand

from ccp4x.lib.importZip import import_project


class Command(BaseCommand):

    help = "Import a project"
    requires_system_checks = []

    def add_arguments(self, parser):
        parser.add_argument("project_xml")

    def handle(self, *args, **options):
        self.stdout.write(f"{options}")
        import_project(*args, **options)
