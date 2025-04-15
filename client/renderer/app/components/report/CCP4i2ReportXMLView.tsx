import { ReactNode, useContext, useEffect, useMemo } from "react";
import $ from "jquery";
import { Paper, Skeleton } from "@mui/material";
import { Job } from "../../models";
import { CCP4i2ReportElement } from "./CCP4i2ReportElement";
import { useApi } from "../../api";
import { CCP4i2Context } from "../../app-context";
import { usePrevious } from "../../utils";
import { Exo_2 } from "next/font/google";

export const CCP4i2ReportXMLView = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { data: job, mutate: mutateJob } = api.get<Job>(`jobs/${jobId}`, 2000);
  const { data: report_xml, mutate: mutateReportXml } = api.get_endpoint_xml(
    {
      type: "jobs",
      id: jobId,
      endpoint: "report_xml",
    },
    job?.status == 3 || job?.status == 2 ? 5000 : 0
  );
  const oldJob = usePrevious(job);

  useEffect(() => {
    console.log({ job, oldJob });
    if (job && oldJob && job.status !== oldJob.status) {
      if (job.status > 3) {
        console.log("Job finished");
        mutateReportXml(() => null); // Force re-fetch
      }
    }
  }, [job, oldJob]);

  useEffect(() => {
    if (report_xml) {
      console.log(report_xml);
    } else {
      console.log("No report xml");
    }
  }, [report_xml]);

  const reportContent = useMemo<ReactNode[] | null>(() => {
    if (!report_xml) return null;
    if (!job) return null;
    return $(report_xml)
      .children()
      .children()
      .map((iItem: Number, item: any) => {
        return (
          <CCP4i2ReportElement
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      })
      .toArray();
  }, [report_xml, job]);

  return !reportContent ? (
    <Skeleton />
  ) : (
    <Paper
      sx={{
        width: "100%",
        height: "calc(100vh - 14rem)",
        overflowY: "auto",
      }}
    >
      {reportContent}
    </Paper>
  );
};
