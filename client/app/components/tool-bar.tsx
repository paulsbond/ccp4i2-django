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

export default function ToolBar() {
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
      <Button variant="outlined" startIcon={<DirectionsRun />}>
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
      <Button variant="outlined" startIcon={<SystemUpdateAlt />}>
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
