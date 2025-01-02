"use client";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useApi } from "../api";
import { Project } from "../models";

export default function NewProjectPage() {
  const api = useApi();
  const router = useRouter();
  const [name, setName] = useState("");
  const [directory, setDirectory] = useState("");
  const [customDirectory, setCustomDirectory] = useState(false);
  const { data: projects } = api.get<Project[]>("projects");

  function createProject() {
    const body = { name: name };
    api.post<Project>("projects", body).then((project) => {
      router.push(`/project/${project.id}`);
    });
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
    if (!customDirectory) {
      setDirectory(`/home/user/CCP4X_PROJECTS/${event.target.value}`);
    }
  }

  function handleDirectoryChange() {}

  let nameError = "";
  if (name.length === 0) nameError = "Name is required";
  else if (!name.match("^[A-z0-9_-]+$"))
    nameError =
      "Name can only contain letters, numbers, underscores, and hyphens";
  else if (projects?.find((p) => p.name === name))
    nameError = "Name is already taken";

  return (
    <Container maxWidth="sm" sx={{ my: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h4">New Project</Typography>
        <TextField
          label="Name"
          value={name}
          onChange={handleNameChange}
          required
          error={nameError.length > 0}
          helperText={nameError}
        />
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Button variant="outlined" onClick={handleDirectoryChange}>
            Change Directory
          </Button>
          <Typography variant="body1">{directory}</Typography>
        </Stack>
        {/* <Typography variant="h6">Tags</Typography> */}
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createProject}
            disabled={nameError.length > 0}
          >
            Create
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
