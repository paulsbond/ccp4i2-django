import os
import glob
import shlex
import logging
from pathlib import Path
from django.conf import settings
from django.utils.text import slugify
from .CCP4i2RunnerBase import CCP4i2RunnerBase
from ..db import models
from ..api import serializers
from ..lib.job_utils.create_job import create_job
from ..lib.job_utils.run_job import run_job
from ..lib.job_utils.save_params_for_job import save_params_for_job
from ..db.ccp4i2_django_wrapper import using_django_pm

# Get an instance of a logger
logger = logging.getLogger(f"ccp4x:{__name__}")


class CCP4i2RunnerDjango(CCP4i2RunnerBase):
    def __init__(self, the_args=None, command_line=None, parser=None, parent=None):
        assert (
            the_args is not None or command_line is not None
        ), "Need to provide one of args or command_line"
        if the_args is None and command_line is not None:
            split_args = [os.path.expandvars(a) for a in shlex.split(command_line)]
            assert (
                "--projectName" in split_args or "--projectId" in split_args
            ), "Must provide a projectId or a projectName for i2run in Django"
        super().__init__(
            the_args=the_args, command_line=command_line, parser=parser, parent=parent
        )

    def fileForFileUse(
        self,
        projectName=None,
        projectId=None,
        task_name=None,
        jobIndex=None,
        jobParamName=None,
        paramIndex=-1,
    ):
        # THis is logic to return a set of dbFile parameters corresponding to i2run file relative specification ( see below)
        assert not (projectName is None and projectId is None)
        assert jobParamName is not None
        assert jobIndex is not None
        if projectId is None:
            theProject = models.Project.objects.get(name=projectName)
            projectId = str(theProject.uuid).replace("-", "")
        elif projectName is None:
            theProject = models.Project.objects.get(uuid=projectId)
            projectName = theProject.name
        relevantJobs = models.Job.objects.filter(project=theProject)
        if task_name is not None:
            relevantJobs = relevantJobs.filter(task_name=task_name)
        logger.info(f"Filtered job list is {len(list(relevantJobs))}")

        assert (
            len(relevantJobs) > jobIndex
        ), f'Requested the "{jobIndex}"the instance of job with task_name task_name, but this does not exist'

        theJob: models.Job = list(relevantJobs)[jobIndex]
        logger.info(f"The job is {theJob}")

        # First consider might be output
        outputFiles = models.File.objects.filter(job=theJob)
        logger.info(
            f"outputFiles [{[(file.job_param_name, file.name) for file in outputFiles]}]"
        )
        possibleFiles = outputFiles.filter(job_param_name=jobParamName)

        theFile: models.File = None
        if len(possibleFiles) > 0:
            theFile = list(possibleFiles)[paramIndex]
        else:
            # Now if the file is an input file
            inputFileUses = models.FileUse.objects.filter(job=theJob)
            logger.info(
                f"inputFiles [{[(fileUse.job_param_name, fileUse.file.name) for fileUse in inputFileUses]}]"
            )
            inputFileUsesWithParam = inputFileUses.filter(job_param_name=jobParamName)
            possibleFiles = models.File.objects.filter(
                id__in=[fileUse.file.id for fileUse in inputFileUsesWithParam]
            )
            if len(possibleFiles) > 0:
                theFile = list(possibleFiles)[paramIndex]
        assert (
            theFile is not None
        ), f"Could not find a file for job {theJob} with job_param_name {jobParamName} and index"

        fileDict = {
            "project": str(theJob.project.uuid).replace("-", ""),
            "baseName": theFile.name,
            "dbFileId": str(theFile.uuid).replace("-", ""),
            # "annotation": theFile.annotation,
            # "subType": theFile.sub_type,
            # "contentFlag": theFile.content,
        }

        fileDict["relPath"] = os.path.join(
            "CCP4_JOBS",
            *(str(theFile.job.directory).split("CCP4_JOBS")[1].split(os.path.sep)),
        )
        if theFile.directory == models.File.Directory.IMPORT_DIR:
            fileDict["relPath"] = "CCP4_IMPORTED_FILES"
        logger.info("File match is %s", fileDict)
        return fileDict

    def projectWithName(self, projectName, projectPath=None):
        logger.info("In project with name %s", projectName)
        try:
            project = models.Project.objects.get(name=projectName)
            return project.uuid
        except models.Project.DoesNotExist as err:
            if projectPath is None:
                projectPath = settings.CCP4I2_PROJECTS_DIR / slugify(projectName)
            newProjectSerializer: serializers.ProjectSerializer = (
                serializers.ProjectSerializer(
                    data={
                        "name": projectName,
                        "directory": str(Path(projectPath).resolve()),
                    }
                )
            )
            assert (
                newProjectSerializer.is_valid()
            ), f"Project serializer invalid because {newProjectSerializer.errors}"
            newProject = newProjectSerializer.save()
            newProject.save()
            logger.info(
                f'Created new project "{newProject.name}" in {Path(newProject.directory).resolve()} with id {newProject.uuid}'
            )
            return newProject.uuid

    def projectJobWithTask(self, projectId, task_name=None):
        logger.info(f"Creating task {task_name} in project with id {projectId}")
        created_job_uuid = create_job(projectId=str(projectId), taskName=task_name)
        logger.info(
            f"Created task {task_name} in project with id {projectId} uuid {created_job_uuid}"
        )
        return created_job_uuid.replace("-", "")

    def pluginWithArgs(self, parsed_args, workDirectory=None, jobId=None):
        result = super().pluginWithArgs(parsed_args, workDirectory, jobId)
        save_params_for_job(result, the_job=models.Job.objects.get(uuid=jobId))
        return result

    def execute(self):
        thePlugin = self.getPlugin()
        assert self.jobId is not None
        assert self.projectId is not None
        thePlugin.saveParams()
        print(self.jobId)

        @using_django_pm
        def do_run():
            return run_job(self.jobId)

        exitStatus = do_run()

        return self.jobId, exitStatus
