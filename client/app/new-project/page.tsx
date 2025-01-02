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

  function createProject() {
    const body = { name: name };
    api.post<Project>("projects", body).then((project) => {
      router.push(`/project/${project.id}`);
    });
  }

  let nameError = "";
  if (name.length === 0) nameError = "Name is required";
  else if (!name.match("^[A-z0-9_-]+$"))
    nameError =
      "Name can only contain letters, numbers, underscores, and hyphens";

  return (
    <Container sx={{ my: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h4">New Project</Typography>
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          error={nameError.length > 0}
          helperText={nameError}
        />
        <Stack direction="row" sx={{ gap: 2 }}>
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
