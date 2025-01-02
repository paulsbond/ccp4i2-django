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

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function createProject() {
    const body = { name: name };
    api.post<Project>("projects", body).then((project) => {
      router.push(`/project/${project.id}`);
    });
  }

  return (
    <Container sx={{ my: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h4">New Project</Typography>
        <TextField value={name} label="Name" onChange={handleChange} />
        <Stack direction="row" sx={{ gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button variant="contained" onClick={createProject}>
            Create
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
