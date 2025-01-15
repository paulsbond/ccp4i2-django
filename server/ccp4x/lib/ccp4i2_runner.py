import logging
import contextlib
from xml.etree import ElementTree as ET

from server.ccp4x.db.ccp4i2_django_projects_manager import (
    get_job_plugin,
    save_params_for_job,
)
from ..db import models
from ..db.ccp4i2_django_db_handler import ccp4i2_django_db_handler
from ccp4i2.core import CCP4Modules
from PySide2 import QtCore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("root")


def runJob(jobId):
    newJob = models.Job.objects.get(uuid=jobId)
    logger.info(f"Running job in {newJob.directory}")

    with open(newJob.directory / "stdout.txt", "w", encoding="utf-8") as stdoutFile:
        with contextlib.redirect_stdout(stdoutFile):
            with open(
                newJob.directory / "stderr.txt", "w", encoding="utf-8"
            ) as stderrFile:
                with contextlib.redirect_stderr(stderrFile):
                    dbHandler = ccp4i2_django_db_handler()
                    dbHandler.projectName = newJob.project.name
                    dbHandler.projectId = newJob.project.uuid

                    applicationInst = QtCore.QEventLoop(
                        parent=CCP4Modules.QTAPPLICATION()
                    )
                    logger.info(f"applicationInst {str(applicationInst)}")

                    try:
                        thePlugin = get_job_plugin(
                            newJob, parent=applicationInst, dbHandler=dbHandler
                        )
                        logger.info(f"Retrieved plugin {newJob.task_name}")
                    except Exception as err:
                        logger.exception(f"Err getting job {str(err)}", exc_info=err)
                        newJob.fail()
                        # PluginUtils.backupProjectDb(newJob.projectid)
                        raise err

                    try:
                        # CCP4Modules.PROJECTSMANAGER().setOutputFileNames(
                        #    projectId=newJob.projectid.projectid,
                        #    container=thePlugin.container,
                        #    force=True,
                        #    jobNumber=newJob.jobnumber,
                        # )
                        save_params_for_job(thePlugin, newJob)
                    except Exception as err:
                        logger.exception(f"Exception setting filenames", exc_info=err)
                        newJob.status = 5
                        # PluginUtils.backupProjectDb(newJob.projectid)
                        raise err

                    logger.info("Retrieved setOutputFileNames")

                    # thePlugin.jobId = newJob.jobid
                    applicationInst.pluginName = newJob.task_name

                    @QtCore.Slot(dict)
                    def closeApp(completionStatus):
                        logger.info("Received closeApp - %s" % completionStatus)
                        try:
                            with open(
                                newJob.directory / "diagnostic.xml",
                                "wb",
                            ) as diagnosticXML:
                                error_report = thePlugin.errorReport.getEtree()
                                ET.indent(error_report, space="\t", level=0)
                                diagnosticXML.write(
                                    ET.tostring(error_report, encoding="utf-8")
                                )
                        except Exception as err:
                            logger.error(
                                f"Exception in writing diagnostics", exc_info=err
                            )

                        QtCore.QTimer.singleShot(1, applicationInst.quit)
                        logger.info("Set singleshot quit timer")

                    thePlugin.setDbData(
                        handler=dbHandler,
                        projectName=newJob.project.name,
                        projectId=newJob.project.uuid,
                        jobNumber=newJob.number,
                        jobId=jobId,
                    )

                    logger.info("Set DbData")

                    try:
                        PluginUtils.importFiles(newJob, thePlugin)
                    except Exception as err:
                        logger.exception(f"Failed importing files", exc_info=err)
                        newJob.status = 5
                        newJob.save()
                        # PluginUtils.backupProjectDb(newJob.projectid)
                        raise err

                    logger.info("Files imported")

                    thePlugin.finished.connect(closeApp)

                    newJob.status = models.Jobstatus.objects.get(statustext="Running")
                    newJob.save()

                    logger.info("Status running set")

                    try:
                        rv = thePlugin.process()
                    except Exception as err:
                        logger.exception(
                            f"Failed to execute plugin {newJob.task_name}", exc_info=err
                        )
                        newJob.status = 5
                        newJob.save()
                        # PluginUtils.backupProjectDb(newJob.projectid)
                        raise err

                    logger.warning(f"Result from thePlugin.process is {str(rv)}")

                    try:
                        result = applicationInst.exec_()
                        logger.info(f"Returned from exec_ with result {result}")
                        return result
                    except Exception as err:
                        logger.exception(
                            f"Failed to execute plugin {newJob.taskname}", exc_info=err
                        )
                        newJob.fail()
                        PluginUtils.backupProjectDb(newJob.projectid)
                        raise err
