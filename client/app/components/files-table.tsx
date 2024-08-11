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

export default function ProjectsTable({ project }: { project: Project }) {
  const api = useApi();
  const files = api.get<File[]>(`files?project=${project.id}`);

  if (files === undefined) return <LinearProgress />;
  if (files.length === 0) return <></>;
  console.log(files);
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>URL</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files?.map((file: File) => (
          <TableRow key={file.id}>
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
