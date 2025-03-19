const { app, session, dialog, BrowserWindow } = require("electron");
const path = require("path");
const next = require("next");
const express = require("express");
const { spawn } = require("child_process");

const isDev = !app.isPackaged; // ✅ Works in compiled builds

const NEXT_PORT = 3000;
const PYTHON_SCRIPT = path.join(__dirname, "..", "server", "manage.py");
let pythonProcess = null;
let mainWindow;

// 1️⃣ Start the Next.js server
const nextApp = next({ dev: isDev });
const nextHandler = nextApp.getRequestHandler();
const CCP4_PYTHON = path.join(
  process.env.CCP4 || "/Applications/ccp4-9",
  "bin",
  "ccp4-python"
);

const env = Object.assign({}, process.env, {
  PYTHONPATH: path.join(__dirname, "..", "server"),
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      //contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Intercept window.open and create a new Electron window instead
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const newWin = new BrowserWindow({
      width: 800,
      height: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    newWin.loadURL(url);
    return { action: "deny" }; // Prevent default behavior
  });

  // Intercept downloads
  session.defaultSession.on("will-download", async (event, item) => {
    // Ask the user where to save the file
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save File",
      defaultPath: path.join(app.getPath("downloads"), item.getFilename()), // Default to Downloads folder
      buttonLabel: "Save",
    });

    if (filePath) {
      item.setSavePath(filePath); // Set the path where the file will be saved
    } else {
      item.cancel(); // Cancel the download if no path was chosen
    }
  });
};

nextApp.prepare().then(() => {
  const server = express();
  server.all("*", (req, res) => nextHandler(req, res));

  server.listen(NEXT_PORT, () => {
    console.log(`🚀 Next.js running on http://localhost:${NEXT_PORT}`);

    // 2️⃣ Start Python process
    //pythonProcess = spawn(CCP4_PYTHON, [PYTHON_SCRIPT, "runserver"]);
    pythonProcess = spawn(CCP4_PYTHON, ["-m", "uvicorn", "asgi:application"], {
      env,
    });

    pythonProcess.stdout.on("data", (data) => {
      console.log(`🐍 Python Output: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`🐍 Python Error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`🐍 Python process exited with code ${code}`);
    });

    // 3️⃣ Start Electron window
    app.whenReady().then(() => {
      createWindow();
    });
  });
});

// 4️⃣ Cleanup when Electron closes
app.on("window-all-closed", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // 3️⃣ Start Electron window
    app.whenReady().then(() => {
      createWindow();
    });
  }
});
