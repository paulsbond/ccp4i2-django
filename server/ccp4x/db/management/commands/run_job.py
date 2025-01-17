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
        parser.add_argument("-pu", "--projectuuid", help="Project uuid", type=str)
        parser.add_argument("-jn", "--jobnumber", help="Job number", type=str)
        parser.add_argument("-d", "--detach", help="Detach job", action="store_true")

    def handle(self, *args, **options):
        try:
            the_job = self.get_job(options)
        except (Job.DoesNotExist, Project.DoesNotExist) as e:
            self.stderr.write(self.style.ERROR(str(e)))
            return

        if options["detach"]:
            subprocess.Popen(
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

    def get_job(self, options):
        if options["jobid"] is not None:
            return Job.objects.get(id=options["jobid"])
        if options["jobuuid"] is not None:
            return Job.objects.get(uuid=uuid.UUID(options["jobuuid"]))
        if options["projectname"] is not None and options["jobnumber"] is not None:
            the_project = Project.objects.get(name=options["projectname"])
            return Job.objects.get(number=options["jobnumber"], project=the_project)
        if options["projectid"] is not None and options["jobnumber"] is not None:
            the_project = Project.objects.get(id=options["projectid"])
            return Job.objects.get(number=options["jobnumber"], project=the_project)
        if options["projectuuid"] is not None and options["jobnumber"] is not None:
            the_project = Project.objects.get(uuid=uuid.UUID(options["projectuuid"]))
            return Job.objects.get(number=options["jobnumber"], project=the_project)
        raise Job.DoesNotExist("No job found with the provided criteria.")
