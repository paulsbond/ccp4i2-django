"""Django's command-line utility for administrative tasks."""

from os import environ
from sys import argv
from django.core.management import execute_from_command_line


def main():
    """Run administrative tasks."""
    environ.setdefault("DJANGO_SETTINGS_MODULE", "ccp4x.config.settings")
    execute_from_command_line(argv)


if __name__ == "__main__":
    main()
