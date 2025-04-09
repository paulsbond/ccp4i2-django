import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { spawn } from "child_process";
import { ccp4_setup_windows } from "./ccp4i2-setup-windows.cjs";
import { ccp4_setup_sh } from "./ccp4i2-setup-sh.cjs";
import Store from "electron-store";

const store = new Store({ defaults: { theme: "light" } });

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await mainWindow.loadURL("http://localhost:3000");
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handler for preferences
ipcMain.handle("get-theme", () => store.get("theme"));
ipcMain.handle("set-theme", (_e, value) => store.set("theme", value));

let pythonProcess: any = null;
let CCP4Dir: string = "";
let ccp4_python: string = "ccp4-python";

// IPC communication to trigger file dialog to locate a valid CCP4 directory
ipcMain.on("locate-ccp4", (event, data) => {
  if (mainWindow) {
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
          CCP4Dir = result.filePaths[0];
          process.env.CCP4 = CCP4Dir;
        }
      });
  }
});

// IPC communication to trigger file dialog to locate a valid CCP4 directory
ipcMain.on("start-uvicorn", (event, data) => {
  console.log("start-uvicorn", data);
  const { CCP4Dir, UVICORN_PORT, NEXT_PORT } = data;
  startUvicorn(CCP4Dir, UVICORN_PORT, NEXT_PORT);
  event.reply("message-from-main", {
    message: "start-uvicorn",
    status: "Success",
  });
});

function startUvicorn(CCP4Dir, UVICORN_PORT, NEXT_PORT) {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform === "win32") {
    ccp4_setup_windows(CCP4Dir);
  } else {
    ccp4_setup_sh(CCP4Dir);
  }
  console.log(`🚀 Next.js running on http://localhost:${NEXT_PORT}`);
  const CCP4_PYTHON = path.join(process.env.CCP4 || "", "bin", ccp4_python);
  //.replace(/\\/g, "/");
  console.log({ CCP4_PYTHON });
  process.env.UVICORN_PORT = UVICORN_PORT;
  process.env.NEXT_ADDRESS = `http://localhost:${NEXT_PORT}`;
  //console.log(process.env);
  // 2️⃣ Start Python process with dynamic port
  pythonProcess = spawn(CCP4_PYTHON, ["-m", "uvicorn", "asgi:application"], {
    env: process.env,
    shell: true,
    //stdio: "inherit",
  });
  console.log(`🚀 Uvicorn running on http://localhost:${UVICORN_PORT}`);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`🐍 Python Output: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`🐍 Python Error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`🐍 Python process exited with code ${code}`);
  });
}
