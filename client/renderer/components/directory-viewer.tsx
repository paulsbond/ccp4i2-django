"use client";
import { useApi } from "../api";
import { FileTree } from "../providers/file-browser";
import { LinearProgress } from "@mui/material";
import { useProject } from "../utils";
import { useEffect } from "react";

interface CCP4i2DirectoryViewerProps {
  projectId: number;
}
export const CCP4i2DirectoryViewer: React.FC<CCP4i2DirectoryViewerProps> = ({
  projectId,
}) => {
  const api = useApi();

  const { directory } = useProject(projectId);

  useEffect(() => {
    console.log(directory);
  }, [directory]);

  return directory ? (
    <FileTree data={directory.container} />
  ) : (
    <LinearProgress />
  );
};
