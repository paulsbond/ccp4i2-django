"use client";
import {
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useApi } from "../api";
import { File, Project } from "../models";
import { fileSize } from "../pipes";
import { Delete, Download } from "@mui/icons-material";

export default function FilesTable({ project }: { project: Project }) {
  const api = useApi();
  const files = api.get<File[]>(`files?project=${project.id}`);

  if (files === undefined) return <LinearProgress />;
  if (files.length === 0) return <></>;
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Size</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files?.map((file: File) => (
          <TableRow key={file.id}>
            <TableCell>{file.name}</TableCell>
            <TableCell>{fileSize(file.size)}</TableCell>
            <TableCell>
              <Tooltip title="Export file">
                <IconButton href={file.file} download>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete file">
                <IconButton>
                  <Delete />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
