"use client";
import { use } from "react";
import { CircularProgress, Skeleton, Stack } from "@mui/material";
import { useApi } from "../../api";
import { Project } from "../../models";
import EditableTypography from "../../components/editable-typography";
import { useProject } from "../../utils";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const api = useApi();
  const { id } = use(params);
  const { project } = useProject(parseInt(id));
  return project ? <Skeleton /> : <CircularProgress variant="indeterminate" />;
}
