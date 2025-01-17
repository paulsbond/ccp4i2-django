import logging
import traceback
import uuid
from datetime import datetime
from ccp4i2.core import CCP4Data
from django.db import IntegrityError

from . import models
from ..lib.utils import uuid_from_no_hyphens
from ccp4i2.core import CCP4File
from ccp4i2.core import CCP4PerformanceData
from ccp4i2.core import CCP4Container

logging.basicConfig(level=logging.INFO)
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
            logger.info("Ive been asked to emit %s, %s", arg, kwarg)

    def __init__(self):
        self.projectReset = CCP4i2DjangoDbApi.FakeSignal()
        super().__init__()

    def __getattribute__(self, __name):
        logger.debug("CCP4i2DjangoDbApi being interrogated for %s", __name)
        return super().__getattribute__(__name)

    def getFileByJobContext(
        self,
        contextJobId=None,
        fileType=None,
        subType=None,
        contentFlag=None,
        projectId=None,
    ):
        assert contextJobId is not None
        assert fileType is not None

        context_job_in = models.Job.objects.get(uuid=contextJobId)
        project_jobs = models.Job.objects.filter(
            parentjobid__isnull=True, projectid=context_job_in.uuid
        )
        search_jobs_list = [
            project_job
            for project_job in project_jobs
            if int(project_job.number) <= int(context_job_in.number)
        ]
        search_jobs_list.reverse()

        while len(search_jobs_list) > 0:
            context_job = search_jobs_list.pop()
            logger.info("Looking for context in %s", context_job.number)

            output_file_ids, import_file_ids = self._get_job_files(
                context_job, fileType, subType, contentFlag, projectId
            )

            if len(output_file_ids) > 0:
                if context_job.task_name == "coot_rebuild":
                    return output_file_ids[::-1]
                else:
                    return output_file_ids
            elif len(import_file_ids) > 0:
                return import_file_ids

            input_file_ids = self._get_file_uses(
                context_job, fileType, subType, contentFlag, projectId
            )

            if len(input_file_ids) > 0:
                if context_job.task_name == "coot_rebuild":
                    return input_file_ids[::-1]
                else:
                    return input_file_ids

        return []

    def _get_job_files(
        self,
        context_job: models.Job,
        fileType: str,
        subType: int,
        contentFlag: int,
        projectId: str,
    ):
        filter_dict = {"file_type__name": fileType}
        if isinstance(subType, list) and 0 not in subType and subType is not None:
            filter_dict["sub_type__in"] = subType
        elif not isinstance(subType, list) and subType != 0 and subType is not None:
            filter_dict["sub_type"] = subType
        if contentFlag is not None and contentFlag is not NotImplemented:
            if not isinstance(contentFlag, list):
                filter_dict["content"] = contentFlag
            else:
                filter_dict["content__in"] = contentFlag
        if projectId is not None:
            filter_dict["job__project__uuid"] = projectId
        logger.debug("Using filter_dict %s", filter_dict)
        file_qs = models.File.objects.filter(**filter_dict)

        job_file_qs = file_qs.filter(job=context_job)
        job_file_id_list = [jobFile.uuid for jobFile in job_file_qs]

        file_imports = models.FileImport.objects.filter(file__uuid__in=job_file_id_list)
        import_file_ids = [importFile.file.uuid for importFile in file_imports]
        output_file_ids = [
            jobFileId
            for jobFileId in job_file_id_list
            if jobFileId not in import_file_ids
        ]

        return output_file_ids, import_file_ids

    def _get_file_uses(
        self,
        context_job: models.Job,
        fileType: str,
        subType: int,
        contentFlag: int,
        projectId: str,
    ):
        filter_dict = {"file__type__name": fileType}
        if isinstance(subType, list) and 0 not in subType and subType is not None:
            filter_dict["file__sub_type__in"] = subType
        elif not isinstance(subType, list) and subType != 0 and subType is not None:
            filter_dict["file__sub_type"] = subType
        if contentFlag is not None and contentFlag is not NotImplemented:
            if not isinstance(contentFlag, list):
                filter_dict["file__content"] = contentFlag
            else:
                filter_dict["file__content__in"] = contentFlag
        if projectId is not None:
            filter_dict["job__project__uuid"] = projectId

        fileuse_qs = models.FileUse.objects.filter(**filter_dict)
        jobfileuse_qs = fileuse_qs.filter(job=context_job)

        output_file_qs = jobfileuse_qs.filter(role=0)
        output_id_list = [outputFileUse.file.uuid for outputFileUse in output_file_qs]

        inputfile_qs = jobfileuse_qs.filter(role=1)
        input_id_list = [inputFile.file.uuid for inputFile in inputfile_qs]

        return output_id_list + input_id_list

    def getTaskNameLookup(self, projectId=None, jobId=None, extras=False):
        # Fixme....this should produce a lookup of subtasks sfor use in CCP4i2 purgeJob
        try:
            logger.warning(
                "In unimplemented toutine getTaskNameLookup %s, %s, %s",
                projectId,
                jobId,
                extras,
            )
        except Exception as err:
            logger.warning("Err in unimplemented routine getTaskNameLookup %s", err)
            traceback.print_stack()
        return {}

    def getProjectInfo(
        self, projectId=None, projectName=None, mode="all", checkPermission=True
    ):
        if projectId is not None and "-" not in projectId:
            projectId = uuid_from_no_hyphens(projectId)
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
            logger.exception("Err in getProjectInfo %s", err)
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
                except models.File.DoesNotExist as err:
                    logger.warning(
                        "Err in deleteFilesOnJobNumberAndParamName %s %s %s"
                        % (projectId, jobNumberParam[0], jobNumberParam[1])
                    )
        except Exception as err:
            logger.error(
                "Err in deleteFilesOnJobNumberAndParamName %s", err, stack_info=True
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
                    jobId = uuid_from_no_hyphens(jobId)
                the_job_qs = models.Job.objects.filter(uuid=jobId)
            assert len(list(the_job_qs)) == 1

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
        try:
            the_job = models.Job.objects.get(uuid=jobId)
            for role in roleList:
                roleid = role
                inputOutputFiles = self.findInputOutputs(container, role, [])
                for inputOutputFile in inputOutputFiles:
                    self._process_input_output_file(inputOutputFile, the_job, roleid)
            return 0
        except Exception as err:
            logger.info("Err in gleanFiles %s", err)
            traceback.print_stack()
        return None

    def _process_input_output_file(self, inputOutputFile, the_job, roleid):
        if isinstance(inputOutputFile, CCP4PerformanceData.CPerformanceIndicator):
            self._process_performance_indicator(inputOutputFile, the_job)
        elif isinstance(inputOutputFile, CCP4File.CDataFile):
            self._processDataFile(inputOutputFile, the_job, roleid)

    def _process_performance_indicator(self, inputOutputFile, the_job):
        keyValues = {}
        try:
            _, _, keyValues = inputOutputFile.saveToDb()
        except Exception as err:
            logger.info(
                "ERROR in gleanJobFiles for %s - %s", inputOutputFile.objectName(), err
            )
            _, _, keyValues = [], None, {}
        for key, value in keyValues.items():
            keyType = key
            if isinstance(value, str):
                newKeyvalue = models.JobCharValue(job=the_job, key=keyType, value=value)
                newKeyvalue.save()
            else:
                newKeyvalue = models.JobFloatValue(
                    job=the_job, key=keyType, value=value
                )
                newKeyvalue.save()

    def _processDataFile(self, inputOutputFile, the_job, roleid):
        logger.info(
            "Gleaning %s - %s",
            inputOutputFile.objectName(),
            inputOutputFile.getFullPath(),
        )
        jobParamName = inputOutputFile.objectName()
        if len(inputOutputFile.getFullPath()) > 0:
            try:
                if (
                    inputOutputFile.dbFileId is not None
                    and len(str(inputOutputFile.dbFileId)) != 0
                ):
                    theFile = models.File.objects.get(
                        uuid=str(inputOutputFile.dbFileId)
                    )
                    self._processExistingFile(theFile, the_job, roleid, jobParamName)
            except models.FileUse.DoesNotExist as err:
                logger.info(
                    "ObjectDoesNotExist issue gleaning %s - file not found %s",
                    jobParamName,
                    err,
                )
            except IntegrityError as err:
                logger.info(
                    "IntegrityError Issue gleaning %s %s %s %s - %s",
                    jobParamName,
                    inputOutputFile.dbFileId,
                    roleid,
                    theFile.name,
                    err,
                )
            if roleid == 1:
                self._processOutputFile(inputOutputFile, the_job, roleid, jobParamName)

    def _processExistingFile(self, theFile, the_job, roleid, jobParamName):
        try:
            _ = models.FileUse.objects.get(file=theFile, job=the_job, role=roleid)
        except models.FileUse.DoesNotExist:
            newFileUse = models.FileUse(
                file=theFile,
                job=the_job,
                role=roleid,
                job_param_name=jobParamName,
            )
            newFileUse.save()

    def _processOutputFile(self, inputOutputFile, the_job, roleid, jobParamName):
        if inputOutputFile.exists():
            fileTypeName = inputOutputFile.qualifiers("mimeTypeName")
            if len(fileTypeName) == 0:
                logger.info(
                    "Class %s Does not have an associated mimeTypeName....ASK FOR DEVELOPER FIX",
                    str(inputOutputFile.__class__),
                )
                if isinstance(inputOutputFile, CCP4File.CXmlDataFile):
                    fileTypeName = "application/xml"
            try:
                subType = (
                    int(inputOutputFile.subType) if inputOutputFile.subType else None
                )
                fileContent = (
                    int(inputOutputFile.contentFlag)
                    if inputOutputFile.contentFlag
                    else None
                )
                newFile = models.File(
                    name=str(inputOutputFile.baseName),
                    annotation=str(inputOutputFile.annotation),
                    type=fileTypeName,
                    sub_type=subType,
                    content=fileContent,
                    job=the_job,
                    job_param_name=jobParamName,
                    directory=1,
                )
                newFile.save()
                newFileUse = models.FileUse(
                    file=newFile,
                    job=the_job,
                    role=roleid,
                    job_param_name=jobParamName,
                )
                newFileUse.save()
            except Exception as err:
                logger.info(
                    "Issue saving new file %s - filetype ]%s] not recognised %s",
                    jobParamName,
                    fileTypeName,
                    err,
                )

    def findInputOutputs(self, ofContainer, role, inputOutputsFound=None):
        if inputOutputsFound is None:
            inputOutputsFound = []
        if isinstance(ofContainer, str):
            logger.info("Cant findInputOutputs of string %s", ofContainer)
            return inputOutputsFound
        else:
            return self._findInputOutputsInContainer(
                ofContainer, role, inputOutputsFound
            )

    def _findInputOutputsInContainer(self, container, role, inputOutputsFound):
        for child in container.children():
            self._processChild(child, role, inputOutputsFound)
        return inputOutputsFound

    def _processChild(self, child, role, inputOutputsFound):
        if isinstance(child, CCP4PerformanceData.CPerformanceIndicator):
            inputOutputsFound.append(child)
        elif isinstance(child, CCP4Container.CContainer):
            self._processContainerChild(child, role, inputOutputsFound)
        elif isinstance(child, CCP4Data.CList):
            self._processListChild(child, role, inputOutputsFound)
        elif isinstance(child, CCP4File.CDataFile):
            inputOutputsFound.append(child)

    def _processContainerChild(self, child, role, inputOutputsFound):
        if role == 0 and child.objectName() != "outputData":
            self.findInputOutputs(child, role, inputOutputsFound=inputOutputsFound)
        elif role == 1 and child.objectName() == "outputData":
            self.findInputOutputs(child, role, inputOutputsFound=inputOutputsFound)

    def _processListChild(self, child, role, inputOutputsFound):
        for item in child:
            if isinstance(item, CCP4File.CDataFile):
                if len(item.objectName()) == 0:
                    item.setObjectName(child.objectName())
                inputOutputsFound.append(item)
            elif isinstance(item, CCP4Container.CContainer):
                self.findInputOutputs(item, role, inputOutputsFound=inputOutputsFound)
