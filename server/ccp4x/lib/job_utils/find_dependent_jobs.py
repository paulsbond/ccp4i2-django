from typing import List
import logging
import shutil

from ...db import models

logger = logging.getLogger(f"ccp4x:{__name__}")


# Note that python handles tuple sort exactly as one would wish
# https://stackoverflow.com/questions/2574080/how-to-sort-in-python-a-list-of-strings-containing-numbers
def version_sort_key(job: models.Job) -> tuple:
    return tuple(map(int, job.number.split(".")))


def find_dependent_jobs(
    the_job: models.Job, growing_list: List[models.Job] = None, leaf_action=None
) -> List[models.Job]:
    assert isinstance(the_job, models.Job)
    if growing_list is None:
        growing_list: List[models.Job] = []
    descendent_files = models.File.objects.filter(job=the_job)
    # Do I also have to worry about FileImports in this job ? I don't think so...those should have an associated FileUse
    descendent_file_uses = models.FileUse.objects.filter(file__in=descendent_files)
    unsorted_descendent_jobs = list(
        {file_use.job for file_use in descendent_file_uses if file_use.job != the_job}
    )
    descendent_jobs = sorted(
        unsorted_descendent_jobs, key=version_sort_key, reverse=True
    )
    logger.debug("descendent_jobs: {%s}", [dj.number for dj in descendent_jobs])
    for descendent_job in descendent_jobs:
        if descendent_job not in growing_list:
            growing_list.append(descendent_job)
            original_length = len(growing_list)
            find_dependent_jobs(descendent_job, growing_list)
            new_length = len(growing_list)
            if original_length == new_length:
                # Here if this is a leaf (i.e. descendent-free)
                if leaf_action is not None:
                    leaf_action(descendent_job)
    return growing_list


def delete_job_and_dir(the_job: models.Job):
    char_values_of_job = models.JobCharValue.objects.filter(job=the_job)
    for char_value_of_job in char_values_of_job:
        char_value_of_job.delete()
    float_values_of_job = models.JobFloatValue.objects.filter(job=the_job)
    for float_value_of_job in float_values_of_job:
        float_value_of_job.delete()
    files_of_job = models.File.objects.filter(job=the_job)
    job_file: models.File
    for job_file in files_of_job:
        try:
            job_file.path.unlink()
        except FileNotFoundError:
            logger.debug("File  not found when trying to delete it %s", job_file.path)
        job_file.delete()
    shutil.rmtree(str(the_job.directory))
    the_job.delete()


def delete_job_and_dependents(the_job: models.Job):
    jobs_before = models.Job.objects.count()
    files_before = models.File.objects.count()
    file_uses_before = models.FileUse.objects.count()
    file_imports_before = models.FileImport.objects.count()
    # Fix me: Note that this does not remove files that are located in CCP4_IMPORTED_FILES
    find_dependent_jobs(
        the_job, leaf_action=lambda sub_job: delete_job_and_dir(sub_job)
    )
    the_job.delete()
    jobs_after = models.Job.objects.count()
    files_after = models.File.objects.count()
    file_uses_after = models.FileUse.objects.count()
    file_imports_after = models.FileImport.objects.count()
    logger.info("Deleted %s jobs", jobs_after - jobs_before)
    logger.info("Deleted %s files", files_after - files_before)
    logger.info("Deleted %s file_uses", file_uses_after - file_uses_before)
    logger.info("Deleted %s jobs", file_imports_after - file_imports_before)
