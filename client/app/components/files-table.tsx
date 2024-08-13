"use client";
import {
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useApi } from "../api";
import { File, Project } from "../models";
import { fileSize } from "../pipes";

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
          <TableCell>URL</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files?.map((file: File) => (
          <TableRow key={file.id}>
            <TableCell>{file.name}</TableCell>
            <TableCell>{fileSize(file.size)}</TableCell>
            <TableCell>
              <a href={file.file}>{file.file}</a>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
