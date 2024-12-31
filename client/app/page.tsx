import { Container, Stack } from "@mui/material";
import MenuBar from "./components/menu-bar";
import ProjectsToolbar from "./components/projects-toolbar";
import ProjectsTable from "./components/projects-table";

export default function ProjectsPage() {
  return (
    <>
      <MenuBar />
      <Container sx={{ my: 3 }}>
        <Stack spacing={2}>
          <ProjectsToolbar />
          <ProjectsTable />
        </Stack>
      </Container>
    </>
  );
}
