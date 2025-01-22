"use client";
import { use, useContext, useEffect, useMemo, useState } from "react";
import { Container, LinearProgress, Tab, Tabs } from "@mui/material";
import { Job, Project } from "../../../../models";
import { useApi } from "../../../../api";
import { Editor } from "@monaco-editor/react";
import { JobHeader } from "../../../../components/job-header";
import { CCP4i2ReportXMLView } from "../../../../components/report/CCP4i2ReportXMLView";
import { prettifyXml } from "../../../../components/report/CCP4i2ReportFlotWidget";
import $ from "jquery";
import { CCP4i2Context } from "../../../../app-context";

export default function JobsPage({
  params,
}: {
  params: Promise<{ id: string; jobid: string }>;
}) {
  const { id, jobid } = use(params);
  const { setJobId } = useContext(CCP4i2Context);
  const api = useApi();
  const { data: jobs, mutate: mutateJobs } = api.get<Job[]>(
    `/projects/${id}/jobs/`
  );
  const job = useMemo<Job | undefined>(() => {
    return jobs?.find((item) => item.id === parseInt(jobid));
  }, [jobid, jobs]);
  const { data: project } = api.get<Project>(`projects/${id}`);
  const { data: params_xml } = api.get<any>(`jobs/${jobid}/params_xml`);
  const { data: report_xml } = api.get<any>(`jobs/${jobid}/report_xml`);
  const { data: diagnostic_xml } = api.get<any>(`jobs/${jobid}/diagnostic_xml`);
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

  return (
    <Container>
      <JobHeader job={job} mutateJobs={mutateJobs} />
      <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
        <Tab value={0} label="Interface as xml" />
        <Tab value={1} label="Report as xml" />
        <Tab value={2} label="Report" />
        <Tab value={3} label="Diagnostic xml" />
      </Tabs>
      {tabValue == 0 && (
        <Editor
          height="calc(100vh - 15rem)"
          value={prettifyXml($.parseXML(params_xml.params_xml))}
          language="xml"
        />
      )}
      {tabValue == 1 && report_xml && (
        <Editor
          height="calc(100vh - 15rem)"
          value={prettifyXml($.parseXML(report_xml.report_xml))}
          language="xml"
        />
      )}
      {tabValue == 2 && report_xml && (
        <CCP4i2ReportXMLView report_xml={report_xml} job={job} />
      )}
      {tabValue == 3 && diagnostic_xml && (
        <Editor
          height="calc(100vh - 15rem)"
          value={prettifyXml($.parseXML(diagnostic_xml.diagnostic_xml))}
          language="xml"
        />
      )}
    </Container>
  );
}
