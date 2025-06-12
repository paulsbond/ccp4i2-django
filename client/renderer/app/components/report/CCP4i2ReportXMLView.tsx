import { ReactNode, useCallback, useContext, useEffect, useMemo } from "react";
import $ from "jquery";
import {
  Avatar,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { Job } from "../../models";
import { CCP4i2ReportElement } from "./CCP4i2ReportElement";
import { useApi } from "../../api";
import { CCP4i2Context } from "../../app-context";
import { useJob, usePrevious } from "../../utils";
import { useRouter } from "next/navigation";
import { usePopcorn } from "../popcorn-provider";
import useSWR from "swr";

export const CCP4i2ReportXMLView = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { job } = useJob(jobId);
  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job?.project,
    endpoint: "jobs",
  });

  const { data: report_xml_json, mutate: mutateReportXml } = useSWR<any>(
    job ? `/api/proxy/jobs/${job.id}/report_xml/` : null,
    (url) => fetch(url).then((r) => r.json()),
    { refreshInterval: job?.status == 3 || job?.status == 2 ? 5000 : 0 }
  );

  const report_xml: XMLDocument | null = useMemo(() => {
    if (!report_xml_json || !report_xml_json.xml) return null;
    return $.parseXML(report_xml_json.xml);
  }, [report_xml_json]);

  const { data: what_next } = api.get<any>(`jobs/${job?.id}/what_next/`);

  const oldJob = usePrevious(job);

  const router = useRouter();

  const { setMessage } = usePopcorn();

  useEffect(() => {
    if (job && oldJob && job.status !== oldJob.status) {
      if (job.status > 3) {
        setMessage("Job finished");
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

  const handleTaskSelect = useCallback(
    async (task_name: string) => {
      if (!job) return;
      const created_job_result: any = await api.post(
        `projects/${job.project}/create_task/`,
        {
          task_name,
          context_job_uuid: job.uuid,
        }
      );
      if (created_job_result?.status === "Success") {
        const created_job: Job = created_job_result.new_job;
        mutateJobs();
        router.push(`/project/${job.project}/job/${created_job.id}`);
      }
    },
    [job, mutateJobs]
  );

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
      {what_next?.Status === "Success" &&
        what_next?.result.length > 0 &&
        job?.status == 6 && (
          <Stack
            direction="row"
            sx={{
              width: "100%",
              justifyContent: "space-between",
              p: 0,
              position: "sticky",
              bottom: 0,
              backgroundColor: "white",
              zIndex: 1,
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              What next?
            </Typography>
            {what_next.result.map((task: any) => (
              <Button
                variant="outlined"
                sx={{ minWidth: "15rem" }}
                onClick={() => {
                  handleTaskSelect(task.taskName);
                }}
              >
                {" "}
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                  }}
                  src={`/api/proxy/djangostatic/svgicons/${task.taskName}.svg`}
                  alt={`/api/proxy/djangostatic/qticons/${task.taskName}.png`}
                />
                {task.shortTitle}
              </Button>
            ))}
          </Stack>
        )}
      {reportContent}
    </Paper>
  );
};
