"use client";
import {
  Container,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useApi } from "../../api";
import { Project } from "../../models";
import FileUpload from "../../components/file-upload";
import { ChangeEvent } from "react";

export default function DashboardPage({ params }: { params: { id: string } }) {
  const api = useApi();
  const project = api.get<Project>(`projects/${params.id}`);

  function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (fileList) {
      for (let i = 0; i < fileList.length; i++) {
        // TODO
      }
    }
  }

  if (!project) return <LinearProgress />;
  return (
    <Stack spacing={2}>
      <Container>
        <Typography variant="h4" component="h1">
          {project.name}
        </Typography>
        <Toolbar disableGutters>
          <FileUpload text="Import Files" onChange={importFiles} />
        </Toolbar>
      </Container>
    </Stack>
  );
}
