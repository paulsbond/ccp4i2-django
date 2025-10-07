import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import { Download, Close, CheckCircle } from "@mui/icons-material";
import useSWR from "swr";
import { swrFetcher } from "../api-fetch";
import { ProjectExport } from "../types/models";
import { useCCP4i2Window } from "../app-context";
import { useProject } from "../utils";

interface ProjectExportsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ProjectExportsDialog: React.FC<ProjectExportsDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    data: exports,
    error,
    isLoading,
  } = useSWR<ProjectExport[]>(
    open ? "/api/proxy/projectexports/" : null,
    swrFetcher
  );
  const { projectId } = useCCP4i2Window();
  const { directory } = useProject(projectId || 0);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDownload = (exportItem: ProjectExport) => {
    // Create a download link for the export file
    const downloadUrl = `/api/proxy/projectexports/${exportItem.id}/download/`;
    const link = document.createElement("a");
    const projectName =
      typeof exportItem.project === "object"
        ? exportItem.project.name
        : `project_${exportItem.project}`;
    link.href = downloadUrl;
    link.download = `${projectName}_export_${new Date(exportItem.time).toISOString().slice(0, 19).replace(/:/g, "")}.ccp4_project.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Project Exports
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isLoading && <LinearProgress />}
        {error && <div>Error loading exports</div>}
        {exports && exports.length === 0 && <div>No exports found</div>}
        {exports && exports.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Export Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exports.map((exportItem) => (
                <TableRow key={exportItem.id}>
                  <TableCell>
                    {exportItem.file_exists && (
                      <CheckCircle
                        sx={{ color: "green", mr: 1, fontSize: "1rem" }}
                      />
                    )}
                    {typeof exportItem.project === "object"
                      ? exportItem.project.name
                      : `Project ${exportItem.project}`}
                  </TableCell>
                  <TableCell>{formatDateTime(exportItem.time)}</TableCell>
                  <TableCell>
                    <Tooltip title="Download export">
                      <IconButton onClick={() => handleDownload(exportItem)}>
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
