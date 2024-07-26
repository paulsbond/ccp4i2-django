import { Button, Stack, Typography } from "@mui/material";
import { Add, Upload } from "@mui/icons-material";

export default function ProjectsPage() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" startIcon={<Add />}>
          New
        </Button>
        <Button variant="outlined" startIcon={<Upload />} disabled>
          Import
        </Button>
      </Stack>
    </Stack>
  );
}
