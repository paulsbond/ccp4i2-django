"use client";
import React, { PropsWithChildren, useContext, useState } from "react";
import {
  Button,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useApi } from "../api";
import { Cancel, Check, Folder, Upload } from "@mui/icons-material";
import { VisuallyHiddenInput } from "./task/task-elements/input-file-upload";

export const ImportProjectContent: React.FC = () => {
  const api = useApi();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setFiles(files ? Array.from(files) : []);
    if (files) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      // Handle the form data as needed (e.g., send it to an API)
      setUploading(true);
      api
        .post<any>("/projects/import_project/", formData)
        .then((response) => {
          console.log("Files uploaded successfully:", response.data);
          setUploading(false);
        })
        .catch((error) => {
          console.error("Error uploading files:", error);
        });
    }
  };

  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "calc(100vh - 5rem)", // Full viewport height
        margin: 0, // Remove default margin
      }}
    >
      <Paper sx={{ padding: 2, minWidth: "50rem" }}>
        <Stack spacing={2}>
          <Typography variant="h4" gutterBottom>
            Import Project
          </Typography>
          <Stack spacing={2} direction="row">
            <Button
              component="label"
              variant="contained"
              startIcon={<Upload />}
            >
              <VisuallyHiddenInput type="file" multiple onChange={onChange} />
            </Button>
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Processing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Map through the files and display their names and statuses */}
              {/* Example static data for demonstration */}
              {files.map((aFile, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Folder /> {aFile.name}
                  </TableCell>
                  <TableCell>
                    {!uploading ? (
                      <Check color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </Paper>
    </Container>
  );
};
