import { Button, Container, Stack, Typography } from "@mui/material";

export default function ProjectPage() {
  return (
    <Container sx={{ my: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Untitled Project
        </Typography>
        <Stack direction="row">
          <Button variant="contained">Import Data</Button>
        </Stack>
      </Stack>
    </Container>
  );
}
