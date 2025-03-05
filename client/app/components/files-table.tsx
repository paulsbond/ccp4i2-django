import {
  Avatar,
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
import { useMemo } from "react";

export const fileTypeMapping: any = {
  "application/CCP4-mtz-observed": "ObsDataFile",
  "application/CCP4-mtz-freerflag": "FreeRDataFile",
  "application/CCP4-mtz-map": "MapCoeffsDataFile",
  "application/CCP4-mtz-phases": "PhsDataFile",
  "application/refmac-dictionary": "DictDataFile",
  "application/coot-script": "CootHistoryDataFile",
  "application/CCP4-unmerged-experimental": "UnmergedDataFile",
  "chemical/x-pdb": "PdbDataFile",
  "application/CCP4-asu-content": "AsuDataFile",
};

export default function FilesTable({
  files,
  mutate,
}: {
  files: File[] | undefined;
  mutate: KeyedMutator<File[]>;
}) {
  const deleteDialog = useDeleteDialog();
  const api = useApi();
  const fileTypeIcon = (type: string) => {
    return Object.keys(fileTypeMapping).includes(type)
      ? fileTypeMapping[type]
      : "ccp4";
  };

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
          <TableCell>Type</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Size</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files.map((file: File) => (
          <TableRow key={file.id}>
            <TableCell title={file.type}>
              <Avatar
                src={`/qticons/${fileTypeIcon(file.type)}.png`}
                sx={{ height: "1.5rem", width: "1.5rem" }}
              />
            </TableCell>
            <TableCell>{file.name}</TableCell>
            {/*<TableCell>{fileSize(file.size)}</TableCell>*/}
            <TableCell>
              {/*<Tooltip title="Export file">
                <IconButton href={file.file} download>
                  <Download />
                </IconButton>
              </Tooltip>*/}
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
