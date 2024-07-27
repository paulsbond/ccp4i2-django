"use client";
import { Button, Stack } from "@mui/material";
import { Add, Upload } from "@mui/icons-material";
import { get } from "./api";
import { shortDate } from "./pipes";

class Project {
  constructor(
    public id: number,
    public uuid: string,
    public name: string,
    public created: Date
  ) {}
}

export default function ProjectsPage() {
  const projects = get<Project[]>("projects");

  if (!projects) return <p>Loading...</p>;

  function addProject() {
    console.log("Add project");
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
      <Stack>
        {projects.map((project: Project) => (
          <div key={project.id}>
            {shortDate(project.created)} {project.name}
          </div>
        ))}
      </Stack>
    </Stack>
  );
}
