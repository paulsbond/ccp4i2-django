"use client";
import React, { PropsWithChildren, useContext } from "react";
import {
  Button,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useApi } from "../api";
import { Cancel, Check, Folder, Upload } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CCP4i2Context } from "../app-context";
import { VisuallyHiddenInput } from "./task/task-elements/input-file-upload";

export const ImportProjectContent: React.FC = () => {
  const api = useApi();
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      // Handle the form data as needed (e.g., send it to an API)
      console.log("Files selected:", files);
      api
        .post<any>("/projects/import_project/", formData)
        .then((response) => {
          console.log("Files uploaded successfully:", response.data);
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
        height: "100vh", // Full viewport height
        margin: 0, // Remove default margin
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={2} direction="row">
          <Button component="label" variant="contained" startIcon={<Upload />}>
            <VisuallyHiddenInput type="file" multiple onChange={onChange} />
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};
