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
import { Cancel, Check, Folder } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CCP4i2Context } from "../app-context";

export const ConfigContent: React.FC = () => {
  const api = useApi();
  const [config, setConfig] = useState<any | null>(null);
  const router = useRouter();
  const { devMode, setDevMode } = useContext(CCP4i2Context);

  useEffect(() => {
    // Send a message to the main process to get the config
    if (window.electronAPI) {
      window.electronAPI.sendMessage("get-config");
      // Listen for messages from the main process
      window.electronAPI.onMessage(
        "message-from-main",
        (event: any, data: any) => {
          if (data.message === "get-config") {
            setConfig(data.config);
            setDevMode(data.config.devMode);
          } else if (data.message === "start-uvicorn") {
            router.push("/");
          }
        }
      );
    } else console.log("window.electron is not available");
  }, []);

  const onLaunchBrowser = async () => {
    if (!window.electronAPI) {
      console.error("Electron API is not available");
      return;
    }
    console.log("Gonna send locate-ccp4");
    console.log(window.electronAPI);
    window.electronAPI.sendMessage("locate-ccp4");
  };

  const onStartUvicorn = async () => {
    if (!window.electronAPI) {
      console.error("Electron API is not available");
      return;
    }

    window.electronAPI.sendMessage("start-uvicorn", {
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
        height: "calc(100vh - 5rem)", // Full viewport height
        margin: 0, // Remove default margin
      }}
    >
      <Stack spacing={2}>
        {config && (
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell variant="head"> </TableCell>
                <TableCell variant="head"> </TableCell>
                <TableCell variant="head">Exists ?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell variant="head">CCP4Dir</TableCell>
                <TableCell variant="body">{config.CCP4Dir.path}</TableCell>
                <TableCell variant="body">
                  {config.CCP4Dir.exists ? <Check /> : <Cancel />}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">CCP4Python</TableCell>
                <TableCell variant="body">{config.CCP4Python.path}</TableCell>
                <TableCell variant="body">
                  {config.CCP4Python.exists ? <Check /> : <Cancel />}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">CCP4I2_PROJECTS_DIR</TableCell>
                <TableCell variant="body" colSpan={3}>
                  {config.CCP4I2_PROJECTS_DIR}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">NEXT Port</TableCell>
                <TableCell variant="body" colSpan={3}>
                  {config.NEXT_PORT}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">Uvicorn Port</TableCell>
                <TableCell variant="body" colSpan={3}>
                  {config.UVICORN_PORT}
                </TableCell>
              </TableRow>
            </TableBody>
            <TableRow>
              <TableCell variant="head">Dev. mode</TableCell>
              <TableCell variant="body" colSpan={3}>
                {devMode ? <Check /> : <Cancel />}
              </TableCell>
            </TableRow>
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
