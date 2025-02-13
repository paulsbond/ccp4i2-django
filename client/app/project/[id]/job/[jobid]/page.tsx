"use client";
import { use, useContext, useEffect, useMemo, useState } from "react";
import { Container, LinearProgress, Tab, Tabs } from "@mui/material";
import { Job } from "../../../../models";
import { useApi } from "../../../../api";
import { Editor } from "@monaco-editor/react";
import { JobHeader } from "../../../../components/job-header";
import { CCP4i2ReportXMLView } from "../../../../components/report/CCP4i2ReportXMLView";
import { prettifyXml } from "../../../../components/report/CCP4i2ReportFlotWidget";
import $ from "jquery";
import { CCP4i2Context } from "../../../../app-context";
import { TaskContainer } from "../../../../components/task/task-container";
import { ValidationViewer } from "../../../../components/validation-viewer";
import { useJob, useProject } from "../../../../utils";

export default function JobPage({
  params,
}: {
  params: Promise<{ id: string; jobid: string }>;
}) {
  const api = useApi();
  const { id, jobid } = use(params);
  const { project, jobs, mutateJobs } = useProject(parseInt(id));

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

  const [tabValue, setTabValue] = useState<Number>(0);
  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    setTabValue(value);
  };

  useEffect(() => {
    const asyncFunc = async () => {
      if (job && setJobId) {
        setJobId(job.id);
      }
    };
    asyncFunc();
  }, [job, setJobId]);
  if (!project || !params_xml || !jobs || !job) return <LinearProgress />;

  if (!job) return <LinearProgress />;

  return (
    <Container>
      <JobHeader job={job} mutateJobs={mutateJobs} />
      <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
        <Tab value={0} label="Task interface" />
        <Tab value={1} label="Params as xml" />
        <Tab value={2} label="Report as xml" />
        <Tab value={3} label="Report" />
        <Tab value={4} label="Diagnostic xml" />
        <Tab value={5} label="Def xml" />
        <Tab value={6} label="Validation report" />
        <Tab value={7} label="Job container" />
      </Tabs>
      {tabValue == 0 && <TaskContainer />}
      {tabValue == 1 && (
        <Editor
          height="calc(100vh - 15rem)"
          value={params_xml}
          language="xml"
        />
      )}
      {tabValue == 2 && report_xml && (
        <Editor
          height="calc(100vh - 15rem)"
          value={prettifyXml(report_xml)}
          language="xml"
        />
      )}
      {tabValue == 3 && jobid && <CCP4i2ReportXMLView />}
      {tabValue == 4 && diagnostic_xml && (
        <Editor
          height="calc(100vh - 15rem)"
          value={diagnostic_xml}
          language="xml"
        />
      )}
      {tabValue == 5 && def_xml && (
        <Editor height="calc(100vh - 15rem)" value={def_xml} language="xml" />
      )}
      {tabValue == 6 && validation && <ValidationViewer />}
      {tabValue == 7 && container && (
        <Editor
          height="calc(100vh - 15rem)"
          value={JSON.stringify(container, null, 2)}
          language="json"
        />
      )}
    </Container>
  );
}
