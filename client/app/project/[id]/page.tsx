"use client";
import { ChangeEvent, use } from "react";
import {
  CircularProgress,
  Container,
  Grid2,
  LinearProgress,
  Stack,
  Toolbar,
} from "@mui/material";
import { useApi } from "../../api";
import { File, Project } from "../../models";
import EditableTypography from "../../components/editable-typography";
import FilesTable from "../../components/files-table";
import FileUpload from "../../components/file-upload";
import { JobsGrid } from "../../components/jobs-grid";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const api = useApi();
  const { id } = use(params);
  const { data: project } = api.get<Project>(`projects/${id}`);
  return project ? (
    <Stack spacing={2}>
      <EditableTypography
        variant="h6"
        text={project.name}
        onDelay={(name) => api.patch(`projects/${project.id}`, { name: name })}
      />
      <Grid2>
        <JobsGrid projectId={parseInt(id)} size={4} />
      </Grid2>
    </Stack>
  ) : (
    <CircularProgress variant="indeterminate" />
  );
}
