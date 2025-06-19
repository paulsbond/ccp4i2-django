"use client";
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { Editor } from "@monaco-editor/react";
import { FileTree } from "./contexts/file-browser";
import { LinearProgress } from "@mui/material";
import { useProject } from "../utils";

interface CCP4i2DirectoryViewerProps {
  projectId: number;
}
export const CCP4i2DirectoryViewer: React.FC<CCP4i2DirectoryViewerProps> = ({
  projectId,
}) => {
  const api = useApi();

  const { directory } = useProject(projectId);

  return directory ? (
    <FileTree data={directory.container} />
  ) : (
    <LinearProgress />
  );
};
