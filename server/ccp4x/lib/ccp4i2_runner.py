import logging
import contextlib
from xml.etree import ElementTree as ET

from server.ccp4x.db.ccp4i2_django_projects_manager import (
    get_job_plugin,
    save_params_for_job,
)
from ..db import models
from ..db.ccp4i2_django_db_handler import CCP4i2DjangoDbHandler
from ccp4i2.core import CCP4Modules
from PySide2 import QtCore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("root")


def run_job(jobId):
    new_job = models.Job.objects.get(uuid=jobId)
    logger.info(f"Running job in {new_job.directory}")

    with open(new_job.directory / "stdout.txt", "w", encoding="utf-8") as stdout_file:
        with contextlib.redirect_stdout(stdout_file):
            with open(
                new_job.directory / "stderr.txt", "w", encoding="utf-8"
            ) as stderr_file:
                with contextlib.redirect_stderr(stderr_file):
                    dbHandler = setup_db_handler(new_job)
                    application_inst = setupapplication_instance()
                    the_plugin = retrievePlugin(new_job, application_inst, dbHandler)
                    saveParamsForJob(the_plugin, new_job)
                    setupPlugin(the_plugin, new_job, dbHandler, jobId)
                    importFiles(new_job, the_plugin)
                    executePlugin(the_plugin, new_job, application_inst)


def setup_db_handler(new_job):
    dbHandler = CCP4i2DjangoDbHandler()
    dbHandler.projectName = new_job.project.name
    dbHandler.projectId = new_job.project.uuid
    return dbHandler


def setupapplication_instance():
    application_inst = QtCore.QEventLoop(parent=CCP4Modules.QTAPPLICATION())
    logger.info(f"application_inst {str(application_inst)}")
    return application_inst


def retrievePlugin(new_job, application_inst, dbHandler):
    try:
        the_plugin = get_job_plugin(
            new_job, parent=application_inst, dbHandler=dbHandler
        )
        logger.info(f"Retrieved plugin {new_job.task_name}")
        return the_plugin
    except Exception as err:
        logger.exception(f"Err getting job {str(err)}", exc_info=err)
        new_job.fail()
        raise err


def saveParamsForJob(the_plugin, new_job):
    try:
        save_params_for_job(the_plugin, new_job)
    except Exception as err:
        logger.exception(f"Exception setting filenames", exc_info=err)
        new_job.status = 5
        raise err
    logger.info("Retrieved setOutputFileNames")


def setupPlugin(the_plugin, new_job, dbHandler, jobId):
    the_plugin.setDbData(
        handler=dbHandler,
        projectName=new_job.project.name,
        projectId=new_job.project.uuid,
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
            logger.error(f"Exception in writing diagnostics", exc_info=err)

        QtCore.QTimer.singleShot(1, application_inst.quit)
        logger.info("Set singleshot quit timer")

    the_plugin.finished.connect(closeApp)
    new_job.status = models.Jobstatus.objects.get(statustext="Running")
    new_job.save()
    logger.info("Status running set")


def importFiles(new_job, the_plugin):
    try:
        pass
        # PluginUtils.importFiles(new_job, the_plugin)
    except Exception as err:
        logger.exception(f"Failed importing files", exc_info=err)
        new_job.status = 5
        new_job.save()
        raise err
    logger.info("Files imported")


def executePlugin(the_plugin, new_job, application_inst):
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
        logger.exception(f"Failed to execute plugin {new_job.taskname}", exc_info=err)
        new_job.fail()
        # backupProjectDb(new_job.projectid)
        raise err
