"use client";
import { useRouter } from "next/navigation";
import { Button, Toolbar, Tooltip } from "@mui/material";
import { Add, Upload } from "@mui/icons-material";
import { Project } from "../models";
import { post } from "../api";

export default function ProjectsToolbar() {
  const router = useRouter();

  function newProject() {
    post<Project>("projects").then((project) => {
      router.push(`/project/${project.id}`);
    });
  }

  function importProjects() {
    // TODO
  }

  return (
    <Toolbar sx={{ gap: 2 }}>
      <Tooltip title="Start a new project">
        <Button variant="contained" startIcon={<Add />} onClick={newProject}>
          New
        </Button>
      </Tooltip>
      <Tooltip title="Import existing projects">
        <Button
          variant="outlined"
          startIcon={<Upload />}
          onClick={importProjects}
        >
          Import
        </Button>
      </Tooltip>
    </Toolbar>
  );
}
