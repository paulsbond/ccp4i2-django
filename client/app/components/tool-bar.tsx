import { Button, Stack, useMediaQuery } from "@mui/material";
import {
  Code,
  ContentCopy,
  Description,
  DirectionsRun,
  Help,
  Menu,
  MenuBook,
  SystemUpdateAlt,
} from "@mui/icons-material";
import { useContext } from "react";
import { useApi } from "../api";
import { Job, Project } from "../models";
import { CCP4i2Context } from "../app-context";
import { useRouter } from "next/navigation";

export default function ToolBar() {
  const isSmall = useMediaQuery("(max-width:80rem)");
  const { jobPanelSize } = useContext(CCP4i2Context);
  const { projectId, jobId } = useContext(CCP4i2Context);
  const api = useApi();
  const { data: job, mutate: mutateJob } = api.get_endpoint<Job>({
    type: "jobs",
    id: jobId,
    endpoint: "",
  });
  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: projectId,
    endpoint: "jobs",
  });
  const router = useRouter();
  const handleClone = async () => {
    if (job) {
      const cloneResult: Job = await api.post(`jobs/${job?.id}/clone/`);
      console.log(cloneResult);
      if (cloneResult?.id) {
        mutateJob();
        mutateJobs();
        router.push(`/project/${projectId}/job/${cloneResult.id}`);
      }
    }
  };
  const handleRun = async () => {
    if (job) {
      const runResult: Job = await api.post(`jobs/${job.id}/run/`);
      console.log(runResult);
      if (runResult?.id) {
        setTimeout(() => {
          mutateJob();
          mutateJobs();
        }, 1000);
      }
    }
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      useFlexGap
      sx={{ flexWrap: "wrap", justifyContent: "center", px: 2 }}
    >
      <Button
        variant="outlined"
        startIcon={<Menu />}
        onClick={() => {
          router.push(`/project/${projectId}`);
        }}
      >
        Task menu
      </Button>
      <Button
        variant="outlined"
        startIcon={<DirectionsRun />}
        disabled={job?.status != 1}
        onClick={handleRun}
      >
        Run
      </Button>
      <Button
        variant="outlined"
        startIcon={<ContentCopy />}
        onClick={handleClone}
      >
        Clone job
      </Button>
      <Button variant="outlined" startIcon={<Help />}>
        Help
      </Button>
      {jobPanelSize && jobPanelSize > 40 && (
        <Button variant="outlined" startIcon={<MenuBook />}>
          Bibliography
        </Button>
      )}
      {jobPanelSize && jobPanelSize > 60 && (
        <Button
          variant="outlined"
          startIcon={<SystemUpdateAlt />}
          disabled={job?.status != 6}
        >
          Export MTZ
        </Button>
      )}
      {jobPanelSize && jobPanelSize > 80 && (
        <Button variant="outlined" startIcon={<Description />}>
          Show log file
        </Button>
      )}
      {jobPanelSize && jobPanelSize > 100 && (
        <Button variant="outlined" startIcon={<Code />}>
          i2run command
        </Button>
      )}
    </Stack>
  );
}
