import { createContext, useContext, useMemo, useState } from "react";
import { CCP4i2Context } from "../../app-context";
import { useApi } from "../../api";
import { Job } from "../../models";
import {
  Dialog,
  DialogContent,
  LinearProgress,
  Paper,
  Popper,
} from "@mui/material";
import ProsmartRefmacInterface from "./task-interfaces/prosmart_refmac";
import SubstituteLigandInterface from "./task-interfaces/SubstituteLigand";
import AimlessPipeInterface from "./task-interfaces/aimless_pipe";
import Crank2Interface from "./task-interfaces/crank2";
import GenericInterface from "./task-interfaces/generic";
import { useJob } from "../../utils";
import { ErrorPopper } from "./task-elements/error-info";

export interface CCP4i2TaskInterfaceProps {
  job: Job;
}
interface TaskInterfaceContextProps {
  errorInfoAnchor: Element | null;
  setErrorInfoAnchor: (el: Element | null) => void;
  errorInfoItem: any | null;
  setErrorInfoItem: (item: any) => void;
  inFlight: any | null;
  setInFlight: (item: any) => void;
}
export const TaskInterfaceContext = createContext<TaskInterfaceContextProps>({
  errorInfoAnchor: null,
  setErrorInfoAnchor: (item: any | null) => {},
  errorInfoItem: null,
  setErrorInfoItem: (item: any) => {},
  inFlight: null,
  setInFlight: (item: any) => {},
});

export const TaskContainer = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { job, container } = useJob(jobId);
  const [errorInfoAnchor, setErrorInfoAnchor] = useState<Element | null>(null);
  const [errorInfoItem, setErrorInfoItem] = useState<any | null>(null);
  const [inFlight, setInFlight] = useState<boolean>(false);

  const taskInterface = useMemo(() => {
    switch (job?.task_name) {
      case null:
        return <LinearProgress />;
      case "prosmart_refmac":
        return (
          <ProsmartRefmacInterface
            {...{
              job,
            }}
          />
        );
      case "SubstituteLigand":
        return (
          <SubstituteLigandInterface
            {...{
              job,
            }}
          />
        );
      case "aimless_pipe":
        return (
          <AimlessPipeInterface
            {...{
              job,
            }}
          />
        );
      case "crank2":
        return (
          <Crank2Interface
            {...{
              job,
            }}
          />
        );
      default:
        return (
          job && (
            <GenericInterface
              {...{
                job,
              }}
            />
          )
        );
    }
  }, [job, container]);

  if (!jobId) return <LinearProgress />;
  if (!container) return <LinearProgress />;
  if (!job) return <LinearProgress />;

  return (
    <TaskInterfaceContext.Provider
      value={{
        errorInfoAnchor,
        setErrorInfoAnchor,
        errorInfoItem,
        setErrorInfoItem,
        inFlight,
        setInFlight,
      }}
    >
      <Paper
        key="interface"
        sx={{ maxHeight: "calc(100vh - 15rem)", overflowY: "auto" }}
      >
        {taskInterface}
      </Paper>
      <ErrorPopper key="error-popper" job={job} />
    </TaskInterfaceContext.Provider>
  );
};
