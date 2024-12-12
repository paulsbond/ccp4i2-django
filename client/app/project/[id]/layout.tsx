"use client";
import { ReactNode, use } from "react";
import { Box } from "@mui/material";
import { useApi } from "../../api";
import { Project } from "../../models";
import Nav from "../../components/nav";

export default function ProjectLayout({
  children,
  params,
}: {
  children?: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const api = useApi();
  const { id } = use(params);
  const { data: project } = api.get<Project>(`projects/${id}`);

  return (
    <>
      <Nav project={project} />
      <Box sx={{ my: 3 }}>{children}</Box>
    </>
  );
}
