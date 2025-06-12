from datetime import datetime
import logging
import traceback
import uuid

from ..lib.job_utils.glean_job_files import glean_job_files
from ..lib.job_utils.get_file_by_job_context import get_file_by_job_context
from . import models

logger = logging.getLogger(f"ccp4x:{__name__}")

project_field_old_to_new = {
    "followfromjobid": "follow_from_job",
    "i1projectdirectory": "i1_project_directory",
    "i1projectname": "i1_project_name",
    "lastaccess": "last_access",
    "lastjobnumber": "last_job_number",
    # "parentprojectid": "parentprojectid",
    "projectcreated": "creation_time",
    "projectdirectory": "directory",
    "projectid": "uuid",
    "projectname": "name",
    # "userid": "userid",
}
project_field_new_to_old = {
    item[1]: item[0] for item in project_field_old_to_new.items()
}
project_field_new_to_old["follow_from_job_id"] = "followfromjobid"

job_field_old_to_new = {
    "jobid": "uuid",
    "jobnumber": "number",
    "parentjobid": "parent__uuid",
    "projectid": "project__uuid",
    "taskname": "task_name",
    "title": "title",
    "status": "status",
    "comments": "comments",
    "creationtime": "creation_time",
    "finishtime": "finish_time",
    "projectname": "project__name",
    "projectdirectory": "project__directory",
}
job_field_new_to_old = {item[1]: item[0] for item in job_field_old_to_new.items()}

file_field_old_to_new = {
    "filecontent": "content",
    "subtype": "sub_type",
    "fileid": "uuid",
    "jobid": "job",
    "jobparamname": "job_param_name",
    "pathflag": "directory",
    "filename": "name",
    "annotation": "annotation",
    "filetypeid": "type",
}
file_field_new_to_old = {item[1]: item[0] for item in file_field_old_to_new.items()}


class CCP4i2DjangoDbApi(object):

    class FakeSignal:
        def emit(self, *arg, **kwarg):
            logger.info("CCP4i2DjangoDbApi been asked to emit %s, %s", arg, kwarg)

    def __init__(self):
        self.projectReset = CCP4i2DjangoDbApi.FakeSignal()
        super().__init__()

    def __getattribute__(self, __name):
        logger.debug("CCP4i2DjangoDbApi being interrogated for %s", __name)
        return super().__getattribute__(__name)

    def getFileByJobContext(
        self,
        contextJobId: str = None,
        fileType: str = None,
        subType: int = None,
        contentFlag: int = None,
        projectId: str = None,
    ) -> list:
        assert contextJobId is not None
        assert fileType is not None
        return get_file_by_job_context(
            contextJobId, fileType, subType, contentFlag, projectId
        )

    def getTaskNameLookup(self, projectId=None, jobId=None, extras=False):
        # Fixme....this should produce a lookup of subtasks sfor use in CCP4i2 purgeJob
        try:
            logger.warning(
                "In unimplemented routine getTaskNameLookup %s, %s, %s",
                projectId,
                jobId,
                extras,
            )
        except Exception as err:
            logger.exception(
                "Err in unimplemented routine getTaskNameLookup", exc_info=err
            )
        return {}

    def getProjectInfo(
        self, projectId=None, projectName=None, mode="all", checkPermission=True
    ):
        """
        Retrieve project information based on project ID or project name.

        Args:
            projectId (str, optional): The unique identifier of the project. Defaults to None.
            projectName (str, optional): The name of the project. Defaults to None.
            mode (str, optional): The mode of information retrieval. Defaults to "all".
            checkPermission (bool, optional): Flag to check permissions. Defaults to True.

        Returns:
            dict or any: The project information. If only one field is requested, returns the value of that field.
                         Returns None if an error occurs.

        Raises:
            Exception: Logs any exceptions that occur during the retrieval process.
        """
        if projectId is not None and "-" not in projectId:
            projectId = uuid.UUID(projectId)
        try:
            the_qs = self._get_project_queryset(projectId, projectName)
            arg = self._get_mode_arguments(mode)
            unpatched_values = the_qs.values(*arg)
            values = self._get_values_from_queryset(
                unpatched_values, project_field_new_to_old
            )
            result = list(values)[0]
            if len(arg) == 1:
                return result[project_field_new_to_old[arg[0]]]
            return result
        except Exception as err:
            logger.exception("Err in getProjectInfo", exc_info=err)
        return None

    def _get_project_queryset(self, projectId, projectName):
        if projectId is None:
            return models.Project.objects.filter(name=projectName)
        else:
            return models.Project.objects.filter(uuid=projectId)

    def _get_mode_arguments(self, mode):
        if isinstance(mode, list):
            return [item.lower() for item in mode]
        elif mode.lower() == "all":
            return [key for key in project_field_new_to_old.keys()]
        else:
            return [project_field_old_to_new[mode]]

    def _get_values_from_queryset(self, unpatched_values, substitution_dict):
        values = []
        for unPatchedValue in unpatched_values:
            value = {}
            for key in unPatchedValue:
                if key in substitution_dict:
                    value[substitution_dict[key]] = self._to_simple_types(
                        unPatchedValue[key]
                    )
            values.append(value)
        return values

    def _to_simple_types(self, value):
        if isinstance(value, uuid.UUID):
            return str(value)
        elif isinstance(value, datetime):
            return value.timestamp()
        else:
            return value

    def deleteFilesOnJobNumberAndParamName(self, projectId=None, jobNumberParamList=[]):
        try:
            for jobNumberParam in jobNumberParamList:
                # print('Requested to delete', jobNumberParam)
                try:
                    file = models.File.objects.get(
                        job__project__uuid=projectId,
                        job__number=jobNumberParam[0],
                        job_param_name=jobNumberParam[1],
                    )
                    file.delete()
                except models.File.DoesNotExist:
                    logger.warning(
                        "Err in deleteFilesOnJobNumberAndParamName %s %s %s",
                        projectId,
                        jobNumberParam[0],
                        jobNumberParam[1],
                    )
        except Exception as err:
            logger.exception(
                "Err in deleteFilesOnJobNumberAndParamName",
                exc_info=err,
                stack_info=True,
            )
        return None

    def getFileInfo(self, fileId=None, mode="all", returnType=None):
        assert fileId is not None
        the_file_qs = models.File.objects.filter(uuid=fileId)

        if isinstance(mode, list):
            arg = [item.lower() for item in mode]
        elif mode.lower() == "all":
            arg = [key for key in job_field_old_to_new.keys()]
        else:
            arg = [mode.lower()]

        # Will need corrected for some cases
        replacements = file_field_old_to_new

        def patch(label):
            return replacements.get(label, label)

        arg = list(map(patch, arg))

        unpatched_values = the_file_qs.values(*arg)

        listOfDicts = []
        for unPatchedValue in unpatched_values:
            # outer loop over jobs matching jobId
            value = {}
            for key in unPatchedValue:
                # inner loop over parameters
                if key.endswith("_id"):
                    value[key[:-3]] = unPatchedValue[key]
                else:
                    value[key] = unPatchedValue[key]
            listOfDicts.append(value)
        result = listOfDicts[0]

        if len(arg) == 1 and returnType != dict:
            return result[arg[0]]
        elif returnType == list:
            return [item[1] for item in result.items()]
        return result

    def getJobInfo(
        self, jobId=None, mode="all", projectName=None, jobNumber=None, returnType=None
    ):
        try:
            logger.info(f"jobId is {jobId}")
            if jobId is None:
                the_job_qs = models.Job.objects.filter(
                    project__name=projectName, number=jobNumber
                )
            else:
                if "-" not in str(jobId):
                    jobId = uuid.UUID(jobId)
                the_job_qs = models.Job.objects.filter(uuid=jobId)
            assert (
                len(list(the_job_qs)) == 1
            ), f"Expected 1 job, got {len(list(the_job_qs))} for jobId {jobId}"

            if isinstance(mode, list):
                arg = [item for item in mode]
            elif mode.lower() == "all":
                arg = [item.lower() for item in job_field_old_to_new.keys()]
            else:
                arg = [mode.lower()]

            def patch(label):
                return job_field_old_to_new.get(label, label)

            arg = list(map(patch, arg))
            # print(arg)

            unpatched_values = the_job_qs.values(*arg)
            unpatched_values = the_job_qs.values(*arg)
            values = self._get_values_from_queryset(
                unpatched_values, job_field_new_to_old
            )
            result = list(values)[0]
            if len(arg) == 1:
                return result[job_field_new_to_old[arg[0]]]
            result["fileroot"] = str(list(the_job_qs)[0].directory)

            jobFiles = models.File.objects.filter(job=list(the_job_qs)[0])
            result["filenames"] = {}
            for jobFile in jobFiles:
                result["filenames"][jobFile.job_param_name] = str(jobFile.path)
            return result
        except AssertionError as err:
            logger.exception("Assertion Error in getJobInfo", exc_info=err)
        except Exception as err:
            logger.exception("Err in getJobInfo", exc_info=err)
        return None

    def gleanJobFiles(
        self,
        jobId: str = None,
        container=None,
        dbOutputData=None,
        roleList=[0, 1],
        unSetMissingFiles=True,
    ):
        return glean_job_files(
            jobId,
            container=container,
            roleList=roleList,
            unSetMissingFiles=unSetMissingFiles,
        )
