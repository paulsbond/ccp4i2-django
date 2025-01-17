import datetime
import logging
import sys
import uuid

from ccp4i2.core.CCP4PluginScript import CPluginScript
from ccp4i2.dbapi import CCP4DbApi

from . import models
from ..lib.job_utils.create_job import create_job
from .ccp4i2_django_dbapi import CCP4i2DjangoDbApi


logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(f"ccp4x:{__name__}")


def plugin_status_to_job_status(finishStatus):
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


class CCP4i2DjangoDbHandler:

    def __init__(self):
        self.db = CCP4i2DjangoDbApi()

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
        logger.debug(
            "In update JobStatus %s %s %s %s %s",
            (jobId, status, finishStatus, container, dbOutputData),
        )
        sys.stdout.flush()
        if dbOutputData is not None:
            logger.error(f"dbOutputData is not None {dbOutputData}")
        if not isinstance(jobId, uuid.UUID) and "-" not in jobId:
            jobId = uuid.UUID(jobId)
        aJob = models.Job.objects.get(uuid=jobId)
        try:
            if status is None and finishStatus is not None:
                status = plugin_status_to_job_status(finishStatus)
            try:
                the_job = models.Job.objects.get(uuid=jobId)
                the_job.status = status
                the_job.save()
                if models.Job.Status(status).label == "Finished":
                    the_job.finish_time = datetime.datetime.now()
                    the_job.save()
                    self.db.gleanJobFiles(container=container, jobId=jobId)
                if the_job.parent is None and models.Job.Status(
                    the_job.status
                ).label in [
                    "Finished",
                    "Interrupted",
                    "Failed",
                    "Unsatisfactory",
                ]:
                    pass  # backupProjectDb(the_job.projectid)
            except Exception as err:
                logger.error(f"Failed in updateJobStatus {err} {aJob}")
        except Exception as err:
            logger.error(f"Issue in reportStatus {err} {aJob}", exc_info=True)
        return CPluginScript.SUCCEEDED
