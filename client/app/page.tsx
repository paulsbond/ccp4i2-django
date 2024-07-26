"use client";
import { Button, Stack } from "@mui/material";
import { Add, Upload } from "@mui/icons-material";
import { useEffect, useState } from "react";

class Project {
  constructor(
    public id: number,
    public uuid: string,
    public name: string,
    public created: Date
  ) {}
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/projects")
      .then((response) => response.json())
      .then((data: Project[]) => {
        setProjects(data);
      });
  }, []);

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
        {projects.map((project) => (
          <div key={project.id}>{project.name}</div>
        ))}
      </Stack>
    </Stack>
  );
}
