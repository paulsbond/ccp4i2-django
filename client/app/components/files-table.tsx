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
import { Delete, Download } from "@mui/icons-material";
import { File } from "../models";
import { fileSize } from "../pipes";
import { useApi } from "../api";
import { useDeleteDialog } from "./delete-dialog";
import { KeyedMutator } from "swr";

export default function FilesTable({
  files,
  mutate,
}: {
  files: File[] | undefined;
  mutate: KeyedMutator<File[]>;
}) {
  const deleteDialog = useDeleteDialog();
  const api = useApi();

  if (files === undefined) return <LinearProgress />;
  if (files.length === 0) return <></>;

  function handleDelete(file: File) {
    if (deleteDialog)
      deleteDialog({
        type: "show",
        what: file.name,
        onDelete: () => {
          api.delete(`files/${file.id}`).then(() => mutate());
        },
      });
  }

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
        {files.map((file: File) => (
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
                <IconButton onClick={() => handleDelete(file)}>
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
