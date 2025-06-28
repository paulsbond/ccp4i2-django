"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Stack from "@mui/material/Stack";

export default function HistoryToolbar(props) {
  const router = useRouter();

  return (
    <Toolbar>
      <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
        <IconButton
          aria-label="Back"
          onClick={() => router.back()}
          size="large"
        >
          <ArrowBackIcon />
        </IconButton>
        <IconButton
          aria-label="Forward"
          onClick={() => router.forward()}
          size="large"
        >
          <ArrowForwardIcon />
        </IconButton>
      </Stack>
      {props.children}
    </Toolbar>
  );
}
