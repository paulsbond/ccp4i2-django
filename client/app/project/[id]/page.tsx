"use client";
import {
  Button,
  Container,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Upload } from "@mui/icons-material";
import { api } from "../../api";
import { Project } from "../../models";

export default function DashboardPage({ params }: { params: { id: string } }) {
  const project = api.get<Project>(`projects/${params.id}`);

  if (!project) return <LinearProgress />;
  return (
    <Stack spacing={2}>
      <Container>
        <Typography variant="h4" component="h1">
          {project.name}
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
