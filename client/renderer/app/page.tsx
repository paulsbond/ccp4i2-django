"use client";
import { Badge, Container, Skeleton, Stack } from "@mui/material";
import ProjectsToolbar from "./components/projects-toolbar";
import ProjectsTable from "./components/projects-table";
import { useApi } from "./api";
import { Project } from "./models";

export default function ProjectsPage() {
  const api = useApi();
  const { data: projects } = api.get<Project[]>("projects", 1000);
  const { data: task_tree } = api.get<any>(`task_tree/`);

  return (
    <Container sx={{ my: 3 }}>
      <Stack spacing={2}>
        {task_tree?.task_tree?.tree && (
          <Badge badgeContent={task_tree.task_tree.tree.length} color="primary">
            {" "}
            Tasks available
          </Badge>
        )}
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
