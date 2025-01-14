import logging
import contextlib
from ..db import models
from ccp4i2.core import CCP4Modules

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
                    dbHandler = PluginUtils.DjangoDbHandler()
                    dbHandler.projectName = newJob.projectid.projectname
                    dbHandler.projectId = newJob.projectid.projectid

                    applicationInst = QtCore.QEventLoop(
                        parent=CCP4Modules.QTAPPLICATION()
                    )
                    logger.info(f"applicationInst {str(applicationInst)}")

                    try:
                        thePlugin = PluginUtils.getJobPlugin(
                            newJob, parent=applicationInst, dbHandler=dbHandler
                        )
                        logger.info(f"Retrieved plugin {newJob.taskname}")
                    except Exception as err:
                        logger.exception(f"Err getting job {str(err)}", exc_info=err)
                        newJob.fail()
                        PluginUtils.backupProjectDb(newJob.projectid)
                        raise err

                    try:
                        CCP4Modules.PROJECTSMANAGER().setOutputFileNames(
                            container=thePlugin.container,
                            projectId=newJob.projectid.projectid,
                            jobNumber=newJob.jobnumber,
                            force=True,
                        )
                        PluginUtils.save_params_for_job(thePlugin, newJob)
                    except Exception as err:
                        logger.exception(f"Exception setting filenames", exc_info=err)
                        newJob.fail()
                        PluginUtils.backupProjectDb(newJob.projectid)
                        raise err

                    logger.info("Retrieved setOutputFileNames")

                    # thePlugin.jobId = newJob.jobid
                    applicationInst.pluginName = newJob.taskname

                    @QtCore.Slot(dict)
                    def closeApp(completionStatus):
                        logger.info("Received closeApp", completionStatus)
                        try:
                            with open(
                                os.path.join(newJob.jobDirectory, "diagnostic.xml"),
                                "wb",
                            ) as diagnosticXML:
                                diagnosticXML.write(
                                    ET.tostring(thePlugin.errorReport.getEtree())
                                )
                        except Exception as err:
                            logger.error(
                                f"Exception in writing diagnostics", exc_info=err
                            )

                        QtCore.QTimer.singleShot(1, applicationInst.quit)
                        logger.info("Set singleshot quit timer")

                    thePlugin.setDbData(
                        handler=dbHandler,
                        projectName=newJob.projectid.projectname,
                        projectId=newJob.projectid.projectid,
                        jobNumber=newJob.jobnumber,
                        jobId=jobId,
                    )

                    logger.info("Set DbData")

                    try:
                        PluginUtils.importFiles(newJob, thePlugin)
                    except Exception as err:
                        logger.exception(f"Failed importing files", exc_info=err)
                        newJob.fail()
                        PluginUtils.backupProjectDb(newJob.projectid)
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
                            f"Failed to execute plugin {newJob.taskname}", exc_info=err
                        )
                        newJob.fail()
                        PluginUtils.backupProjectDb(newJob.projectid)
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
