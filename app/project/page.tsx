import { Button, Container, Stack, Typography } from "@mui/material";
import { Upload } from "@mui/icons-material";

export default function ProjectPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Untitled Project
      </Typography>
      <Stack direction="row">
        <Button variant="contained" startIcon={<Upload />}>
          Import Data
        </Button>
      </Stack>
    </Stack>
  );
}
