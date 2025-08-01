"use client";
import { useApi } from "../api";
import { LinearProgress } from "@mui/material";
import { useProject } from "../utils";
import { useContext, useEffect, useMemo } from "react";
import DirectoryBrowser from "./directory-browser";
import { useFileSystemFileBrowser } from "../providers/file-system-file-browser-context";
import { FileSystemFileMenu } from "./file-system-file-menu";

interface CCP4i2DirectoryViewerProps {
  projectId: number;
}

export const CCP4i2DirectoryViewer: React.FC<CCP4i2DirectoryViewerProps> = ({
  projectId,
}) => {
  const { directory } = useProject(projectId);
  const { closeMenu } = useFileSystemFileBrowser();

  // Clean up virtual anchor when component unmounts
  useEffect(() => {
    return () => {
      const existing = document.getElementById("file-menu-anchor");
      if (existing && document.body.contains(existing)) {
        document.body.removeChild(existing);
      }
    };
  }, []);

  // Handle cleanup when menu closes
  const handleMenuClose = () => {
    const existing = document.getElementById("file-menu-anchor");
    if (existing && document.body.contains(existing)) {
      document.body.removeChild(existing);
    }
    closeMenu();
  };

  return directory ? (
    <>
      <DirectoryBrowser directoryTree={directory.container || []} />
      <FileSystemFileMenu onClose={handleMenuClose} />
    </>
  ) : (
    <LinearProgress />
  );
};
