import logging
import pathlib
import sys
from xml.etree import ElementTree as ET

from ccp4i2.pimple import MGQTmatplotlib

sys.path.append(str(pathlib.Path(MGQTmatplotlib.__file__).parent.parent))

from ccp4i2.report import CCP4RvapiParser
from ccp4i2.core import CCP4Modules
from ccp4i2.core.CCP4TaskManager import CTaskManager
from ccp4i2.report.CCP4ReportParser import ReportClass
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4Data import CList
from ..db.ccp4i2_static_data import FILETYPES_CLASS, FILETYPES_TEXT
from ..db.models import Job, FileUse, File
from ..db.ccp4i2_projects_manager import UsingFakePM

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger("root")


def simple_failed_report(reason: str, task_name: str):
    return ET.fromstring(
        f"""<html>
           <body>
                Failed making report for task {task_name} due to {reason}
           </body>
        </html>"""
    )


def get_job_container(the_job: Job):
    defFile = CTaskManager().lookupDefFile(name=the_job.task_name, version=None)
    # print 'CProjectDirToDb.globJobs defFile',defFile
    container: CContainer = CContainer()
    container.loadContentsFromXml(defFile, guiAdmin=True)
    params_xml_path = pathlib.Path(the_job.directory) / "params.xml"
    input_params_xml_path = pathlib.Path(the_job.directory) / "input_params.xml"
    if params_xml_path.exists():
        container.loadDataFromXml(str(params_xml_path))
    else:
        container.loadDataFromXml(str(input_params_xml_path))
    return container


def get_report_job_info(jobId=None):
    the_job = Job.objects.get(uuid=jobId)
    result = {
        "finishtime": the_job.finish_time.timestamp(),
        "status": Job.Status(the_job.status).label,
        "taskname": the_job.task_name,
        "taskversion": "1.0",
        "jobnumber": the_job.number,
        "projectid": str(the_job.project.uuid),
        "jobtitle": the_job.title,
        "creationtime": the_job.creation_time.timestamp(),
        "projectname": the_job.project.name,
        "fileroot": str(the_job.directory),
        "tasktitle": the_job.task_name,
        "jobid": str(the_job.uuid),
    }

    inputFiles = []
    for fileUse in FileUse.objects.filter(job=the_job):
        inputFile = {
            "filetypeid": FILETYPES_TEXT.index(fileUse.file.type.name),
            "filename": fileUse.file.name,
            "annotation": fileUse.file.annotation,
            "jobparamname": fileUse.job_param_name,
            "jobid": str(fileUse.file.job.uuid),
            "pathflag": fileUse.file.directory,
            "filetype": fileUse.file.type.name,
            "projectid": str(fileUse.file.job.project.uuid),
            "jobnumber": fileUse.file.job.number,
            "projectname": fileUse.file.job.project.name,
            "filetypeclass": FILETYPES_CLASS[
                FILETYPES_TEXT.index(fileUse.file.type.name)
            ],
            "fileId": str(fileUse.file.uuid),
        }
        if inputFile["pathflag"] == 1:
            inputFile["relpath"] = str(
                pathlib.Path("CCP4_JOBS")
                / (str(fileUse.file.job.directory).split("CCP4_JOBS/")[1])
            )
        elif inputFile["pathflag"] == 2:
            inputFile["relpath"] = "CCP4_IMPORTED_FILES"
        else:
            raise Exception(f"pathflag {inputFile}")
        inputFiles.append(inputFile)
    result["inputfiles"] = inputFiles

    outputFiles = []
    for the_file in File.objects.filter(job=the_job):
        outputFile = {
            "filetypeid": FILETYPES_TEXT.index(the_file.type.name),
            "filename": the_file.name,
            "annotation": the_file.annotation,
            "jobparamname": the_file.job_param_name,
            "jobid": str(the_file.job.uuid),
            "pathflag": the_file.directory,
            "filetype": the_file.type.name,
            "projectid": str(the_file.job.project.uuid),
            "jobnumber": the_file.job.number,
            "projectname": the_file.job.project.name,
            "filetypeclass": FILETYPES_CLASS[FILETYPES_TEXT.index(the_file.type.name)],
            "fileId": str(the_file.uuid),
        }
        outputFile["baseName"] = outputFile["filename"]
        outputFile["relPath"] = outputFile["relpath"] = str(
            pathlib.Path("CCP4_JOBS")
            / (str(the_file.job.directory).split("CCP4_JOBS/")[1])
        )
        if outputFile["pathflag"] == 2:
            outputFile["relpath"] = "CCP4_IMPORTED_FILES"
            outputFile["relPath"] = "CCP4_IMPORTED_FILES"
        outputFiles.append(outputFile)

    result["outputfiles"] = outputFiles

    result["filenames"] = {}

    container: CContainer = get_job_container(Job.objects.get(uuid=jobId))
    # Get the data keyed by task parameter name- not necessarilly all files but should all have __str__ methods
    for key in container.inputData.dataOrder():
        if isinstance(container.inputData.find(key), CList):
            result["filenames"][key] = []
            for item in container.inputData.find(key):
                if pathlib.Path(item.__str__()).exists():
                    result["filenames"][key].append(item.__str__())
                else:
                    result["filenames"][key].append("")
        else:
            try:
                item = container.inputData.find(key).__str__()
                if pathlib.Path(item).exists():
                    result["filenames"][key] = item
                else:
                    result["filenames"][key] = ""
            except KeyError as err:
                logging.warning(f"Issue finding inputData item for {key} {err}")
                result["filenames"][key] = ""

    if "outputData" in container.dataOrder():
        for key in container.outputData.dataOrder():
            if isinstance(container.outputData.find(key), CList):
                result["filenames"][key] = []
                for item in container.outputData.find(key):
                    if pathlib.Path(item.__str__()).exists():
                        result["filenames"][key].append(item.__str__())
                    else:
                        result["filenames"][key].append("")
            else:
                try:
                    assert isinstance(container.outputData, CContainer)
                    item = container.outputData.find(key).__str__()
                    if pathlib.Path(item).exists():
                        result["filenames"][key] = item
                    else:
                        result["filenames"][key] = ""
                except:
                    result["filenames"][key] = ""

    return result


@UsingFakePM
def make_old_report(the_job: Job):
    # print(self, 'reportForTask_XML_Status', taskname, outputXml, status, jobId)
    taskManager: CTaskManager = CCP4Modules.TASKMANAGER()
    reportClass = taskManager.getReportClass(name=the_job.task_name)
    if reportClass is None:
        logger.error(f"Failed to find report class for task {the_job.task_name}")
        return simple_failed_report(
            "Failed to find report class for task", the_job.task_name
        )
    watchFile = taskManager.getReportAttribute(the_job.task_name, "WATCHED_FILE")
    reportJobInfo = get_report_job_info(the_job.uuid)
    logger.debug(str(reportJobInfo))

    parser = ET.XMLParser()
    xmlPath = pathlib.Path(the_job.directory) / "program.xml"
    if not xmlPath.exists():
        xmlPath = pathlib.Path(the_job.directory) / "XMLOUT.xml"
        if not xmlPath.exists():
            xmlPath = pathlib.Path(the_job.directory) / "i2.xml"
            parser = CCP4RvapiParser.PARSER()
            if not xmlPath.exists():
                if watchFile is None:
                    return simple_failed_report(
                        "No programXML found", Job.Status(the_job.status).label
                    )
                watchedPath = pathlib.Path(the_job.directory) / pathlib.Path(watchFile)
                logger.warning(f"watchFile is {watchedPath}")
                if watchedPath.exists():
                    xmlPath = None
                else:
                    return simple_failed_report(
                        "No programXML found", Job.Status(the_job.status).label
                    )

    outputXml = None

    if xmlPath is not None:
        outputXml = ET.parse(xmlPath)

    status = Job.Status(the_job.status).label
    report: ReportClass = reportClass(
        xmlnode=outputXml,
        jobInfo=reportJobInfo,
        standardise=(
            status
            not in ["Running", "Running remotely", "Pending", "Unknown", "Queued"]
        ),
        jobStatus=status,
        jobNumber=the_job.number,
        xrtnode=None,
    )
    report_etree = report.as_data_etree()
    return report_etree
