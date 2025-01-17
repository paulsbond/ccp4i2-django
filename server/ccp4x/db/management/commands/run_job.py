import uuid
import subprocess
from django.core.management.base import BaseCommand
from ccp4x.db.models import Job, Project
from ccp4x.lib.job_utils.run_job import run_job


class Command(BaseCommand):

    help = "Import a project"
    requires_system_checks = []

    def add_arguments(self, parser):
        parser.add_argument("-ji", "--jobid", help="Integer job id", type=int)
        parser.add_argument("-ju", "--jobuuid", help="Job UUID", type=str)
        parser.add_argument("-pn", "--projectname", help="Project name", type=str)
        parser.add_argument("-pi", "--projectid", help="Integer project id", type=int)
        parser.add_argument("-pu", "--projectuuid", help="Project uuid", type=int)
        parser.add_argument("-jn", "--jobnumber", help="Job number", type=str)
        parser.add_argument("-d", "--detach", help="Detach job", action="store_true")

    def handle(self, *args, **options):
        the_job = None
        if options["jobid"] is not None:
            the_job = Job.objects.get(id=options["jobid"])
        elif options["jobuuid"] is not None:
            the_job = Job.objects.get(uuid=uuid.UUID(options["jobuuid"]))
        elif options["projectname"] is not None:
            if options["jobnumber"] is not None:
                the_project = Project.objects.get(name=options["projectname"])
                the_job = Job.objects.get(
                    number=options["jobnumber"], project=the_project
                )
        elif options["projectid"] is not None:
            if options["jobnumber"] is not None:
                the_project = Project.objects.get(id=options["projectid"])
                the_job = Job.objects.get(
                    number=options["jobnumber"], project=the_project
                )
        elif options["projectuuid"] is not None:
            if options["jobnumber"] is not None:
                the_project = Project.objects.get(
                    uuid=uuid.UUID(options["projectuuid"])
                )
                the_job = Job.objects.get(
                    number=options["jobnumber"], project=the_project
                )

        if the_job:
            if options["detach"]:
                _ = subprocess.Popen(
                    [
                        "ccp4-python",
                        "manage.py",
                        "run_job",
                        "-ju",
                        f"{str(the_job.uuid)}",
                    ],
                    start_new_session=True,
                )
            else:
                run_job(the_job.uuid)
