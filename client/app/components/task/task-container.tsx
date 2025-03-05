import { useContext, useMemo } from "react";
import { CCP4i2Context } from "../../app-context";
import { useApi } from "../../api";
import { Job } from "../../models";
import { LinearProgress, Paper, Toolbar, Typography } from "@mui/material";
import ProsmartRefmacInterface from "./task-interfaces/prosmart_refmac";
import SubstituteLigandInterface from "./task-interfaces/SubstituteLigand";
import AimlessPipeInterface from "./task-interfaces/aimless_pipe";
import Crank2Interface from "./task-interfaces/crank2";
import GenericInterface from "./task-interfaces/generic";
import { useJob } from "../../utils";

export interface CCP4i2TaskInterfaceProps {
  job: Job;
}

export const TaskContainer = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { job, container } = useJob(jobId);
  const taskInterface = useMemo(() => {
    if (!job || !container) return <LinearProgress />;
    switch (job.task_name) {
      case "prosmart_refmac":
        return <ProsmartRefmacInterface {...{ job }} />;
      case "SubstituteLigand":
        return <SubstituteLigandInterface {...{ job }} />;
      case "aimless_pipe":
        return <AimlessPipeInterface {...{ job }} />;
      case "crank2":
        return <Crank2Interface {...{ job }} />;
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
