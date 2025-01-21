"use client";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Container,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Folder } from "@mui/icons-material";
import { useApi } from "../api";
import { Project } from "../models";
import EditTags from "../components/edit-tags";

export default function NewProjectPage() {
  const api = useApi();
  const router = useRouter();
  const [name, setName] = useState("");
  const [customDirectory, setCustomDirectory] = useState(false);
  const [directory, setDirectory] = useState(defaultDirectory(""));
  const [tags, setTags] = useState<number[]>([]);
  const { data: projects } = api.get<Project[]>("projects");

  function createProject() {
    const body = { name: name };
    api.post<Project>("projects", body).then((project) => {
      router.push(`/project/${project.id}`);
    });
  }

  function defaultDirectory(name: string) {
    return `/home/user/CCP4X_PROJECTS/${name}`;
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
    if (!customDirectory) {
      setDirectory(defaultDirectory(event.target.value));
    }
  }

  function handleCustomDirectoryChange(
    event: React.MouseEvent<HTMLElement>,
    value: any
  ) {
    if (value !== null) {
      setCustomDirectory(value);
      setDirectory(defaultDirectory(name));
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

  let directoryError = "";
  if (customDirectory && directory.length === 0)
    directoryError = "Directory is required";

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
        <ToggleButtonGroup
          exclusive
          value={customDirectory}
          onChange={handleCustomDirectoryChange}
          fullWidth
        >
          <ToggleButton value={false}>Default Directory</ToggleButton>
          <ToggleButton value={true}>Custom Directory</ToggleButton>
        </ToggleButtonGroup>
        {customDirectory && (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <TextField
              label="Directory"
              value={directory}
              onChange={(event) => setDirectory(event.target.value)}
              error={directoryError.length > 0}
              helperText={directoryError}
              sx={{ flexGrow: 1 }}
              required
            />
            <Button
              variant="outlined"
              startIcon={<Folder />}
              onClick={handleDirectoryChange}
            >
              Select
            </Button>
          </Stack>
        )}
        <EditTags tags={tags} onChange={setTags} />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createProject}
            disabled={nameError.length > 0 || directoryError.length > 0}
          >
            Create
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
