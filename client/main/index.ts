import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { existsSync } from "node:fs";
import Express from "express";
import Store from "electron-store";
import detectPort from "detect-port";
import { fileURLToPath } from "node:url";
import { startNextServer } from "./ccp4i2-next-server";
import { startDjangoServer } from "./ccp4i2-django-server";
import { platform } from "node:os";

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
    process.env.BACKEND_URL = `http://localhost:${djangoServerPort}`;
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

app.on("before-quit", () => {
  if (nextServer) {
    nextServer = null;
  }
  djangoServer?.kill();
  djangoServer = null;
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = await createWindow(nextServerPort);
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
        event.reply("message-from-main", {
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
          },
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
  event.reply("message-from-main", {
    message: "start-uvicorn",
    status: "Success",
  });
});

// IPC communication to trigger file dialog to locate a valid CCP4 directory
ipcMain.on("get-config", (event, data) => {
  console.log("get-config", data);
  const ccp4_python =
    platform() === "win32" ? "ccp4-python.bat" : "ccp4-python";
  console.log("ccp4_python", ccp4_python);
  event.reply("message-from-main", {
    message: "get-config",
    status: "Success",
    config: {
      CCP4Dir: {
        path: store.get("CCP4Dir"),
        exists: existsSync(store.get("CCP4Dir")),
      },
      CCP4Python: {
        path: path.join(store.get("CCP4Dir"), "bin", ccp4_python),
        exists: existsSync(path.join(store.get("CCP4Dir"), "bin", ccp4_python)),
      },
      UVICORN_PORT: djangoServerPort,
      NEXT_PORT: nextServerPort,
    },
  });
});
