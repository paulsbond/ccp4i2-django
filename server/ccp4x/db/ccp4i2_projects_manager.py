import sys
import os
from pathlib import Path
import json
import uuid
import time
import traceback
import pathlib
import logging
from datetime import datetime
from django.utils.text import slugify
from django.db import IntegrityError

from ccp4i2.pimple import MGQTmatplotlib
from ..lib.job_utils import removeDefaults

sys.path.append(str(pathlib.Path(MGQTmatplotlib.__file__).parent.parent))

from core import CCP4Utils
from core import CCP4File
from core import CCP4Container
from core import CCP4TaskManager
from core import CCP4ErrorHandling
from ccp4i2.dbapi import CCP4DbApi
from core import CCP4ProjectsManager
from core import CCP4Data
from core import CCP4ModelData
from ccp4i2.core import CCP4PerformanceData
from xml.etree import ElementTree as ET
from . import models
from ..lib.utils import uuid_from_no_hyphens

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger("root")

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


class FakeDb(object):
    class FakeSignal:
        def emit(self, *arg, **kwarg):
            logger.info("Ive been asked to emit %s, %s", arg, kwarg)

    def __init__(self):
        self.projectReset = FakeDb.FakeSignal()
        super().__init__()

    def __getattribute__(self, __name):
        logger.debug("Fakedb being interrogated for %s", __name)
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
                if context_job.taskname == "coot_rebuild":
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
                    file = models.Files.objects.get(
                        jobid__projectid=projectId,
                        jobid__jobnumber=jobNumberParam[0],
                        jobparamname=jobNumberParam[1],
                    )
                    file.delete()
                except models.Files.DoesNotExist as err:
                    logger.info(
                        "Err in deleteFilesOnJobNumberAndParamName %s %s",
                        err,
                        jobNumberParam,
                    )
        except Exception as err:
            logger.info("Err in deleteFilesOnJobNumberAndParamName %s", err)
            traceback.print_stack()
        return None

    def getFileInfo(self, fileId=None, mode="all", returnType=None):
        assert fileId is not None
        the_file_qs = models.File.objects.filter(uuid=fileId)

        if isinstance(mode, list):
            arg = [item.lower() for item in mode]
        elif mode.lower() == "all":
            arg = [key for key in job_field_new_to_old.keys()]
        else:
            arg = [mode.lower()]

        # Will need corrected for some cases
        replacements = {}

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
            # logger.info(f'jobId is {jobId}')
            if jobId is None:
                the_job_qs = models.Job.objects.filter(
                    project__name=projectName, number=jobNumber
                )
            else:
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
            print(arg)

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
        except Exception as err:
            logger.error("Err in getJobInfo %s %s %s", err, mode, returnType)
            traceback.print_stack()
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
                roleid = models.Fileroles.objects.get(roleid=role)
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
        try:
            jobjList, xmlText, keyValues = inputOutputFile.saveToDb()
            jobParamName = inputOutputFile.objectName()
        except:
            logger.info(
                "ERROR in gleanJobFiles for %s",
                inputOutputFile.objectName(),
            )
            objList, xmlText, keyValues = [], None, {}
            jobParamName = ""
        for key, value in keyValues.items():
            keyType = models.Keytypes.objects.get(keytypename=key)
            if isinstance(value, str):
                newKeyvalue = models.Jobkeycharvalues(
                    jobid=the_job, keytypeid=keyType, value=value
                )
                newKeyvalue.save()
            else:
                keyType = models.Keytypes.objects.get(keytypename=key)
                newKeyvalue = models.Jobkeyvalues(
                    jobid=the_job, keytypeid=keyType, value=value
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
                    theFile = models.Files.objects.get(
                        fileid=str(inputOutputFile.dbFileId)
                    )
                    self._processExistingFile(theFile, the_job, roleid, jobParamName)
            except models.Fileuses.DoesNotExist as err:
                logger.info(
                    "ObjectDoesNotExist issue gleaning %s - file not found",
                    jobParamName,
                )
            except IntegrityError as err:
                logger.info(
                    "IntegrityError Issue gleaning %s %s %s %s",
                    jobParamName,
                    inputOutputFile.dbFileId,
                    roleid.roleid,
                    theFile.filename,
                )
            if roleid.roleid == CCP4DbApi.FILE_ROLE_OUT:
                self._processOutputFile(inputOutputFile, the_job, roleid, jobParamName)

    def _processExistingFile(self, theFile, the_job, roleid, jobParamName):
        try:
            existingFileUse = models.FileUse.objects.get(
                file=theFile, job=the_job, role=roleid
            )
        except models.FileUse.DoesNotExist:
            newFileUse = models.FileUse(
                file=theFile,
                job=the_job,
                role=roleid,
                jobparamname=jobParamName,
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
                fileTypeId = models.Filetypes.objects.get(filetypename=fileTypeName)
                subType = (
                    int(inputOutputFile.subType) if inputOutputFile.subType else None
                )
                fileContent = (
                    int(inputOutputFile.contentFlag)
                    if inputOutputFile.contentFlag
                    else None
                )
                newFile = models.Files(
                    filename=str(inputOutputFile.baseName),
                    annotation=str(inputOutputFile.annotation),
                    filetypeid=fileTypeId,
                    filesubtype=subType,
                    filecontent=fileContent,
                    jobid=the_job,
                    jobparamname=jobParamName,
                    pathflag=1,
                )
                newFile.save()
                newFileUse = models.Fileuses(
                    fileid=newFile,
                    jobid=the_job,
                    roleid=roleid,
                    jobparamname=jobParamName,
                )
                newFileUse.save()
            except Exception as err:
                logger.info(
                    "Issue saving new file %s - filetype ]%s] not recognised",
                    jobParamName,
                    fileTypeName,
                )

    def findInputOutputs(self, ofContainer, role, inputOutputsFound=[]):
        if isinstance(ofContainer, str):
            logger.info("Cant findInputOutputs of string %s", ofContainer)
            return inputOutputsFound
        else:
            for child in ofContainer.children():
                if isinstance(child, CCP4PerformanceData.CPerformanceIndicator):
                    inputOutputsFound.append(child)
                elif isinstance(child, CCP4Container.CContainer):
                    if (
                        role == CCP4DbApi.FILE_ROLE_IN
                        and child.objectName() != "outputData"
                    ):
                        self.findInputOutputs(
                            child, role, inputOutputsFound=inputOutputsFound
                        )
                    elif (
                        role == CCP4DbApi.FILE_ROLE_OUT
                        and child.objectName() == "outputData"
                    ):
                        self.findInputOutputs(
                            child, role, inputOutputsFound=inputOutputsFound
                        )
                elif isinstance(child, CCP4Data.CList):
                    for item in child:
                        if isinstance(item, CCP4File.CDataFile):
                            if len(item.objectName()) == 0:
                                item.setObjectName(child.objectName())
                            inputOutputsFound.append(item)
                        elif isinstance(item, CCP4Container.CContainer):
                            self.findInputOutputs(
                                item, role, inputOutputsFound=inputOutputsFound
                            )
                elif isinstance(child, CCP4File.CDataFile):
                    inputOutputsFound.append(child)
            return inputOutputsFound


class FakeProjectsManager(object):

    def __init__(self):
        logger.info("FakePM Init in")
        self._db = FakeDb()
        logger.info("FakePM Init out")
        super().__init__()

    def db(self):
        return self._db

    def __getattribute__(self, __name):
        logger.info("FakeProjectsManager being interrogated for %s", __name)
        return super().__getattribute__(__name)

    def setOutputFileNames(
        self, container=None, projectId=None, jobNumber=None, force=True
    ):
        myErrorReport = CCP4ErrorHandling.CErrorReport()
        relPath = os.path.sep.join(
            ["CCP4_JOBS"]
            + [f"job_{numberElement}" for numberElement in jobNumber.split(".")]
        )
        the_job = models.Jobs.objects.get(
            projectid__projectid=projectId, jobnumber=jobNumber
        )
        jobName = f"{jobNumber}_{slugify(the_job.uuid.name)}_{the_job.taskname}_"
        dataList = container.outputData.dataOrder()
        for objectName in dataList:
            try:
                dobj = container.outputData.find(objectName)
                # print 'setOutputData get',objectName,dobj.get(),dobj.isSet()
                if isinstance(dobj, CCP4File.CDataFile) and (force or not dobj.isSet()):
                    dobj.setOutputPath(
                        jobName=jobName, projectId=projectId, relPath=relPath
                    )
                if isinstance(dobj, CCP4ModelData.CPdbDataFile):
                    oldBaseName, oldExt = os.path.splitext(str(dobj.baseName))
                    if dobj.contentFlag is None or int(dobj.contentFlag) == 1:
                        dobj.baseName.set(f"{oldBaseName}.pdb")
                    if int(dobj.contentFlag) == 2:
                        dobj.baseName.set(f"{oldBaseName}.cif")

            except Exception as err:
                logger.info(
                    "Exception in setOutputFileNames for %s %s",
                    dobj.objectPath(),
                    str(err),
                )
        return myErrorReport

    def interpretDirectory(self, path):
        absPath = os.path.abspath(path)
        logger.info("absPath %s", absPath)
        theProject = None
        for project in models.Project.objects.all():
            # print(project.name, '{}/'.format(project.directory))
            if absPath.startswith("{}/".format(project.directory)):
                theProject = project
                break
        if theProject is not None:
            # projectName, relPath, projectId
            return (
                theProject.name,
                absPath[len(theProject.directory) + 1 :],
                theProject.uuid,
            )
        else:
            return [None, None, None]

    def getProjectDirectory(self, projectName=None, testAlias=True, projectId=None):
        logger.info(
            "*****In FakeGetProjectDirectory %s, %s, %s",
            projectName,
            testAlias,
            projectId,
        )
        if projectId is not None:
            # Baffling edge case
            if testAlias and projectId == "CCP4I2_TOP":
                return os.environ["CCP4I2_TOP"]
            try:
                if "-" not in projectId:
                    projectId = uuid_from_no_hyphens(projectId)
                theProject = models.Project.objects.get(uuid=projectId)
            except models.Project.DoesNotExist as err:
                logger.info(
                    "In getProjectDirectory for non existent projectId %s", projectId
                )
                return None
        else:
            try:
                theProject = models.Project.objects.get(name=projectName)
            except models.Project.DoesNotExist as err:
                logger.info(
                    "In getProjectDirectory for non existent projectName %s",
                    projectName,
                )
                return None
        return theProject.directory

    def jobDirectory(self, jobId=None, projectName=None, jobNumber=None):
        assert jobId is not None or (projectName is not None and jobNumber is not None)
        # logger.info('in FPM %s, %s, %s', jobId, projectName, jobNumber)
        if jobId is not None:
            return models.Jobs.objects.get(jobid=jobId).jobDirectory
        else:
            return models.Jobs.objects.get(
                projectid__projectname=projectName, jobnumber=jobNumber
            ).jobDirectory

    def makeFileName(self, jobId=None, mode="PROGRAMXML"):
        the_job = models.Job.objects.get(uuid=jobId)
        defNames = {
            "ROOT": "",
            "PARAMS": "params.xml",
            "JOB_INPUT": "input_params.xml",
            "PROGRAMXML": "program.xml",
            "LOG": "log.txt",
            "STDOUT": "stdout.txt",
            "STDERR": "stderr.txt",
            "INTERRUPT": "interrupt_status.xml",
            "DIAGNOSTIC": "diagnostic.xml",
            "REPORT": "report.html",
            "DIAGNOSTIC_REPORT": "diagnostic_report.html",
            "TABLE_RTF": "tables.rtf",
            "TABLES_DIR": "tables_as_csv_files",
            "XML_TABLES_DIR": "tables_as_xml_files",
            "COM": "com.txt",
            "MGPICDEF": "report.mgpic.py",
            "PIC": "report.png",
            "RVAPIXML": "i2.xml",
        }
        jobPath = Path(the_job.directory) / defNames[mode]
        return str(jobPath)


# Decoorator to install and use FakeProjectManager


def UsingFakePM(func):
    def wrapper(*args, **kwargs):
        logger.info("Something is happening before the function is called.")
        oldPM = CCP4ProjectsManager.CProjectsManager.insts
        try:
            CCP4ProjectsManager.CProjectsManager.insts = FakeProjectsManager()
            result = func(*args, **kwargs)
        except Exception as err:
            logging.error("Encountered issue while in FakePM decorator %s", err)
            traceback.print_exc()
        finally:
            CCP4ProjectsManager.CProjectsManager.insts = oldPM
            logger.info("Something is happening after the function is called.")
        return result

    return wrapper


def modelValues(objectType="", predicate={}, order_byArray=[], valuesArray=[]):
    try:
        ModelClass = getattr(models, objectType)
        querySet = ModelClass.objects.all()
        if len(predicate.items()) > 0:
            for key in predicate:
                if key.endswith("isnull"):
                    logger.info("%s %s", key, predicate[key])
                    if "true" in predicate[key].lower():
                        predicate[key] = True
                    elif "false" in predicate[key].lower():
                        predicate[key] = False
                logger.info("%s", predicate)
            querySet = querySet.filter(**predicate)
        if len(order_byArray) > 0:
            querySet = querySet.order_by(*order_byArray)
        # logger.info(model, filter_dict, valuesArray, order_byArray)
        valuesQuerySet = querySet.values(*valuesArray)
        status = "Success"
        exception = ""
    except Exception as err:
        exception = str(err)
        valuesQuerySet = []
        status = "Failure"
    return {"results": list(valuesQuerySet), "status": status, "Exception": exception}


def makeTerminateFile(queryDict):
    the_job = models.Jobs.objects.get(jobid=queryDict["jobId"])
    terminateFilePath = os.path.join(the_job.jobDirectory, "TERMINATE")
    with open(terminateFilePath, "w") as terminateFile:
        terminateFile.write("TERMINATE")
    return json.dumps({"status": "Success"}), "application/json"


def getJobFile(
    jobId=None, projectId=None, projectName=None, jobNumber=None, fileName=None
):
    if jobId is not None:
        the_job = models.Jobs.objects.get(jobid=jobId)
    elif jobNumber is None or (projectId is None or projectName is None):
        raise Exception("need jobId or (jobNumber and (projectId or projectName))")
    elif projectId is None:
        the_job = models.Jobs.objects.get(projectname=projectName, jobnumber=jobNumber)
    else:
        the_job = models.Jobs.objects.get(projectname=projectName, jobnumber=jobNumber)

    filePath = os.path.join(the_job.jobDirectory, fileName)
    with open(filePath, "r") as f:
        d = f.read()
    return d


def getFileWithPredicate(predicate):
    theFile = models.Files.objects.get(**predicate)
    filePath = theFile.filePath
    with open(filePath, "rb") as f:
        d = f.read()
    return d, filePath, theFile.filetypeid.filetypename


def getProjectFileData(projectId, relPath, baseName):
    from urllib.parse import unquote

    relPath = unquote(relPath)
    filePath = os.path.join(
        models.Projects.objects.get(projectid=projectId).directory,
        relPath,
        baseName,
    )
    with open(filePath, "rb") as f:
        d = f.read()
    return d, filePath


def jobForPredicate(jobId=None, projectId=None, projectName=None, jobNumber=None):
    logger.info("%s, %s, %s, %s", jobId, projectId, projectName, jobNumber)
    if jobId is None:
        if projectId is not None:
            jobs = models.Jobs.objects.filter(projectid__projectid=projectId)
        else:
            jobs = models.Jobs.objects.filter(projectid__projectname=projectName)
        the_job = jobs.get(jobnumber=str(jobNumber))
    else:
        the_job = models.Jobs.objects.get(jobid=jobId)
    return theJob


@UsingFakePM
def uploadFileToJob(fileRoot="output", jobId=None, fileExtension=".txt", file=b""):
    the_job = models.Jobs.objects.get(jobid=jobId)
    baseName = f"{fileRoot}{fileExtension}"
    filePath = os.path.join(the_job.jobDirectory, baseName)
    iFile = 0
    while os.path.exists(filePath):
        baseName = f"{fileRoot}_{iFile}{fileExtension}"
        filePath = os.path.join(the_job.jobDirectory, baseName)
        iFile += 1
    with open(filePath, "wb") as outputFile:
        outputFile.write(file)
    relPath = os.path.join(
        "CCP4_JOBS", "/".join([f"job_{jN}" for jN in the_job.jobnumber.split(".")])
    )
    return {
        "project": the_job.uuid.uuid,
        "relPath": relPath,
        "baseName": baseName,
    }


@UsingFakePM
def uploadFileForJobObject(
    jobId=None,
    projectId=None,
    projectName=None,
    jobNumber=None,
    objectPath=None,
    fileName=None,
    file=b"",
):
    if jobId is None and (
        (projectId is None and projectName is None) or jobNumber is None
    ):
        raise Exception("Unable to infer job in uploadFileForJobObject")
    if fileName is None:
        raise Exception("No fileName given for uploadFileForJobObject")
    the_job = jobForPredicate(
        jobId=jobId, projectId=projectId, projectName=projectName, jobNumber=jobNumber
    )

    fileRoot, fileExtension = os.path.splitext(fileName)
    uploadResult = uploadFileToJob(fileRoot, the_job.jobid, fileExtension, file)
    valueXMLText = f"""<{objectPath.split('.')[-1]}>
        <project>{uploadResult['project']}</project>
        <relPath>{uploadResult['relPath']}</relPath>
        <baseName>{uploadResult['baseName']}</baseName>
        <annotation>Imported from upload of {fileName}</annotation>
    </{objectPath.split('.')[-1]}>"""
    setJobParameterByXML(jobId, objectPath, valueXMLText)
    the_job_plugin = getJobPlugin(the_job)
    objectElement = the_job_plugin.container.locateElement(objectPath)
    # Here validate the file by attempting to load it and apply setContentFlag
    objectElement.loadFile()
    objectElement.setContentFlag()
    saveParamsForJob(the_job_plugin=the_job_plugin, theJob=the_job)
    return ET.tostring(objectElement.getEtree()).decode("utf-8")


def getProjectDirectory(projectId=None, projectName=None, jobId=None):
    if projectId is not None:
        return models.Projects.objects.get(projectid=projectId).directory
    elif projectName is not None:
        return models.Projects.objects.get(projectname=projectName).directory
    elif jobId is not None:
        return models.Jobs.objects.get(jobid=jobId).uuid.directory
    return None


def getproject_jobFileName(
    projectId=None, fileName=None, jobNumber="1", subJobNumber=""
):
    # MN: This is mostly deeply flawed logic, and not at all how job numbers should work ! Copied from CDbApi and rescued for
    # "." in jobNumber
    if subJobNumber != "":
        fname = os.path.join(
            getProjectDirectory(projectId=projectId),
            "CCP4_JOBS",
            "job_" + jobNumber,
            "job_" + subJobNumber,
            fileName,
        )
    else:
        if "." in jobNumber:
            jobNumberPathElements = [f"job_{number}" for number in jobNumber.split(".")]
            fname = os.path.join(
                getProjectDirectory(projectId=projectId),
                "CCP4_JOBS",
                *jobNumberPathElements,
                fileName,
            )
        else:
            fname = os.path.join(
                getProjectDirectory(projectId=projectId),
                "CCP4_JOBS",
                "job_" + jobNumber,
                fileName,
            )
    return fname


@UsingFakePM
def getproject_jobFile(
    projectId=None, projectName=None, fileName=None, jobNumber="1", subJobNumber=""
):
    if projectId is None:
        if projectName is not None:
            projectId = models.Projects.objects.get(projectname=projectName).uuid
    fname = getproject_jobFileName(projectId, fileName, jobNumber, subJobNumber)
    d = fname
    if fname.endswith(".png"):
        with open(fname, "rb") as f:
            d = f.read()
    else:
        with open(fname, "rb") as f:
            d = f.read()
    return d


@UsingFakePM
def cloneJob(jobId=None):
    oldJob = models.Jobs.objects.get(jobid=jobId)
    theProject = oldJob.uuid

    taskName = oldJob.taskname

    try:
        lastJobNumber = max(
            [
                int(job.jobnumber)
                for job in models.Jobs.objects.filter(projectid=theProject).filter(
                    parentjobid__isnull=True
                )
            ]
        )
    except ValueError:
        lastJobNumber = 0

    nextJobNumber = str(lastJobNumber + 1)

    try:
        preceedingJobId = models.Jobs.objects.get(
            projectid=theProject, jobnumber=str(lastJobNumber)
        )
    except models.Jobs.DoesNotExist as err:
        preceedingJobId = None

    newJobDir = (
        Path(theProject.directory) / "CCP4_JOBS" / "job_{}".format(nextJobNumber)
    )
    newJobId = uuid.uuid1().hex
    logger.info("newJobDir %s, newJobId %s", newJobDir, newJobId)
    from core import CCP4TaskManager

    taskManager = CCP4TaskManager.CTaskManager()
    pluginClass = taskManager.getPluginScriptClass(taskName)
    newJobDir.mkdir(exist_ok=True, parents=True)
    the_job_plugin = pluginClass(workDirectory=str(newJobDir))
    logger.info("the_job_plugin %s", the_job_plugin)

    # Load cloned parameters
    the_job_plugin.container.loadDataFromXml(
        str(Path(oldJob.jobDirectory) / "input_params.xml")
    )

    try:
        dataList = the_job_plugin.container.outputData.dataOrder()
        for objectName in dataList:
            dobj = the_job_plugin.container.outputData.find(objectName)
            if isinstance(dobj, CCP4File.CDataFile):
                dobj.unSet()
    except Exception as err:
        raise (err)

    newJob = models.Jobs(
        jobid=newJobId,
        jobnumber=str(nextJobNumber),
        finishtime=0.0,
        status=models.Jobstatus.objects.get(statustext="Pending"),
        evaluation=None,
        useragent=models.Useragents.objects.all()[0],
        jobtitle=taskManager.getTitle(taskName),
        projectid=theProject,
        taskname=taskName,
        taskversion=None,
        parentjobid=None,
        preceedingjobid=preceedingJobId,
        treeleft=None,
        treeright=None,
        userid=theProject.userid,
    )

    removeDefaults(the_job_plugin.container)
    saveParamsForJob(the_job_plugin, newJob)

    newJob.save()

    theProject.lastaccess = time.time()
    theProject.lastjobnumber = newJob.jobnumber
    theProject.save()

    return newJob.jobid, newJob.jobnumber, theProject.uuid, None


@UsingFakePM
def updateJobStatus(jobId=None, statusId=None):
    the_job = models.Jobs.objects.get(jobid=jobId)
    theStatus = models.Jobstatus.objects.get(statusid=statusId)
    the_job.status = theStatus
    the_job.save()
    return the_job.jobid, the_job.uuid.uuid, theStatus.statustext


@UsingFakePM
def createJob(
    projectId=None,
    projectName=None,
    parentJobId=None,
    taskName=None,
    jobNumber=None,
    jobId=None,
    saveParams=True,
):
    logger.info("%s, %s", projectName, projectId)
    if parentJobId is not None and projectId is None:
        parentJob = models.Jobs.objects.get(jobid=parentJobId)
        theProject = parentJob.uuid
    elif projectId is None and projectName is not None:
        parentJob = None
        theProject = models.Projects.objects.get(projectname=projectName)
        projectId = theProject.uuid
    else:
        parentJob = None
        theProject = models.Projects.objects.get(projectid=projectId)

    if jobNumber is None:
        project_jobs = models.Jobs.objects.filter(
            projectid__projectid=projectId
        ).filter(parentjobid__isnull=True)
        if len(project_jobs) == 0:
            lastJobNumber = 0
        else:
            lastJobNumber = sorted([int(a.jobnumber) for a in project_jobs])[-1]
        lastJobNumber = str(lastJobNumber)
    else:
        jobNumberElements = jobNumber.split(".")
        jobNumberElements[-1] = str(int(jobNumberElements[-1]) - 1)
        lastJobNumber = ".".join(jobNumberElements)

    jobNumberElements = lastJobNumber.split(".")
    jobNumberElements[-1] = str(int(jobNumberElements[-1]) + 1)
    nextJobNumber = ".".join(jobNumberElements)

    preceedingJobId = None
    try:
        preceedingJobId = models.Jobs.objects.get(
            projectid__projectid=projectId, jobnumber=str(lastJobNumber)
        )
    except models.Jobs.DoesNotExist as err:
        preceedingJobId = None

    pathElements = [theProject.directory, "CCP4_JOBS"] + [
        "job_{}".format(jNo) for jNo in jobNumberElements
    ]
    newJobString = os.path.join(*pathElements)
    newJobDir = Path(newJobString)

    if jobId is None:
        newJobId = uuid.uuid1().hex
    else:
        newJobId = jobId

    taskManager = CCP4TaskManager.CTaskManager()
    pluginClass = taskManager.getPluginScriptClass(taskName)
    if saveParams:
        newJobDir.mkdir(exist_ok=True, parents=True)
    the_job_plugin = pluginClass(workDirectory=str(newJobDir))

    argDict = dict(
        jobid=newJobId,
        jobnumber=str(nextJobNumber),
        creationtime=time.time(),
        finishtime=0.0,
        status=models.Jobstatus.objects.get(statustext="Pending"),
        evaluation=None,
        useragent=models.Useragents.objects.all()[0],
        jobtitle=taskManager.getTitle(taskName),
        projectid=theProject,
        taskname=taskName,
        taskversion=None,
        parentjobid=parentJob,
        preceedingjobid=preceedingJobId,
        treeleft=None,
        treeright=None,
        userid=theProject.userid,
    )
    logger.info("argDict %s", argDict)
    newJob = models.Jobs(**argDict)

    if saveParams:
        removeDefaults(the_job_plugin.container)
        saveParamsForJob(the_job_plugin, newJob)
    newJob.save()

    return newJob.jobid, newJob.jobnumber, theProject.uuid, parentJobId


@UsingFakePM
def getJobPlugin(the_job, parent=None, dbHandler=None):
    taskManager = CCP4TaskManager.CTaskManager()

    pluginClass = taskManager.getPluginScriptClass(the_job.taskname)
    try:
        pluginInstance = pluginClass(
            workDirectory=the_job.jobDirectory, parent=parent, dbHandler=dbHandler
        )
    except Exception as err:
        traceback.print_exc()

    defFile = os.path.join(the_job.jobDirectory, "params.xml")
    if not os.path.exists(defFile):
        # logger.info('No params.xml at %s', defFile)
        defFile1 = os.path.join(the_job.jobDirectory, "input_params.xml")
        if not os.path.exists(defFile1):
            # logger.info('No params.xml at %s', defFile1)
            raise Exception("no defFile found")
        defFile = defFile1
    pluginInstance.container.loadDataFromXml(defFile, check=False, loadHeader=False)
    return pluginInstance


@UsingFakePM
def saveParamsForJob(the_job_plugin, the_job, mode="JOB_INPUT", excludeUnset=True):
    # logger.info('into saveParams for %s excludeUnset: %s', the_job.jobnumber, excludeUnset)
    # sys.stdout.flush()
    fileName = the_job_plugin.makeFileName(mode)
    # logger.info('saveParams in %s', fileName)
    # sys.stdout.flush()
    if os.path.exists(fileName):
        backup = CCP4Utils.backupFile(fileName, delete=False)
    if the_job_plugin.container.header is None:
        the_job_plugin.container.addHeader()
    the_job_plugin.container.header.name.set(the_job.uuid.name)
    the_job_plugin.container.header.uuid.set(the_job.uuid.uuid)
    the_job_plugin.container.header.jobNumber.set(the_job.jobnumber)
    the_job_plugin.container.header.jobId.set(the_job.jobid)
    f = CCP4File.CI2XmlDataFile(fullPath=fileName)
    f.header.set(the_job_plugin.container.header)
    f.header.function.set("PARAMS")
    f.header.setCurrent()
    bodyEtree = the_job_plugin.container.getEtree(excludeUnset=excludeUnset)
    ET.indent(bodyEtree)
    f.saveFile(bodyEtree=bodyEtree)
    # logger.info('out of saveParams for %s excludeUnset: %s', the_job.jobnumber, excludeUnset)
    # sys.stdout.flush()

    return


@UsingFakePM
def getJobContainer(the_job):
    defFile = CCP4TaskManager.CTaskManager().lookupDefFile(
        name=the_job.taskname, version=None
    )
    # print 'CProjectDirToDb.globJobs defFile',defFile
    container = CCP4Container.CContainer()
    container.loadContentsFromXml(defFile, guiAdmin=True)
    if os.path.exists(os.path.join(the_job.jobDirectory, "params.xml")):
        container.loadDataFromXml(os.path.join(the_job.jobDirectory, "params.xml"))
    else:
        container.loadDataFromXml(
            os.path.join(the_job.jobDirectory, "input_params.xml")
        )
    return container


@UsingFakePM
def setJobParameterByXML(jobId, objectPath, valueXMLText):
    newValueEtree = ET.fromstring(valueXMLText)
    the_job = models.Jobs.objects.get(jobid=jobId)
    the_job_plugin = getJobPlugin(the_job)
    objectElement = the_job_plugin.container.locateElement(objectPath)
    objectElement.unSet()
    objectElement.setEtree(newValueEtree)
    saveParamsForJob(the_job_plugin=the_job_plugin, theJob=the_job)
    return ET.tostring(objectElement.getEtree()).decode("utf-8")
