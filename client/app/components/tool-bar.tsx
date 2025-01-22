import { Button, Stack } from "@mui/material";
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

export default function ToolBar() {
  const { projectId, jobId } = useContext(CCP4i2Context);
  const api = useApi();
  const { data: project } = api.get<Project>(`projects/${projectId}`);
  const { data: job } = api.get<Job>(`jobs/${jobId}`);
  return (
    <Stack
      direction="row"
      spacing={2}
      useFlexGap
      sx={{ flexWrap: "wrap", justifyContent: "center", px: 2 }}
    >
      <Button variant="outlined" startIcon={<Menu />}>
        Task menu
      </Button>
      <Button
        variant="outlined"
        startIcon={<DirectionsRun />}
        disabled={job?.status != 1}
      >
        Run
      </Button>
      <Button variant="outlined" startIcon={<ContentCopy />}>
        Clone job
      </Button>
      <Button variant="outlined" startIcon={<Help />}>
        Help
      </Button>
      <Button variant="outlined" startIcon={<MenuBook />}>
        Bibliography
      </Button>
      <Button
        variant="outlined"
        startIcon={<SystemUpdateAlt />}
        disabled={job?.status != 6}
      >
        Export MTZ
      </Button>
      <Button variant="outlined" startIcon={<Description />}>
        Show log file
      </Button>
      <Button variant="outlined" startIcon={<Code />}>
        Show i2run command
      </Button>
    </Stack>
  );
}
