"use client";
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
import { Cancel, Check, Folder } from "@mui/icons-material";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const ConfigContent = () => {
  const api = useApi();
  const { data: config, mutate: mutate } = api.config<any>();
  const router = useRouter();
  useEffect(() => {
    // Make sure window.electron is available
    if (window.electron) {
      // Listen for messages from the main process
      window.electron.onMessage(
        "message-from-main",
        (event: any, data: any) => {
          console.log(data);
          if (data.message === "locate-ccp4") {
            mutate();
          } else if (data.message === "start-uvicorn") {
            router.push("/");
          }
        }
      );
    }
  }, [config]);

  const onLaunchBrowser = async () => {
    window.electron.sendMessage("locate-ccp4");
  };

  const onStartUvicorn = async () => {
    window.electron.sendMessage("start-uvicorn", {
      ...config,
      CCP4Dir: config.CCP4Dir.path,
    });
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
        {config && (
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell variant="head"> </TableCell>{" "}
                <TableCell variant="head"> </TableCell>
                <TableCell variant="head">Exists ?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell variant="head">CCP4Dir</TableCell>{" "}
                <TableCell variant="body">{config.CCP4Dir.path}</TableCell>
                <TableCell variant="body">
                  {config.CCP4Dir.exists ? <Check /> : <Cancel />}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">CCP4Python</TableCell>{" "}
                <TableCell variant="body">{config.CCP4Python.path}</TableCell>
                <TableCell variant="body">
                  {config.CCP4Python.exists ? <Check /> : <Cancel />}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">NEXT Port</TableCell>{" "}
                <TableCell variant="body" colSpan={3}>
                  {config.NEXT_PORT}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">Uvicorn Port</TableCell>{" "}
                <TableCell variant="body" colSpan={3}>
                  {config.UVICORN_PORT}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
        <Stack spacing={2} direction="row">
          <Button
            component="label"
            variant="contained"
            startIcon={<Folder />}
            onClick={onLaunchBrowser}
            sx={{ minWidth: 320 }}
          >
            Browse to find CCP4
          </Button>
          <Button
            key="start-uvicorn"
            component="label"
            variant="contained"
            startIcon={<Folder />}
            onClick={onStartUvicorn}
            sx={{ minWidth: 320 }}
            disabled={!config?.CCP4Python.exists}
          >
            Launch CCP4i2
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};
