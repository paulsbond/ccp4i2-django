"use client";
import { SyntheticEvent, use, useMemo, useState } from "react";
import {
  Container,
  LinearProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { JobsGrid } from "../../../../components/jobs-grid";
import { Job, Project } from "../../../../models";
import { useApi } from "../../../../api";
import { Panel, PanelGroup } from "react-resizable-panels";
import FilesTable from "../../../../components/files-table";
import { Editor } from "@monaco-editor/react";
import { JobHeader } from "../../../../components/job-header";

export default function JobsPage({
  params,
}: {
  params: Promise<{ id: string; jobid: string }>;
}) {
  const { id, jobid } = use(params);
  const api = useApi();
  const { data: jobs, mutate: mutateJobs } = api.get<Job[]>(
    `/projects/${id}/jobs/`
  );
  const job = useMemo<Job | undefined>(() => {
    return jobs?.find((item) => item.id === parseInt(jobid));
  }, [jobid, jobs]);
  const { data: project } = api.get<Project>(`projects/${id}`);
  const { data: params_xml } = api.get<any>(`jobs/${jobid}/params_xml`);
  const [tabValue, setTabValue] = useState<Number>(0);
  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    setTabValue(value);
  };
  if (!project || !params_xml || !jobs || !job) return <LinearProgress />;
  return (
    <Container>
      <JobHeader job={job} mutateJobs={mutateJobs} />
      <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
        <Tab value={0} label="Interface as xml" />
        <Tab value={1} label="Report" />
      </Tabs>
      {tabValue == 0 && (
        <Editor
          height="calc(100vh - 15rem)"
          value={params_xml.params_xml}
          language="xml"
        />
      )}
      {tabValue == 1 && <Typography>Files</Typography>}
    </Container>
  );
}
