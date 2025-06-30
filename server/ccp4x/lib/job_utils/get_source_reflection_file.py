from ccp4i2.core import CCP4XtalData
from ccp4i2.core import CCP4TaskManager
from ...db.models import Job, FileUse, FileImport


def get_source_reflection_file(jobId=None, jobParamNameList=None):
    the_job = Job.objects.get(uuid=jobId)
    export_task_name = the_job.task_name
    if not isinstance(jobParamNameList, list):
        jobParamNameList = [jobParamNameList]
    refln_file_list = []
    p_list = []
    f_list = []
    i_list = []
    mode = "Imported file"
    for job_param in jobParamNameList:
        try:
            the_file = FileUse.objects.get(
                job=the_job, job_param_name=job_param, role=FileUse.Role.IN
            ).file
            file_task_name = the_file.job.task_name
            file_job_uuid = the_file.job.uuid
            refln_file = None
            if file_task_name == "aimless_pipe":
                mode = "Data reduction"
                from ccp4i2.pipelines.aimless_pipe.script import aimless_pipe

                refln_file = aimless_pipe.exportJobFile(
                    file_job_uuid, mode="complete_mtz"
                )
            elif file_task_name == "import_merged":
                mode = "Imported by import merged"
                from ccp4i2.pipelines.import_merged.script import import_merged

                refln_file = import_merged.exportJobFile(
                    file_job_uuid, mode="complete_mtz"
                )
            elif file_task_name == "AlternativeImportXIA2":
                mode = "Imported from XIA2"
                from ccp4i2.wrappers import AlternativeImportXIA2

                refln_file = AlternativeImportXIA2.exportJobFile(
                    file_job_uuid, mode="complete_mtz"
                )
            else:
                try:
                    _ = FileImport.objects.get(file=the_file)
                    refln_file = str(the_file.path)
                except FileImport.DoesNotExist as exc:
                    raise RuntimeError(
                        "We have an input file referenced here that is not an import file.  This is a bug in the code."
                    ) from exc

            if refln_file is not None:
                refln_file_list.append([job_param, refln_file, {}])
                p_list.append(job_param)
                f_list.append(refln_file)
                i_list.append(the_file.uuid)
        except FileUse.DoesNotExist:
            # No input file for this job parameter, continue to next
            continue

    colTagList = CCP4TaskManager.TASKMANAGER().exportMtzColumnLabels(
        taskName=export_task_name,
        jobId=jobId,
        paramNameList=p_list,
        sourceInfoList=i_list,
    )
    print("CProjectManager.getSourceReflectionFile colTagList", p_list, i_list)
    if len(colTagList) == 0:
        colTagList = p_list
    if len(f_list) == 0:
        return {}
    if len(f_list) == 1:
        return {"fileName": f_list[0], "source": mode, "jobNumber": the_job.number}
    else:
        # Multiple reflection input need to be cadded and colmn labels sorted
        # Likely to have redundant freer?
        # print 'CProjectManager.getSourceReflectionFile reflnFileList',reflnFileList
        exportFile = str(the_job.directory / "exportMtz_reflns.mtz")
        com_lines = []
        input_files = []
        ex_obj = CCP4XtalData.CMtzDataFile(refln_file_list[0])
        for ii, a_file in enumerate(refln_file_list, start=1):
            input_files.append(a_file)
            refln_obj = CCP4XtalData.CMtzDataFile(a_file)
            com_line = "LABOUT FILENUMBER " + str(ii + 1)
            jj = 0
            for column in refln_obj.fileContent.listOfColumns:
                jj += 1
                com_line += (
                    " E"
                    + str(jj)
                    + "="
                    + str(column.columnLabel)
                    + "_"
                    + colTagList[ii]
                )
            com_lines.append(com_line)
        # print 'CProjectManager.getSourceReflectionFile input files',inputFiles
        outfile, err = ex_obj.runCad(exportFile, input_files, com_lines)
        # print 'CProjectManager.getSourceReflectionFile',outfile,err.report()
        return {"fileName": outfile, "source": mode, "jobNumber": the_job.number}
