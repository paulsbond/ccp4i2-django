import { useContext, useMemo } from "react";
import { CCP4i2Context } from "../../app-context";
import { useApi } from "../../api";
import { Job } from "../../models";
import { LinearProgress, Paper, Toolbar, Typography } from "@mui/material";
import ProsmartRefmacInterface from "./task-interfaces/prosmart_refmac";

export interface CCP4i2TaskInterfaceProps {
  job: Job;
  paramsXML: any;
  mutate: () => void;
}

export const TaskContainer = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { data: job } = api.get<Job>(`jobs/${jobId}`);
  const { data: params_xml, mutate } = api.get<{
    status: string;
    params_xml: string;
  }>(`jobs/${jobId}/params_xml`);
  const paramsXML = params_xml ? $($.parseXML(params_xml.params_xml)) : null;

  const taskInterface = useMemo(() => {
    if (!job || !params_xml) return <LinearProgress />;
    switch (job.task_name) {
      case "prosmart_refmac":
        return <ProsmartRefmacInterface {...{ paramsXML, mutate, job }} />;
      default:
        return <ProsmartRefmacInterface {...{ paramsXML, mutate, job }} />;
    }
  }, [job]);

  if (!jobId) return <LinearProgress />;
  if (!job) return <LinearProgress />;
  if (!params_xml?.params_xml) return <LinearProgress />;

  return (
    <Paper sx={{ maxHeight: "calc(100vh - 15rem)", overflowY: "auto" }}>
      {taskInterface}
    </Paper>
  );
};
