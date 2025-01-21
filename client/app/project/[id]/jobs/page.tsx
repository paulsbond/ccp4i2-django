"use client";
import { use } from "react";
import { Container, LinearProgress } from "@mui/material";
import { JobsGrid } from "../../../components/jobs-grid";
import { Project } from "../../../models";
import { useApi } from "../../../api";

export default function JobsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const api = useApi();
  const { data: project } = api.get<Project>(`projects/${id}`);
  if (!project) return <LinearProgress />;
  return (
    <Container>
      <JobsGrid projectId={parseInt(id)} size={12} />
    </Container>
  );
}
