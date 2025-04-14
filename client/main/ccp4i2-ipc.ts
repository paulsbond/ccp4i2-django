import { BrowserWindow } from "electron";
import { startDjangoServer } from "./ccp4i2-django-server";
import { platform } from "node:os";
import Store from "electron-store";
import { dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import { existsSync } from "node:fs";
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { StoreSchema } from "../types/store";
import { get } from "node:http";

/**
 * Sets up IPC handlers for Electron's `ipcMain` to manage communication between
 * the main process and renderer process. This function handles operations such as
 * locating a valid CCP4 directory, starting a Django server, and retrieving configuration
 * details.
 *
 * @param ipcMain - The Electron `IpcMain` instance used for inter-process communication.
 * @param mainWindow - The main `BrowserWindow` instance of the application, or `null` if unavailable.
 * @param store - A persistent store instance for managing application state.
 * @param djangoServerPort - The port number on which the Django server will run.
 * @param nextServerPort - The port number on which the Next.js server will run.
 * @param setDjangoServer - A callback function to set the running Django server instance.
 */
export const installIpcHandlers = (
  ipcMain: Electron.IpcMain,
  getMainWindow: () => BrowserWindow | null,
  store: Store<StoreSchema>,
  djangoServerPort: number,
  nextServerPort: number,
  isDev: boolean,
  setDjangoServer: (server: ChildProcessWithoutNullStreams) => void
) => {
  const getConfigResponse = () => {
    const ccp4_python =
      platform() === "win32" ? "ccp4-python.bat" : "ccp4-python";
    return {
      message: "get-config",
      status: "Success",
      config: {
        CCP4Dir: {
          path: store.get("CCP4Dir"),
          exists: existsSync(store.get("CCP4Dir")),
        },
        CCP4Python: {
          path: path.join(store.get("CCP4Dir"), "bin", ccp4_python),
          exists: existsSync(
            path.join(store.get("CCP4Dir"), "bin", ccp4_python)
          ),
        },
        UVICORN_PORT: djangoServerPort,
        NEXT_PORT: nextServerPort,
        devMode: store.get("devMode") || false,
        CCP4I2_PROJECTS_DIR: store.get("CCP4I2_PROJECTS_DIR") || "",
      },
    };
  };

  // IPC communication to trigger file dialog to locate a valid CCP4 directory
  ipcMain.on("locate-ccp4", (event, data) => {
    const mainWindow: BrowserWindow | null = getMainWindow();
    if (!mainWindow) {
      console.error("Main window is not available");
      return;
    }
    const ccp4_python =
      platform() === "win32" ? "ccp4-python.bat" : "ccp4-python";

    dialog
      .showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
      })
      .then((result) => {
        if (!result.canceled) {
          console.log("Selected directory:", result.filePaths);
          store.set("CCP4Dir", result.filePaths[0]);
          event.reply("message-from-main", getConfigResponse());
          const CCP4Dir = result.filePaths[0];
          process.env.CCP4 = CCP4Dir;
        }
      });
  });

  // IPC communication to trigger file dialog to select parent directory for new projects
  // and set the CCP4I2_PROJECTS_DIR in the store
  ipcMain.on("check-file-exists", (event, data) => {
    console.log("Checking for file-exists", data);
    event.reply("message-from-main", {
      message: "check-file-exists",
      path: data.path,
      exists: fs.existsSync(data.path),
    });
  });

  // IPC communication to trigger file dialog to select parent directory for new projects
  // and set the CCP4I2_PROJECTS_DIR in the store
  ipcMain.on("locate-ccp4i2-project-directory", (event, data) => {
    const mainWindow: BrowserWindow | null = getMainWindow();
    if (!mainWindow) {
      console.error("Main window is not available");
      return;
    }
    dialog
      .showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
      })
      .then((result) => {
        if (!result.canceled) {
          console.log("Selected directory:", result.filePaths);
          store.set("CCP4I2_PROJECTS_DIR", result.filePaths[0]);
          event.reply("message-from-main", getConfigResponse());
        }
      });
  });

  // IPC communication to trigger file dialog to start the uvicorn (django) server
  ipcMain.on("start-uvicorn", async (event, data) => {
    console.log("start-uvicorn", data);
    if (!djangoServerPort) return;
    if (!nextServerPort) return;
    const djangoServer = await startDjangoServer(
      store.get("CCP4Dir"),
      djangoServerPort,
      nextServerPort,
      isDev
    );
    setDjangoServer(djangoServer);
    event.reply("message-from-main", {
      message: "start-uvicorn",
      status: "Success",
    });
  });

  // IPC communication to prompt reply with current config response
  ipcMain.on("get-config", (event, data) => {
    console.log("get-config", data);
    const response = getConfigResponse();
    console.log("get-config response", response);
    event.reply("message-from-main", response);
  });

  // IPC communication to trigger file dialog to toggle the state of the developer mode
  ipcMain.on("toggle-dev-mode", (event, data) => {
    store.set("devMode", !store.get("devMode"));
    const ccp4_python =
      platform() === "win32" ? "ccp4-python.bat" : "ccp4-python";
    console.log("ccp4_python", ccp4_python, store.get("devMode"));
    event.reply("message-from-main", getConfigResponse());
  });
};
