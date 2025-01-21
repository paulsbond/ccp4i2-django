from pathlib import Path
from typing import List
import logging
import uuid

from ccp4i2.core import CCP4TaskManager

from ...db import models
from ...db.ccp4i2_django_wrapper import using_django_pm
from .remove_container_default_values import remove_container_default_values
from .save_params_for_job import save_params_for_job


logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(f"ccp4x:{__name__}")


def find_dependent_jobs(
    the_job: models.Job, growing_list: List[models.Job] = None
) -> List[models.Job]:
    assert isinstance(the_job, models.Job)
    if growing_list is None:
        growing_list: List[models.Job] = []
    descendent_files = models.File.objects.filter(
        job=the_job
    )  # Do I also have to worry about FileImports in this job ? I don't think so...those should have an associated FileUse
    descendent_file_uses = models.FileUse.objects.filter(file__in=descendent_files)
    descendent_jobs = [
        file_use.job for file_use in descendent_file_uses if file_use.job != the_job
    ]
    for descendent_job in descendent_jobs:
        if descendent_job not in growing_list:
            growing_list.append(descendent_job)
            find_dependent_jobs(descendent_job, growing_list)
    return growing_list
