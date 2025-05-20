import { createContext, PropsWithChildren, useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@mui/material";
import { fullUrl, useApi } from "../api";

interface RunningProcessesProps {
  jobsAndProcessesDialogOpen: boolean;
  setJobsAndProcessesDialogOpen: (open: boolean) => void;
}

export const RunningProcessesContext = createContext<RunningProcessesProps>({
  jobsAndProcessesDialogOpen: false,
  setJobsAndProcessesDialogOpen: () => {},
});

interface RunningProcess {
  project: string;
  job_id: number;
  job_task_name: string;
  job_uuid: string;
  job_number: string;
  pid: number;
  cpu_percent: number;
  memory_usage_bytes: string;
}
export const RunningProcessesProvider: React.FC<PropsWithChildren> = (
  props
) => {
  const [jobsAndProcessesDialogOpen, setJobsAndProcessesDialogOpen] =
    useState<boolean>(false);
  const api = useApi();
  const { data: activeJobs } = api.get<any>("active_jobs/", 5000);
  const runningProcesses =
    activeJobs?.status === "Success" ? activeJobs.active_jobs : [];
  const headerMap = {
    project: "Project Name",
    job_id: "Id",
    job_task_name: "Task name",
    job_uuid: "uuid",
    job_number: "number",
    pid: "Pid",
    cpu_percent: "%CPU",
    memory_usage_bytes: "Memory usage (MB)",
  };
  return (
    <RunningProcessesContext.Provider
      value={{ jobsAndProcessesDialogOpen, setJobsAndProcessesDialogOpen }}
    >
      {props.children}
      <Dialog
        open={jobsAndProcessesDialogOpen}
        onClose={() => {
          setJobsAndProcessesDialogOpen(false);
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Running Processes</DialogTitle>
        <DialogContent>
          {runningProcesses && (
            <Table>
              <TableHead>
                <TableRow>
                  {Object.keys(headerMap).map((key) => (
                    <TableCell variant="head" key={key}>
                      {headerMap[key]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {runningProcesses.map((process: RunningProcess) => (
                  <TableRow key={process.job_id}>
                    <TableCell variant="body">{process.project}</TableCell>
                    <TableCell variant="body">{process.job_id}</TableCell>
                    <TableCell variant="body">
                      {process.job_task_name}
                    </TableCell>
                    <TableCell variant="body">{process.job_uuid}</TableCell>
                    <TableCell variant="body">{process.job_number}</TableCell>
                    <TableCell variant="body">{process.pid}</TableCell>
                    <TableCell variant="body">{process.cpu_percent}</TableCell>
                    <TableCell variant="body">
                      {(
                        Number(process.memory_usage_bytes) /
                        (1024 * 1024)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </RunningProcessesContext.Provider>
  );
};
