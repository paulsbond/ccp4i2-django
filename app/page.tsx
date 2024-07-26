"use client";
import { Button, Stack } from "@mui/material";
import { Add, Upload } from "@mui/icons-material";

export default function ProjectsPage() {
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
    </Stack>
  );
}
