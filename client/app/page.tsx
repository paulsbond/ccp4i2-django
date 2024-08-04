import { Container, Stack } from "@mui/material";
import ProjectsToolbar from "./components/projects-toolbar";
import ProjectsTable from "./components/projects-table";
import Nav from "./components/nav";

export default function ProjectsPage() {
  return (
    <>
      <Nav />
      <Container sx={{ my: 3 }}>
        <Stack spacing={2}>
          <ProjectsToolbar />
          <ProjectsTable />
        </Stack>
      </Container>
    </>
  );
}
