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
import { useContext, useState } from "react";
import { useApi } from "../api";
import { Job, Project } from "../models";
import { CCP4i2Context } from "../app-context";
import { useRouter } from "next/navigation";
import { HelpIframe } from "./help_iframe";

export default function ToolBar() {
  const sizeMinus1 = useMediaQuery("(max-width:110rem)");
  const sizeMinus2 = useMediaQuery("(max-width:95rem)");
  const sizeMinus3 = useMediaQuery("(max-width:80rem)");
  const sizeMinus4 = useMediaQuery("(max-width:70rem)");
  const sizeMinus5 = useMediaQuery("(max-width:60rem)");
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
  const [showHelp, setShowHelp] = useState(false);
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
      <Button
        variant="outlined"
        startIcon={<Help />}
        onClick={() => {
          window.open(
            `https://ccp4i2.gitlab.io/rstdocs/tasks/${job?.task_name}/index.html`
          );
          //setShowHelp(true);
        }}
      >
        Help
      </Button>
      {!sizeMinus4 && (
        <Button variant="outlined" startIcon={<MenuBook />}>
          Bibliography
        </Button>
      )}
      {!sizeMinus3 && (
        <Button
          variant="outlined"
          startIcon={<SystemUpdateAlt />}
          disabled={job?.status != 6}
        >
          Export MTZ
        </Button>
      )}
      {!sizeMinus2 && (
        <Button variant="outlined" startIcon={<Description />}>
          Show log file
        </Button>
      )}
      {!sizeMinus1 && (
        <Button variant="outlined" startIcon={<Code />}>
          i2run command
        </Button>
      )}
      <HelpIframe
        url={`http://localhost:3000/help/html/tasks/${job?.task_name}/index.html`}
        open={showHelp}
        handleClose={() => {
          setShowHelp(false);
        }}
      />
    </Stack>
  );
}
