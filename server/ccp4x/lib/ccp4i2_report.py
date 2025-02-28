import logging
import pathlib
import xml.etree.ElementTree as ET

from ccp4i2.core import CCP4Modules
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4Data import CList
from ccp4i2.core.CCP4TaskManager import CTaskManager
from ccp4i2.dbapi.CCP4DbApi import FILETYPES_CLASS, FILETYPES_TEXT
from ccp4i2.report.CCP4ReportParser import ReportClass

from ..db.ccp4i2_django_wrapper import using_django_pm
from ..db.models import Job, FileUse, File
from .job_utils.get_job_plugin import get_job_plugin
from ..db.ccp4i2_static_data import PATH_FLAG_JOB_DIR, PATH_FLAG_IMPORT_DIR


logger = logging.getLogger(f"ccp4x:{__name__}")


def simple_failed_report(reason: str, task_name: str):
    return ET.fromstring(
        f"""<html>
           <body>
                Failed making report for task {task_name} due to {reason}
           </body>
        </html>"""
    )


def get_report_job_info(job_id=None):
    job = Job.objects.get(uuid=job_id)
    result = _get_basic_job_info(job)
    result["inputfiles"] = list(_input_files(job))
    result["outputfiles"] = list(_output_files(job))
    result["filenames"] = _get_filenames(job)
    return result


def _get_basic_job_info(job: Job):
    result = {
        "status": Job.Status(job.status).label,
        "taskname": job.task_name,
        "taskversion": "1.0",
        "jobnumber": job.number,
        "projectid": str(job.project.uuid),
        "jobtitle": job.title,
        "creationtime": job.creation_time.timestamp(),
        "projectname": job.project.name,
        "fileroot": str(job.directory) + "/",
        "tasktitle": job.task_name,
        "jobid": str(job.uuid),
    }
    if job.finish_time is not None:
        result["finishtime"] = job.finish_time.timestamp()
    return result


def _input_files(job: Job):
    for file_use in FileUse.objects.filter(job=job):
        path_flag = file_use.file.directory
        input_file = {
            "filetypeid": FILETYPES_TEXT.index(file_use.file.type.name),
            "filename": file_use.file.name,
            "annotation": file_use.file.annotation,
            "jobparamname": file_use.job_param_name,
            "jobid": str(file_use.file.job.uuid),
            "pathflag": file_use.file.directory,
            "filetype": file_use.file.type.name,
            "projectid": str(file_use.file.job.project.uuid),
            "jobnumber": file_use.file.job.number,
            "projectname": file_use.file.job.project.name,
            "filetypeclass": FILETYPES_CLASS[
                FILETYPES_TEXT.index(file_use.file.type.name)
            ],
            "fileId": str(file_use.file.uuid),
        }
        if path_flag == PATH_FLAG_JOB_DIR:
            input_file["relpath"] = str(
                pathlib.Path("CCP4_JOBS")
                / (str(file_use.file.job.directory).split("CCP4_JOBS/")[1])
            )
        elif path_flag == PATH_FLAG_IMPORT_DIR:
            input_file["relpath"] = "CCP4_IMPORTED_FILES"
        else:
            raise ValueError(f"Invalid pathflag value: {path_flag}")
        yield input_file


def _output_files(job: Job):
    for file in File.objects.filter(job=job):
        try:
            output_file = {
                "filetypeid": FILETYPES_TEXT.index(file.type.name),
                "filename": file.name,
                "annotation": file.annotation,
                "jobparamname": file.job_param_name,
                "jobid": str(file.job.uuid),
                "pathflag": file.directory,
                "filetype": file.type.name,
                "projectid": str(file.job.project.uuid),
                "jobnumber": file.job.number,
                "projectname": file.job.project.name,
                "filetypeclass": FILETYPES_CLASS[FILETYPES_TEXT.index(file.type.name)],
                "fileId": str(file.uuid),
            }
        except ValueError as err:
            logger.error("Error in _get_output_files: %s", err)
            continue
        output_file["baseName"] = output_file["filename"]
        output_file["relPath"] = output_file["relpath"] = str(
            pathlib.Path("CCP4_JOBS") / (str(file.job.directory).split("CCP4_JOBS/")[1])
        )
        if output_file["pathflag"] == PATH_FLAG_IMPORT_DIR:
            output_file["relPath"] = "CCP4_IMPORTED_FILES"
        yield output_file


def _get_filenames(job: Job):
    container: CContainer = get_job_plugin(job).container
    result_filenames = _get_input_filenames(container)
    result_filenames.update(_get_output_filenames(container))
    return result_filenames


def _get_input_filenames(container: CContainer):
    return {
        key: _get_filename(container.inputData.find(key))
        for key in container.inputData.dataOrder()
    }


def _get_output_filenames(container: CContainer):
    result_filenames = {}
    if "outputData" in container.dataOrder():
        for key in container.outputData.dataOrder():
            result_filenames[key] = _get_filename(container.outputData.find(key))
    return result_filenames


def _get_filename(data):
    if isinstance(data, CList):
        return [_path_if_exists(str(item)) for item in data]
    return _path_if_exists(str(data))


def _path_if_exists(path_str: str):
    if pathlib.Path(path_str).exists():
        return path_str
    return ""


@using_django_pm
def make_old_report(job: Job):
    """
    Generates a report for a given job using the old reporting system.
    Args:
        job (Job): The job object containing information about the task.
    Returns:
        xml.etree.ElementTree.Element: The generated report as an XML element tree.
        If the report class or required XML files are not found, returns a simple failed report.
    Raises:
        ET.ParseError: If there is an error parsing the XML file.
    Notes:
        - The function attempts to locate the XML file in the job's directory.
        - If the XML file is not found, it checks for a watched file specified in the task manager.
        - The report is generated using the report class obtained from the task manager.
    """

    task_manager: CTaskManager = CCP4Modules.TASKMANAGER()
    report_class = task_manager.getReportClass(name=job.task_name)
    if report_class is None:
        logger.error("Failed to find report class for task %s", job.task_name)
        return simple_failed_report(
            "Failed to find report class for task", job.task_name
        )
    watch_file = task_manager.getReportAttribute(job.task_name, "WATCHED_FILE")
    report_job_info = get_report_job_info(job.uuid)
    logger.debug(str(report_job_info))

    xml_path = pathlib.Path(job.directory) / "program.xml"
    if not xml_path.exists():
        xml_path = pathlib.Path(job.directory) / "XMLOUT.xml"
        if not xml_path.exists():
            xml_path = pathlib.Path(job.directory) / "i2.xml"
            if not xml_path.exists():
                if watch_file is None:
                    return simple_failed_report(
                        "No programXML found", Job.Status(job.status).label
                    )
                watched_path = pathlib.Path(job.directory) / pathlib.Path(watch_file)
                logger.info("watchFile is %s", watched_path)
                if watched_path.exists():
                    xml_path = None
                else:
                    return simple_failed_report(
                        "No programXML found", Job.Status(job.status).label
                    )

    output_xml = ET.parse(xml_path) if xml_path else None

    status = Job.Status(job.status).label
    report: ReportClass = report_class(
        xmlnode=output_xml,
        jobInfo=report_job_info,
        standardise=(
            status
            not in ["Running", "Running remotely", "Pending", "Unknown", "Queued"]
        ),
        jobStatus=status,
        jobNumber=job.number,
        xrtnode=None,
    )
    report_etree = report.as_data_etree()
    return report_etree
