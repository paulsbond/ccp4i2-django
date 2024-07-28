import { Button, Stack, Typography } from "@mui/material";
import { Upload } from "@mui/icons-material";

export default function ProjectPage({ params }: { params: { id: string } }) {
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
