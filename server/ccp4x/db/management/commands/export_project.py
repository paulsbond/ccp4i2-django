import uuid
import os
import subprocess
import platform
from pathlib import Path
from django.core.management.base import BaseCommand
from ccp4x.db.models import Project
from ccp4x.db.export_project import export_project_to_zip


class Command(BaseCommand):
    """
    A Django management command to export a CCP4 project to a ZIP archive.

    Attributes:
        help (str): Description of the command.
        requires_system_checks (list): List of system checks required before running the command.

    Methods:
        add_arguments(parser):
            Adds command-line arguments to the parser.

        handle(*args, **options):
            Handles the command execution. Retrieves the project based on provided options and exports it.
            If the detach option is specified, the export is run in a detached subprocess.

        get_project(options):
            Retrieves the project based on the provided options. Raises Project.DoesNotExist if no project is found.

        get_output_path(project, options):
            Determines the output path for the exported ZIP file based on project and options.
    """

    help = "Export a CCP4 project to ZIP archive"
    requires_system_checks = []

    def add_arguments(self, parser):
        # Project identification arguments
        parser.add_argument("-pn", "--projectname", help="Project name", type=str)
        parser.add_argument("-pi", "--projectid", help="Integer project id", type=int)
        parser.add_argument("-pu", "--projectuuid", help="Project uuid", type=str)

        # Export options
        parser.add_argument(
            "-o",
            "--output",
            help="Output ZIP file path (default: {project_name}_{timestamp}.zip)",
            type=str,
        )
        parser.add_argument(
            "-d", "--detach", help="Run export in detached process", action="store_true"
        )

    def handle(self, *args, **options):
        try:
            project = self.get_project(options)
        except Project.DoesNotExist as e:
            self.stderr.write(self.style.ERROR(str(e)))
            return

        output_path = self.get_output_path(project, options)

        if options["detach"]:
            self.run_detached_export(project, output_path)
        else:
            self.run_export(project, output_path)

    def get_project(self, options):
        """Retrieve project based on provided options."""
        if options["projectname"] is not None:
            return Project.objects.get(name=options["projectname"])
        if options["projectid"] is not None:
            return Project.objects.get(id=options["projectid"])
        if options["projectuuid"] is not None:
            return Project.objects.get(uuid=uuid.UUID(options["projectuuid"]))

        raise Project.DoesNotExist(
            "No project specified. Use --projectname, --projectid, or --projectuuid."
        )

    def get_output_path(self, project, options):
        """Determine output path for the exported ZIP file."""
        if options["output"]:
            return Path(options["output"])

        # Default output path: {project_name}_{uuid_first_8_chars}.zip
        safe_name = "".join(c for c in project.name if c.isalnum() or c in "._-")
        uuid_prefix = str(project.uuid).replace("-", "")[:8]
        filename = f"{safe_name}_{uuid_prefix}.zip"

        return Path.cwd() / filename

    def run_detached_export(self, project, output_path):
        """Run export in a detached subprocess."""
        # Determine the program name based on the OS
        ccp4_python_program = "ccp4-python"
        if platform.system() == "Windows":
            ccp4_python_program += ".bat"

        # Build command arguments for detached process
        cmd_args = [
            ccp4_python_program,
            "manage.py",
            "export_project",
            "-pu",
            str(project.uuid),
            "-o",
            str(output_path),
        ]

        # Create log file for detached process
        log_path = output_path.parent / f"{output_path.stem}_export.log"

        try:
            with open(log_path, "w", encoding="utf-8") as log_file:
                process = subprocess.Popen(
                    cmd_args,
                    start_new_session=True,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    cwd=os.getcwd(),
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Export started in detached process (PID: {process.pid})\n"
                        f"Project: {project.name} (UUID: {project.uuid})\n"
                        f"Output: {output_path}\n"
                        f"Log file: {log_path}"
                    )
                )

        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f"Failed to start detached export process: {e}")
            )

    def run_export(self, project, output_path):
        """Run export in the current process."""
        try:
            self.stdout.write(
                f"Exporting project '{project.name}' (UUID: {project.uuid})"
            )
            self.stdout.write(f"Output file: {output_path}")

            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Perform the export
            result_path = export_project_to_zip(project, output_path)

            # Get file size for confirmation
            file_size = result_path.stat().st_size
            file_size_mb = file_size / (1024 * 1024)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Export completed successfully!\n"
                    f"Output file: {result_path}\n"
                    f"File size: {file_size_mb:.2f} MB"
                )
            )

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Export failed: {e}"))

            # Clean up partial file if it exists
            if output_path.exists():
                try:
                    output_path.unlink()
                    self.stdout.write("Cleaned up partial export file.")
                except Exception:
                    pass
