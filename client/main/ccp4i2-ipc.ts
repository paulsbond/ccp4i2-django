import { BrowserWindow } from "electron";
import { startDjangoServer } from "./ccp4i2-django-server";
import { platform } from "node:os";
import Store from "electron-store";
import { dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import { StoreSchema } from "../types/store";

/**
 * Installs IPC handlers for communication between the Electron main process and renderer processes.
 *
 * @param ipcMain - The Electron IpcMain instance used to listen for IPC events.
 * @param getMainWindow - A function that returns the main BrowserWindow instance or null if unavailable.
 * @param store - An instance of the Electron Store used to persist application state.
 * @param djangoServerPort - The port number for the Django server.
 * @param nextServerPort - The port number for the Next.js server.
 * @param isDev - A boolean indicating whether the application is running in development mode.
 * @param setDjangoServer - A function to set the Django server process instance.
 *
 * @remarks
 * This function sets up various IPC event listeners to handle tasks such as:
 * - Locating the CCP4 directory.
 * - Checking if a file exists.
 * - Selecting a directory for CCP4I2 projects.
 * - Starting the Uvicorn (Django) server.
 * - Retrieving the current configuration.
 * - Toggling developer mode.
 * - Adjusting zoom levels (zoom in, zoom out, reset).
 *
 * Each IPC event listener performs specific actions and replies to the renderer process with the results.
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
    const ccp4_python = path.join(
      store.get("CCP4Dir") || "",
      "bin",
      platform() === "win32" ? "ccp4-python.bat" : "ccp4-python"
    );
    const config: any = store.store; // Retrieve all values from the electron-store
    config.ccp4_python = ccp4_python;
    config.UVICORN_PORT = djangoServerPort;
    config.NEXT_PORT = nextServerPort;
    console.log("get-config", config);
    return {
      message: "get-config",
      status: "Success",
      config,
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

  ipcMain.on("zoom-in", (event, data) => {
    console.log("Zooming in", data);
    BrowserWindow.getAllWindows().forEach((win) => {
      const current = win.webContents.getZoomLevel();
      win.webContents.setZoomLevel(current + 1);
      store.set("zoomLevel", current + 1);
    });
  });

  ipcMain.on("zoom-out", (event, data) => {
    console.log("Zooming out", data);
    BrowserWindow.getAllWindows().forEach((win) => {
      const current = win.webContents.getZoomLevel();
      win.webContents.setZoomLevel(current - 1);
      store.set("zoomLevel", current - 1);
    });
  });

  ipcMain.on("zoom-reset", (event, data) => {
    console.log("Zooming in", data);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.setZoomLevel(0);
      store.set("zoomLevel", 0);
    });
  });

  ipcMain.on("check-requirements", (event, data) => {
    const ccp4_python =
      process.platform === "win32" ? "ccp4-python.bat" : "ccp4-python";
    const ccp4Dir = store.get("CCP4Dir") || "";
    const ccp4PythonPath = path.join(ccp4Dir, "bin", ccp4_python);
    console.log("In check-requirements", ccp4PythonPath);
    // Try to import rest_framework using ccp4-python
    const child = spawn(ccp4PythonPath, ["-c", "import rest_framework"], {
      stdio: "ignore",
    });

    child.on("exit", (code: number) => {
      if (code === 0) {
        event.reply("message-from-main", { message: "requirements-exist" });
      } else {
        event.reply("message-from-main", { message: "requirements-missing" });
      }
    });

    child.on("error", () => {
      event.reply("message-from-main", { message: "requirements-missing" });
    });
  });

  ipcMain.on("install-requirements", (event, data) => {
    const ccp4_python =
      process.platform === "win32" ? "ccp4-python.bat" : "ccp4-python";
    const ccp4Dir = store.get("CCP4Dir") || "";
    const ccp4PythonPath = path.join(ccp4Dir, "bin", ccp4_python);
    console.log("In install-requirements", ccp4PythonPath);

    // You may want to make requirements.txt path configurable or absolute
    const requirementsPath = isDev
      ? path.join(process.cwd(), "..", "server", "requirements.txt")
      : path.join(process.resourcesPath, "server", "requirements.txt");

    // Wrap in quotes to handle spaces
    const quotedRequirementsPath = `"${requirementsPath.replace(/\\/g, "/")}"`;

    const child = spawn(
      ccp4PythonPath,
      ["-m", "pip", "install", "-r", quotedRequirementsPath],
      { stdio: "inherit" }
    );

    child.on("exit", (code: number) => {
      console.log("Child process exited with code:", code);
      if (code === 0) {
        event.reply("message-from-main", {
          message: "requirements-exist",
        });
      } else {
        event.reply("message-from-main", {
          message: "requirements-missing",
        });
      }
    });

    child.on("error", () => {
      event.reply("message-from-main", {
        message: "requirements-install-failed",
      });
    });
  });
};
