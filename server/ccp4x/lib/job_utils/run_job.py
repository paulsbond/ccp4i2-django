import logging
import contextlib
from xml.etree import ElementTree as ET

from ccp4i2.core import CCP4Modules
from ccp4i2.core import CCP4PluginScript
from PySide2 import QtCore

from ...db import models
from ...db.ccp4i2_django_db_handler import CCP4i2DjangoDbHandler
from .import_files import import_files
from .get_job_plugin import get_job_plugin
from .save_params_for_job import save_params_for_job
from .set_output_file_names import set_output_file_names


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(f"ccp4x:{__name__}")


def run_job(jobId: str):
    """
    Executes a job based on the provided job ID.

    This function retrieves the job from the database using the job ID, sets up the necessary
    environment, and executes the job while redirecting stdout and stderr to respective files
    in the job's directory.

    Args:
        jobId (str): The unique identifier of the job to be executed.

    Raises:
        models.Job.DoesNotExist: If no job with the given jobId is found in the database.
        Exception: If any error occurs during the execution of the job.

    Side Effects:
        - Creates or overwrites "stdout.txt" and "stderr.txt" in the job's directory.
        - Executes the job's plugin and handles database interactions.

    """
    new_job = models.Job.objects.get(uuid=jobId)
    logger.info(f"Running job in {new_job.directory}")

    with open(new_job.directory / "stdout.txt", "w", encoding="utf-8") as stdout_file:
        with contextlib.redirect_stdout(stdout_file):
            with open(
                new_job.directory / "stderr.txt", "w", encoding="utf-8"
            ) as stderr_file:
                with contextlib.redirect_stderr(stderr_file):
                    db_handler = setup_db_handler(new_job)
                    application_inst = setup_application_instance()
                    the_plugin = retrievePlugin(new_job, application_inst, db_handler)

                    _save_params_for_job(the_plugin, new_job)
                    setup_plugin(
                        the_plugin, new_job, db_handler, jobId, application_inst
                    )
                    set_output_file_names(
                        the_plugin.container,
                        projectId=str(new_job.project.uuid),
                        jobNumber=new_job.number,
                        force=True,
                    )
                    _import_files(new_job, the_plugin)
                    executePlugin(the_plugin, new_job, application_inst)


def setup_db_handler(new_job: models.Job):
    db_handler = CCP4i2DjangoDbHandler()
    db_handler.projectName = new_job.project.name
    db_handler.projectId = str(new_job.project.uuid)
    return db_handler


def setup_application_instance():
    application_inst = QtCore.QEventLoop(parent=CCP4Modules.QTAPPLICATION())
    logger.info(f"application_inst {str(application_inst)}")
    return application_inst


def retrievePlugin(
    new_job: models.Job,
    application_inst: QtCore.QEventLoop,
    dbHandler: CCP4i2DjangoDbHandler,
):
    try:
        the_plugin = get_job_plugin(
            new_job, parent=application_inst, dbHandler=dbHandler
        )
        logger.info(f"Retrieved plugin {new_job.task_name}")
        return the_plugin
    except Exception as err:
        logger.exception(f"Err getting job {str(err)}", exc_info=err)
        new_job.status = 5
        new_job.save()
        raise err


def _save_params_for_job(
    the_plugin: CCP4PluginScript.CPluginScript, new_job: models.Job
):
    try:
        save_params_for_job(the_plugin, new_job)
    except Exception as err:
        logger.exception("Exception setting filenames", exc_info=err)
        new_job.status = 5
        raise err
    logger.info("Retrieved setOutputFileNames")


def setup_plugin(
    the_plugin: CCP4PluginScript.CPluginScript,
    new_job: models.Job,
    dbHandler: CCP4i2DjangoDbHandler,
    jobId: str,
    application_inst: QtCore.QEventLoop,
):
    the_plugin.setDbData(
        handler=dbHandler,
        projectName=new_job.project.name,
        projectId=str(new_job.project.uuid),
        jobNumber=new_job.number,
        jobId=jobId,
    )
    logger.info("Set DbData")

    @QtCore.Slot(dict)
    def closeApp(completionStatus):
        logger.info("Received closeApp - %s" % completionStatus)
        try:
            with open(
                new_job.directory / "diagnostic.xml",
                "wb",
            ) as diagnosticXML:
                error_report = the_plugin.errorReport.getEtree()
                ET.indent(error_report, space="\t", level=0)
                diagnosticXML.write(ET.tostring(error_report, encoding="utf-8"))
        except Exception as err:
            logger.exception("Exception in writing diagnostics", exc_info=err)

        QtCore.QTimer.singleShot(1, application_inst.quit)
        logger.info("Set singleshot quit timer")

    the_plugin.finished.connect(closeApp)
    new_job.status = 3  # Running
    new_job.save()
    logger.info("Status running set")


def _import_files(new_job: models.Job, the_plugin: CCP4PluginScript.CPluginScript):
    try:
        import_files(new_job, the_plugin)
    except Exception as err:
        logger.exception("Failed importing files", exc_info=err)
        new_job.status = 5
        new_job.save()
        raise err
    logger.info("Files imported")


def executePlugin(
    the_plugin: CCP4PluginScript.CPluginScript,
    new_job: models.Job,
    application_inst: QtCore.QEventLoop,
):
    try:
        rv = the_plugin.process()
    except Exception as err:
        logger.exception(f"Failed to execute plugin {new_job.task_name}", exc_info=err)
        new_job.status = 5
        new_job.save()
        raise err
    logger.warning(f"Result from the_plugin.process is {str(rv)}")

    try:
        result = application_inst.exec_()
        logger.info(f"Returned from exec_ with result {result}")
        return result
    except Exception as err:
        logger.exception(f"Failed to execute plugin {new_job.task_name}", exc_info=err)
        new_job.status = 5
        new_job.save()
        # backupProjectDb(new_job.projectid)
        raise err
