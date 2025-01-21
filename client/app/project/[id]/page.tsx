"use client";
import { use } from "react";
import { CircularProgress, Stack } from "@mui/material";
import { useApi } from "../../api";
import { Project } from "../../models";
import EditableTypography from "../../components/editable-typography";

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
        variant="h4"
        text={project.name}
        onDelay={(name) => api.patch(`projects/${project.id}`, { name: name })}
      />
    </Stack>
  ) : (
    <CircularProgress variant="indeterminate" />
  );
}
