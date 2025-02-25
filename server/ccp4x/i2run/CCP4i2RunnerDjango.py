from .CCP4i2RunnerBase import CCP4i2RunnerBase
from ..db import models
from ..api import serializers
from ..lib.job_utils.create_job import create_job
from ..lib.job_utils.run_job import run_job
import os
import shlex

# import the logging library
import logging

# Get an instance of a logger
logger = logging.getLogger("root")


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
            projectId = theProject.uuid
        elif projectName is None:
            theProject = models.Project.objects.get(uuid=projectId.replace("-", ""))
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
            # Now if the file is an output file
            inputFileUses = models.FileUse.objects.filter(job=theJob)
            logger.info(
                f"inputFiles [{[(fileUse.job_param_name, fileUse.file.name) for fileUse in inputFileUses]}]"
            )
            inputFileUsesWithParam = inputFileUses.filter(job_param_name=jobParamName)
            possibleFiles = models.File.objects.filter(
                file__in=[fileUse.file for fileUse in inputFileUsesWithParam]
            )
            if len(possibleFiles) > 0:
                theFile = list(possibleFiles)[paramIndex]
        assert (
            theFile is not None
        ), f"Could not find a file for job {theJob} with job_param_name {jobParamName} and index"

        fileDict = {
            "project": str(theJob.project.uuid).replace("-", ""),
            "baseName": theFile.name,
            "annotation": theFile.annotation,
            "dbFileId": str(theFile.uuid).replace("-", ""),
            "subType": theFile.sub_type,
            "contentFlag": theFile.content,
        }

        fileDict["relPath"] = os.path.join(
            "CCP4_JOBS",
            *(str(theFile.job.directory).split("CCP4_JOBS")[1].split(os.path.sep)),
        )
        if theFile.directory == models.File.Directory.IMPORT_DIR:
            fileDict["relPath"] = "CCP4_IMPORTED_FILES"

        return fileDict

    def projectWithName(self, projectName):
        print("In project with name")
        try:
            project = models.Project.objects.get(name=projectName)
            return project.uuid
        except models.Project.DoesNotExist as err:
            newProjectSerializer: serializers.ProjectSerializer = (
                serializers.ProjectSerializer(data={"name": projectName})
            )
            assert (
                newProjectSerializer.is_valid()
            ), f"Project serializer invalid because {newProjectSerializer.errors}"
            newProject = newProjectSerializer.save()
            newProject.save()
            logger.warning(
                f'Created new project "{newProject.name}" in {newProject.directory} with id {newProject.projectid}'
            )
            return newProject.uuid

    def projectJobWithTask(self, projectId, task_name=None):
        logger.warning(f"Creating task {task_name} in project with id {projectId}")
        created_job_uuid = create_job(projectId=str(projectId), taskName=task_name)
        logger.warning(
            f"Created task {task_name} in project with id {projectId} uuid {created_job_uuid}"
        )
        return created_job_uuid.replace("-", "")

    def execute(self):
        thePlugin = self.getPlugin()
        assert self.jobId is not None
        assert self.projectId is not None
        thePlugin.saveParams()
        theJob = models.Job.objects.get(jobid=self.jobId)
        exitStatus = run_job(self.jobId)

        return self.jobId, exitStatus
