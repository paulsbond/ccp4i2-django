import { useContext, useEffect, useMemo } from "react";
import { Job, Project } from "../types/models";
import { useProject } from "../utils";
import { useApi } from "../api";
import { FilePreviewContext } from "../providers/file-preview-context";
import { useFileSystemFileBrowser } from "../providers/file-system-file-browser-context";
import DirectoryBrowser, { FileSystemItem } from "./directory-browser";
import { FileSystemFileMenu } from "./file-system-file-menu";
import { LinearProgress } from "@mui/material";

interface JobDirectoryViewProps {
  job: Job;
  project: Project;
}
export const JobDirectoryView = ({ job, project }) => {
  const { directory } = useProject(project.id);

  const api = useApi();
  const { contentSpecification, setContentSpecification } =
    useContext(FilePreviewContext);

  const {
    anchorEl,
    menuNode,
    previewNode,
    openMenu,
    closeMenu,
    setPreviewNode,
  } = useFileSystemFileBrowser();

  const onMenuOpen = (item: FileSystemItem, element: HTMLElement) => {
    // Capture the position immediately while the element is still valid
    const rect = element.getBoundingClientRect();

    // Always create a stable virtual anchor to avoid DOM removal issues
    const virtualAnchor = document.createElement("div");
    virtualAnchor.style.position = "fixed";
    virtualAnchor.style.top = `${rect.bottom}px`;
    virtualAnchor.style.left = `${rect.left}px`;
    virtualAnchor.style.width = "1px";
    virtualAnchor.style.height = "1px";
    virtualAnchor.style.pointerEvents = "none";
    virtualAnchor.style.visibility = "hidden";
    virtualAnchor.style.zIndex = "9999";
    virtualAnchor.id = "file-menu-anchor";

    // Add to DOM immediately
    document.body.appendChild(virtualAnchor);

    // Use the virtual anchor instead of the original element
    openMenu(virtualAnchor, item);
  };

  // Clean up virtual anchor when component unmounts or menu closes
  const handleMenuClose = () => {
    const existing = document.getElementById("file-menu-anchor");
    if (existing && document.body.contains(existing)) {
      document.body.removeChild(existing);
    }

    closeMenu();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const existing = document.getElementById("file-menu-anchor");
      if (existing && document.body.contains(existing)) {
        document.body.removeChild(existing);
      }
    };
  }, []);

  const directoryData = useMemo(() => {
    console.log(directory.container);
    if (!directory || !job || !directory.container) {
      return null;
    }
    let dirNode = directory.container.find(
      (item: any) => item.name === "CCP4_JOBS"
    );
    if (!dirNode) return [];
    const jobNumberElements = job.number.split(".").reverse();
    let cumulativePath: string = dirNode.path;
    while (jobNumberElements.length > 0) {
      const jobNumber = jobNumberElements.pop();
      dirNode = dirNode.contents.find(
        (item: any) => item.name === `job_${jobNumber}`
      );
      cumulativePath += `/job_${jobNumber}`;
      console.log({ cumulativePath });
      if (!dirNode) {
        return null;
      }
      if (jobNumberElements.length === 0) {
        return dirNode.contents.map((item: FileSystemItem) => {
          return { ...item, path: item.path.slice(cumulativePath.length) };
        });
      }
    }
  }, [job, project, directory]);

  return directory ? (
    <>
      <DirectoryBrowser
        onMenuOpen={onMenuOpen}
        directoryTree={directoryData || []}
      />
      <FileSystemFileMenu onClose={handleMenuClose} />
    </>
  ) : (
    <LinearProgress />
  );
};
