import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import Store from "electron-store";
import detectPort from "detect-port";
import { fileURLToPath } from "node:url";
import { startNextServer } from "./ccp4i2-next-server";
import { startDjangoServer } from "./ccp4i2-django-server";

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
const store = new Store({ defaults: { theme: "light" } });

let mainWindow: BrowserWindow | null = null;
let nextServerPort: number | null = null;
let nextServer: any | null = null;
let djangoServerPort: number | null = null;
let djangoServer: any | null = null;

const createWindow = async (port) => {
  const newWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setTimeout(() => newWindow?.loadURL(`http://localhost:${port}/config`), 1500);
};

app
  .whenReady()
  .then(async () => {
    nextServerPort = await detectPort(3000);
    nextServer = await startNextServer(isDev, nextServerPort);
    djangoServerPort = await detectPort(nextServerPort + 1);
    djangoServer = await startDjangoServer(
      "/Applications/ccp4-9",
      djangoServerPort,
      nextServerPort
    );
  })
  .then(() => {
    createWindow(nextServerPort);
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handler for preferences
ipcMain.handle("get-theme", () => store.get("theme"));
ipcMain.handle("set-theme", (_e, value) => store.set("theme", value));
