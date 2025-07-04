import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import Store from "electron-store";
import detectPort from "detect-port";
import { fileURLToPath } from "node:url";
import { startNextServer } from "./ccp4i2-next-server";
import { installIpcHandlers } from "./ccp4i2-ipc";
import { Server } from "node:http";
import { installWillDownloadHandler } from "./ccp4i2-session";
import { StoreSchema } from "../types/store";
import { createWindow } from "./ccp4i2-create-window";
import { addNewWindowMenuItem } from "./ccp4i2-menu";
import { setupZoomLevel } from "./ccp4i2-zoom";
import os from "os";

const isDev = !app.isPackaged; // ✅ Works in compiled builds

// Change the current working directory to the Resources folder
if (!isDev) {
  const asarDir = app.getAppPath();
  const resourcesDir = path.resolve(asarDir, ".."); // Resolve the parent directory of the app.asar file
  // Change the working directory to the Resources folder where .next is
  process.chdir(resourcesDir);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getProjectsDir = () => {
  const homeDir = os.homedir();
  const isWindows = process.platform === "win32";
  return isWindows
    ? path.join(homeDir, "ccp4x", "CCP4X_PROJECTS")
    : path.join(homeDir, ".ccp4x", "CCP4X_PROJECTS");
};

const store = new Store<StoreSchema>({
  defaults: {
    CCP4Dir: "/Applications/CCP4-9",
    devMode: false,
    zoomLevel: -2,
    CCP4I2_PROJECTS_DIR: getProjectsDir(),
  },
});

let mainWindow: BrowserWindow | null = null;
let nextServerPort: number | null = null;
let nextServer: Server | null = null;
let djangoServerPort: number | null = null;
let djangoServer: any | null = null;

const setDjangoServer = (server) => {
  if (djangoServer) {
    djangoServer.kill();
  }
  djangoServer = server;
};

const getMainWindow = () => {
  if (mainWindow) {
    return mainWindow;
  } else {
    console.error("getMainWindow: Main window is not available");
    return null;
  }
};

app
  .whenReady()
  .then(async () => {
    nextServerPort = await detectPort(3000);
    djangoServerPort = await detectPort(nextServerPort + 1);
    installIpcHandlers(
      ipcMain,
      getMainWindow,
      store,
      djangoServerPort,
      nextServerPort,
      isDev,
      setDjangoServer
    );
    installWillDownloadHandler(session.defaultSession);
    addNewWindowMenuItem(nextServerPort);
    setupZoomLevel(store);
    process.env.BACKEND_URL = `http://localhost:${djangoServerPort}`;
    nextServer = await startNextServer(isDev, nextServerPort, djangoServerPort);
  })
  .then(async () => {
    mainWindow = await createWindow(
      `http://localhost:${nextServerPort}/config`,
      store
    );
    console.log({
      CCP4Dir: store.get("CCP4Dir"),
      djangoServerPort,
      nextServerPort,
    });
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  nextServer?.close();
  djangoServer?.kill();
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = await createWindow(
      `http://localhost:${nextServerPort}`,
      store
    );
  }
});
