"use client";
import React, { PropsWithChildren, useCallback, useContext } from "react";
import {
  Button,
  Container,
  FormControlLabel,
  Stack,
  Switch,
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
  const [existingFiles, setExistingFiles] = useState<any | null>(null);

  useEffect(() => {
    // Send a message to the main process to get the config
    if (window.electronAPI) {
      window.electronAPI.sendMessage("get-config");
      // Listen for messages from the main process

      window.electronAPI.onMessage("message-from-main", messageHandler);

      return () => {
        window.electronAPI.removeMessageListener(
          "message-from-main",
          messageHandler
        );
      };
    } else {
      console.log("window.electron is not available");
    }
  }, []);

  const messageHandler = useCallback(
    (event: any, data: any) => {
      if (data.message === "get-config") {
        setConfig(data.config);
        setDevMode(data.config.devMode);
      } else if (data.message === "start-uvicorn") {
        router.push("/");
      } else if (data.message === "check-file-exists") {
        if (config) {
          if (data.path === config.CCP4I2_PROJECTS_DIR) {
            setExistingFiles((prevState: any) => ({
              ...prevState,
              CCP4I2_PROJECTS_DIR: data.exists,
            }));
          }
          if (data.path === config.CCP4Dir) {
            setExistingFiles((prevState: any) => ({
              ...prevState,
              CCP4Dir: data.exists,
            }));
          }
          if (data.path === config.ccp4_python) {
            setExistingFiles((prevState: any) => ({
              ...prevState,
              ccp4_python: data.exists,
            }));
          }
        }
      }
    },
    [config]
  );

  useEffect(() => {
    if (config) {
      window.electronAPI.removeMessageListener(
        "message-from-main",
        messageHandler
      );
      window.electronAPI.onMessage("message-from-main", messageHandler);
      if (typeof window !== "undefined" && window.electronAPI) {
        window.electronAPI.sendMessage("check-file-exists", {
          path: config.CCP4I2_PROJECTS_DIR,
        });
        window.electronAPI.sendMessage("check-file-exists", {
          path: config.CCP4Dir,
        });
        window.electronAPI.sendMessage("check-file-exists", {
          path: config.ccp4_python,
        });
      }
    }
    return () => {
      window.electronAPI.removeMessageListener(
        "message-from-main",
        messageHandler
      );
    };
  }, [config]);

  const onLaunchBrowser = async () => {
    if (!window?.electronAPI) {
      console.error("Electron API is not available");
      return;
    }
    console.log("Gonna send locate-ccp4");
    console.log(window.electronAPI);
    window.electronAPI.sendMessage("locate-ccp4");
  };

  const onSelectProjectsDir = async () => {
    if (!window.electronAPI) {
      console.error("Electron API is not available");
      return;
    }
    console.log("Gonna send locate-ccp4");
    console.log(window.electronAPI);
    window.electronAPI.sendMessage("locate-ccp4i2-project-directory");
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

  const onToggleDevMode = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!window?.electronAPI) {
      console.error("Electron API is not available");
      return;
    }
    window.electronAPI.sendMessage("toggle-dev-mode", {});
    ev.preventDefault();
    ev.stopPropagation();
  };

  return (
    <Container>
      <Stack spacing={2}>
        {config && (
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableBody>
              <TableRow>
                <TableCell variant="head">CCP4Dir</TableCell>
                <TableCell variant="body">{config.CCP4Dir}</TableCell>
                <TableCell variant="body">
                  {existingFiles?.CCP4Dir ? <Check /> : <Cancel />}
                </TableCell>
                <TableCell variant="body">
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<Folder />}
                    onClick={onLaunchBrowser}
                    sx={{ minWidth: 320 }}
                  >
                    Select...
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">CCP4Python</TableCell>
                <TableCell variant="body">{config.ccp4_python}</TableCell>
                <TableCell variant="body">
                  {existingFiles?.ccp4_python ? <Check /> : <Cancel />}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">CCP4I2_PROJECTS_DIR</TableCell>
                <TableCell variant="body">
                  {config.CCP4I2_PROJECTS_DIR}
                </TableCell>
                <TableCell variant="body">
                  {existingFiles?.CCP4I2_PROJECTS_DIR ? <Check /> : <Cancel />}
                </TableCell>
                <TableCell variant="body">
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<Folder />}
                    onClick={onSelectProjectsDir}
                    sx={{ minWidth: 320 }}
                  >
                    Select...
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">NEXT Port</TableCell>
                <TableCell
                  variant="body"
                  colSpan={3}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  {config.NEXT_PORT}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">Uvicorn Port</TableCell>
                <TableCell
                  variant="body"
                  colSpan={3}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  {config.UVICORN_PORT}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell variant="head">Dev. mode</TableCell>
                <TableCell
                  variant="body"
                  colSpan={3}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={devMode}
                        onChange={onToggleDevMode}
                        name="devModeToggle"
                        color="warning"
                      />
                    }
                    label="Dev Mode"
                  />
                </TableCell>
                <TableCell variant="body">
                  <Button />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
        <Stack spacing={2} direction="row">
          <Button
            key="start-uvicorn"
            component="label"
            variant="contained"
            startIcon={<Folder />}
            onClick={onStartUvicorn}
            sx={{ minWidth: 320 }}
            disabled={!existingFiles?.ccp4_python}
          >
            Launch CCP4i2
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};
