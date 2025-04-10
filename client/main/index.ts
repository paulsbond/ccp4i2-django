import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import Express from "express";
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
const store = new Store({ defaults: { CCP4Dir: "/Applications/CCP4-9" } });

let mainWindow: BrowserWindow | null = null;
let nextServerPort: number | null = null;
let nextServer: Express.Express | null = null;
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
  return newWindow;
};

app
  .whenReady()
  .then(async () => {
    nextServerPort = await detectPort(3000);
    djangoServerPort = await detectPort(nextServerPort + 1);
    nextServer = await startNextServer(isDev, nextServerPort, djangoServerPort);
  })
  .then(async () => {
    mainWindow = await createWindow(nextServerPort);
    console.log({
      CCP4Dir: store.get("CCP4Dir"),
      djangoServerPort,
      nextServerPort,
    });
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    djangoServer?.kill();
  }
});

// IPC handler for preferences
ipcMain.handle("get-theme", () => store.get("theme"));
ipcMain.handle("set-theme", (_e, value) => store.set("theme", value));

// IPC communication to trigger file dialog to locate a valid CCP4 directory
ipcMain.on("locate-ccp4", (event, data) => {
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
        event.reply("message-from-main", {
          message: "locate-ccp4",
          status: "Success",
          CCP4Dir: result.filePaths[0],
        });
        const CCP4Dir = result.filePaths[0];
        process.env.CCP4 = CCP4Dir;
      }
    });
});

// IPC communication to trigger file dialog to locate a valid CCP4 directory
ipcMain.on("start-uvicorn", async (event, data) => {
  console.log("start-uvicorn", data);
  if (!djangoServerPort) return;
  if (!nextServerPort) return;
  djangoServer = await startDjangoServer(
    store.get("CCP4Dir"),
    djangoServerPort,
    nextServerPort
  );
});

// IPC communication to trigger file dialog to locate a valid CCP4 directory
ipcMain.on("get-config", (event, data) => {
  console.log("get-config", data);
  event.reply("message-from-main", {
    message: "get-config",
    status: "Success",
    config: {
      CCP4Dir: store.get("CCP4Dir"),
      UVICORN_PORT: djangoServerPort,
      NEXT_PORT: nextServerPort,
    },
  });
});
