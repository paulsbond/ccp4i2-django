"use client";
import { Container, Skeleton, Stack } from "@mui/material";
import MenuBar from "./components/menu-bar";
import ProjectsToolbar from "./components/projects-toolbar";
import ProjectsTable from "./components/projects-table";
import { useApi } from "./api";
import { Project } from "./models";

export default function ProjectsPage() {
  const api = useApi();
  const { data: projects } = api.follow<Project[]>("projects", 1000);

  return (
    <Container sx={{ my: 3 }}>
      <Stack spacing={2}>
        <ProjectsToolbar />
        {projects && projects.length > 0 ? (
          <ProjectsTable />
        ) : (
          <Skeleton variant="rectangular" width="100%" height={500} />
        )}
      </Stack>
    </Container>
  );
}
