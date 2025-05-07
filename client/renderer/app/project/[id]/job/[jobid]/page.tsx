"use client";
import { use, useContext, useEffect, useState } from "react";
import { Container, LinearProgress, Tab, Tabs } from "@mui/material";
import { useApi } from "../../../../api";
import { Editor } from "@monaco-editor/react";
import { JobHeader } from "../../../../components/job-header";
import { CCP4i2ReportXMLView } from "../../../../components/report/CCP4i2ReportXMLView";
import { CCP4i2Context } from "../../../../app-context";
import { TaskContainer } from "../../../../components/task/task-container";
import {
  prettifyXml,
  useJob,
  usePrevious,
  useProject,
} from "../../../../utils";
import ToolBar from "../../../../components/tool-bar";
import { JobCommentEditor } from "../../../../components/job-comment-editor";
import { JobMenu } from "../../../../components/job-context-menu";
import { JobDirectoryView } from "../../../../components/job_directory_view";

export default function JobPage({
  params,
}: {
  params: Promise<{ id: string; jobid: string }>;
}) {
  const api = useApi();
  const { id, jobid } = use(params);
  const { project, jobs, mutateJobs } = useProject(parseInt(id));
  const { devMode } = useContext(CCP4i2Context);

  const { data: validationJson } = api.get_validation({
    type: "jobs",
    id: parseInt(jobid),
    endpoint: "validation",
  });

  const { setJobId } = useContext(CCP4i2Context);

  const { job } = useJob(parseInt(jobid));

  const {
    params_xml,
    validation,
    report_xml,
    diagnostic_xml,
    def_xml,
    container,
  } = useJob(job?.id);

  const previousJob = usePrevious(job);

  const [tabValue, setTabValue] = useState<Number>(job?.status == 1 ? 0 : 3);
  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    setTabValue(value);
  };

  useEffect(() => {
    const asyncFunc = async () => {
      if (job && setJobId) {
        setJobId(job.id);
      }
      if (job && job != previousJob) {
        setTabValue(job.status == 1 ? 0 : [3, 6].includes(job.status) ? 3 : 4);
      }
    };
    asyncFunc();
  }, [job, setJobId]);

  return !project || !jobs || !job ? (
    <LinearProgress />
  ) : (
    <>
      <ToolBar />
      <Container>
        <JobHeader job={job} mutateJobs={mutateJobs} />
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab value={0} label="Task interface" />
          {devMode && <Tab value={1} label="Params as xml" />}
          {devMode && <Tab value={2} label="Report as xml" />}
          <Tab value={3} label="Report" />
          {devMode && <Tab value={4} label="Diagnostic xml" />}
          {devMode && <Tab value={5} label="Def xml" />}
          {devMode && <Tab value={6} label="Validation report" />}
          {devMode && <Tab value={7} label="Job container" />}
          <Tab value={8} label="Comments" />
          <Tab value={9} label="Directory" />
        </Tabs>
        {tabValue == 0 && <TaskContainer />}
        {devMode && tabValue == 1 && params_xml && (
          <Editor
            height="calc(100vh - 15rem)"
            value={params_xml}
            language="xml"
          />
        )}
        {devMode && tabValue == 2 && report_xml && (
          <Editor
            height="calc(100vh - 15rem)"
            value={prettifyXml(report_xml)}
            language="xml"
          />
        )}
        {tabValue == 3 && jobid && <CCP4i2ReportXMLView />}
        {devMode && tabValue == 4 && diagnostic_xml && (
          <Editor
            height="calc(100vh - 15rem)"
            value={diagnostic_xml}
            language="xml"
          />
        )}
        {devMode && tabValue == 5 && def_xml && (
          <Editor height="calc(100vh - 15rem)" value={def_xml} language="xml" />
        )}
        {devMode && tabValue == 6 && validation && (
          <Editor
            height="calc(100vh - 15rem)"
            value={JSON.stringify(validation, null, 2)}
            language="json"
          />
        )}
        {tabValue == 7 && container && (
          <Editor
            height="calc(100vh - 15rem)"
            value={JSON.stringify(container.container, null, 2)}
            language="json"
          />
        )}
        {tabValue == 8 && container && (
          <>
            <JobCommentEditor jobId={job.id} />
          </>
        )}
        {tabValue == 9 && job && project && (
          <>
            <JobDirectoryView job={job} project={project} />
          </>
        )}
        <JobMenu />
      </Container>
    </>
  );
}
