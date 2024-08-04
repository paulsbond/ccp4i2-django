import { Stack } from "@mui/material";
import ProjectsToolbar from "./components/projects-toolbar";
import ProjectsTable from "./components/projects-table";

export default function ProjectsPage() {
  return (
    <Stack spacing={2}>
      <ProjectsToolbar />
      <ProjectsTable />
    </Stack>
  );
}
