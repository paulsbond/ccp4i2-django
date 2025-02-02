import { useContext, useMemo } from "react";
import { CCP4i2Context } from "../../app-context";
import { useApi } from "../../api";
import { Job } from "../../models";
import { LinearProgress, Paper, Toolbar, Typography } from "@mui/material";
import ProsmartRefmacInterface from "./task-interfaces/prosmart_refmac";
import GenericInterface from "./task-interfaces/generic";

export interface CCP4i2TaskInterfaceProps {
  job: Job;
}

export const TaskContainer = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { data: job } = api.get<Job>(`jobs/${jobId}`);
  const { data: container, mutate: mutateParams } = api.get<any>(
    `jobs/${jobId}/container`
  );

  const taskInterface = useMemo(() => {
    if (!job || !container) return <LinearProgress />;
    switch (job.task_name) {
      case "prosmart_refmac":
        return <ProsmartRefmacInterface {...{ job }} />;
      default:
        return <GenericInterface {...{ job }} />;
    }
  }, [job, container]);

  if (!jobId) return <LinearProgress />;
  if (!job) return <LinearProgress />;

  return (
    <Paper sx={{ maxHeight: "calc(100vh - 15rem)", overflowY: "auto" }}>
      {taskInterface}
    </Paper>
  );
};
