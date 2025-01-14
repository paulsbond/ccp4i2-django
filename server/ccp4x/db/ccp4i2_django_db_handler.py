import logging
import datetime
from ccp4i2.dbapi import CCP4DbApi
from ccp4i2.core.CCP4PluginScript import CPluginScript
from .ccp4i2_django_dbapi import ccp4i2_django_dbapi
from .ccp4i2_django_projects_manager import create_job
from . import models

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger("root")


def pluginStatusToJobStatus(finishStatus):
    status = CCP4DbApi.JOB_STATUS_FAILED
    if isinstance(finishStatus, dict):
        finishStatus = finishStatus.get("finishStatus")
    if finishStatus == CPluginScript.SUCCEEDED:
        status = CCP4DbApi.JOB_STATUS_FINISHED
    elif finishStatus == CPluginScript.FAILED:
        status = CCP4DbApi.JOB_STATUS_FAILED
    elif finishStatus == CPluginScript.INTERRUPTED:
        status = CCP4DbApi.JOB_STATUS_INTERRUPTED
    elif finishStatus == CPluginScript.MARK_TO_DELETE:
        status = CCP4DbApi.JOB_STATUS_TO_DELETE
    elif finishStatus == CPluginScript.UNSATISFACTORY:
        status = CCP4DbApi.JOB_STATUS_UNSATISFACTORY
    return status


class ccp4i2_django_db_handler:

    def __init__(self):
        self.db = ccp4i2_django_dbapi()

    def createJob(self, pluginName, jobTitle=None, parentJobId=None, jobNumber=None):
        try:
            return create_job(
                parentJobId=parentJobId,
                taskName=pluginName,
                jobNumber=jobNumber,
                saveParams=False,
                title=jobTitle,
            )
        except Exception as err:
            logger.error("Failed in createJob %s" % err)
            raise (err)

    def updateJobStatus(
        self,
        jobId=None,
        status=None,
        finishStatus=None,
        container=None,
        dbOutputData=None,
    ):
        if dbOutputData is not None:
            logger.error(f"dbOutputData is not None {dbOutputData}")
        aJob = models.Job.objects.get(uuid=jobId)
        try:
            if status is None and finishStatus is not None:
                status = pluginStatusToJobStatus(finishStatus)
            try:
                theJob = models.Job.objects.get(uuid=jobId)
                theJob.status = status
                theJob.save()
                if models.Job.Status(status).label == "Finished":
                    theJob.finish_time = datetime.datetime.now()
                    theJob.save()
                    self.db.gleanJobFiles(container=container, jobId=jobId)
                if theJob.parentjobid is None and theJob.status.statustext in [
                    "Finished",
                    "Interrupted",
                    "Failed",
                    "Unsatisfactory",
                ]:
                    pass  # backupProjectDb(theJob.projectid)
            except Exception as err:
                logger.error(f"Failed in updateJobStatus {err} {aJob}")
        except Exception as err:
            logger.error(f"Issue in reportStatus {err} {aJob}", exc_info=True)
        return CPluginScript.SUCCEEDED
