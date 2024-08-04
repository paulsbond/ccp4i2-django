import { Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { Upload } from "@mui/icons-material";

export default function DashboardPage() {
  return (
    <Stack spacing={2}>
      <Container>
        <Typography variant="h4" component="h1">
          Untitled Project
        </Typography>
        <Toolbar disableGutters>
          <Button variant="contained" startIcon={<Upload />}>
            Import Data
          </Button>
        </Toolbar>
      </Container>
    </Stack>
  );
}
