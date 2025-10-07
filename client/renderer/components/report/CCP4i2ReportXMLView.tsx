import { ReactNode, useCallback, useEffect, useMemo } from "react";
import $ from "jquery";
import {
  Avatar,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { Job } from "../../types/models";
import { CCP4i2ReportElement } from "./CCP4i2ReportElement";
import { useApi } from "../../api";
import { useCCP4i2Window } from "../../app-context";
import { useJob, usePrevious } from "../../utils";
import { useRouter } from "next/navigation";
import { usePopcorn } from "../../providers/popcorn-provider";
import useSWR from "swr";
import { swrFetcher } from "../../api-fetch";
import { useTheme } from "../../theme/theme-provider";
import { CCP4i2WhatNext } from "./CCP4i2WhatNext";

export const CCP4i2ReportXMLView = () => {
  const { customColors } = useTheme();
  const api = useApi();
  const { jobId } = useCCP4i2Window();
  const { job } = useJob(jobId);
  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job?.project,
    endpoint: "jobs",
  });

  const { data: report_xml_json, mutate: mutateReportXml } = useSWR<any>(
    job ? `/api/proxy/jobs/${job.id}/report_xml/` : null,
    swrFetcher,
    { refreshInterval: job?.status == 3 || job?.status == 2 ? 5000 : 0 }
  );

  const report_xml: XMLDocument | null = useMemo(() => {
    if (!report_xml_json || !report_xml_json.xml) return null;
    return $.parseXML(report_xml_json.xml);
  }, [report_xml_json]);

  const oldJob = usePrevious(job);

  const router = useRouter();

  const { setMessage } = usePopcorn();

  useEffect(() => {
    if (job && oldJob && job.status !== oldJob.status) {
      if (job.status > 3 && job.id === oldJob.id) {
        setMessage(`Job finished with status ${job.status}`);
        mutateReportXml(() => null); // Force re-fetch
      }
    }
  }, [job, oldJob]);

  const reportContent = useMemo<ReactNode[] | null>(() => {
    if (!report_xml) return null;
    if (!job) return null;
    return $(report_xml)
      .children()
      .children()
      .map((iItem: number, item: any) => {
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
    <>
      <Paper
        sx={{
          width: "100%",
          height: "calc(100vh - 22rem)",
          overflowY: "auto",
        }}
      >
        {reportContent}
        <CCP4i2WhatNext />
      </Paper>
    </>
  );
};
