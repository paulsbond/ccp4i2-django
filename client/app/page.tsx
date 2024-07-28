"use client";
import {
  Button,
  Checkbox,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Add, Delete, Download, Upload } from "@mui/icons-material";
import { get, post } from "./api";
import { Project } from "./models";
import { shortDate } from "./pipes";
import SearchField from "./components/search-field";

export default function ProjectsPage() {
  const projects = get<Project[]>("projects");
  if (!projects) return <LinearProgress />;

  function addProject() {
    post<Project>("projects").then((project) => {
      console.log(project);
    });
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" startIcon={<Add />} onClick={addProject}>
          New
        </Button>
        <Button variant="outlined" startIcon={<Upload />} disabled>
          Import
        </Button>
      </Stack>
      <SearchField onDelay={console.log} />
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <Checkbox />
            </TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Created</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project: Project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>{project.name}</TableCell>
              <TableCell>{shortDate(project.created)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <IconButton>
                    <Download />
                  </IconButton>
                  <IconButton>
                    <Delete />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
