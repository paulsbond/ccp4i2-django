const {
  app,
  session,
  dialog,
  BrowserWindow,
  Menu,
  MenuItem,
  ipcMain,
} = require("electron");
const path = require("path");
const next = require("next");
const express = require("express");
const { spawn } = require("child_process");
const { getPort } = require("get-port-please");
const { ccp4_setup_windows } = require("./ccp4i2-setup-windows.cjs");
const { ccp4_setup_sh } = require("./ccp4i2-setup-sh.cjs");
const { existsSync } = require("fs");

//Way to say if launch fails
function showErrorAndExit(errorMessage) {
  dialog.showErrorBox("Failed to Start", errorMessage);
  app.quit();
}

// Set environment variable based on platform
let CCP4Dir;
let ccp4_python = "ccp4-python";
if (process.platform === "win32") {
  CCP4Dir = process.env.CCP4 || "C:\\CCP4-9\\CCP4";
  ccp4_python = "ccp4-python.bat";
} else if (process.platform === "darwin") {
  CCP4Dir = process.env.CCP4 || "/Applications/ccp4-9";
} else if (process.platform === "linux") {
  CCP4Dir = process.env.CCP4 || "/usr/local/ccp4-9";
} else {
  CCP4Dir = process.env.CCP4 || "/usr/local/ccp4-9"; // Fallback for other platforms
}
process.env.CCP4 = CCP4Dir;

const isDev = !app.isPackaged; // ✅ Works in compiled builds

// Change the current working directory to the Resources folder
if (!isDev) {
  const asarDir = app.getAppPath();
  const resourcesDir = path.resolve(asarDir, ".."); // Resolve the parent directory of the app.asar file
  // Change the working directory to the Resources folder where .next is
  process.chdir(resourcesDir);
}

let pythonProcess = null;
let mainWindow;

// 1️⃣ Create the Next.js server
const nextApp = next({ dev: isDev });
const nextHandler = nextApp.getRequestHandler();

const _createWindow = ({ url }) => {
  const newWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // Enable context isolation for security
      preload: path.join(__dirname, "preload.cjs"), // Preload script to expose safe APIs
    },
  });

  newWindow.loadURL(url);

  newWindow.on("closed", () => {
    if (newWindow == mainWindow) mainWindow = null;
  });

  // Intercept window.open and create a new Electron window instead
  newWindow.webContents.setWindowOpenHandler(({ url }) => {
    _createWindow({ url });
    return { action: "deny" }; // Prevent default behavior
  });

  return newWindow;
};

function installWillDownloadHandler() {
  // Intercept downloads
  session.defaultSession.on(
    "will-download",
    async (event, item, webContents) => {
      const browserWindow = BrowserWindow.fromWebContents(webContents);
      // Ask the user where to save the file
      const { filePath } = await dialog.showSaveDialog(browserWindow, {
        title: "Save File",
        defaultPath: path.join(app.getPath("downloads"), item.getFilename()), // Default to Downloads folder
        buttonLabel: "Save",
      });

      if (filePath) {
        item.setSavePath(filePath); // Set the path where the file will be saved
      } else {
        item.cancel(); // Cancel the download if no path was chosen
      }
    }
  );
}

// IPC communication to trigger file dialog to locate a valid CCP4 directory
ipcMain.on("locate-ccp4", (event, data) => {
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
  const CCP4_PYTHON = path.join(process.env.CCP4, "bin", ccp4_python);
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
  console.log(`🚀 Uvicorn running on http://localhost:${UVICORN_PORT_PORT}`);

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

startCCP4i2();

async function startCCP4i2() {
  const UVICORN_PORT = await getPort();
  const NEXT_PORT = await getPort(UVICORN_PORT + 1);
  process.env.PYTHONPATH = path.join(__dirname, "..", "server");
  process.env.BACKEND_URL = `http://localhost:${UVICORN_PORT}`;
  await nextApp.prepare();
  const server = express();
  // Set the Content Security Policy header
  server.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'self'; connect-src http://localhost:${NEXT_PORT} ws://localhost:${NEXT_PORT}; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'`
    );
    next();
  });
  //img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';

  server.get("/api/config", (req, res) => {
    const apiURL = `${req.protocol}://${
      req.get("host").split(":")[0]
    }:${UVICORN_PORT}`;
    const CCP4PythonPath = path.join(CCP4Dir, "bin", ccp4_python);
    res.json({
      apiURL,
      CCP4Dir: { path: CCP4Dir, exists: existsSync(CCP4Dir) },
      CCP4Python: {
        path: CCP4PythonPath,
        exists: existsSync(CCP4PythonPath),
      },
      NEXT_PORT,
      UVICORN_PORT,
    });
  });
  server.all("*", (req, res) => nextHandler(req, res));

  server.listen(NEXT_PORT, async () => {
    // 3️⃣ Start Electron window
    app.whenReady().then(() => {
      console.log(`🚀 Next.js running on http://localhost:${NEXT_PORT}`);
      installWillDownloadHandler();
      mainWindow = _createWindow({
        url: `http://localhost:${NEXT_PORT}/config`,
      });
      // Modify the default menu by adding a "New Window" option
      const defaultMenu = Menu.getApplicationMenu();
      addNewWindowMenuItem(defaultMenu, NEXT_PORT);
      Menu.setApplicationMenu(defaultMenu);
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        // 3️⃣ Start Electron window
        app.whenReady().then(async () => {
          _createWindow({ url: `http://localhost:${NEXT_PORT}` });
        });
      }
    });
  });
}

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

// Function to add "New Window" item to the default menu
function addNewWindowMenuItem(menu, NEXT_PORT) {
  // Find the File menu (usually at index 0)
  const fileMenu = menu.items[0];
  // If fileMenu is found, insert a "New Window" item right after the "New Tab" or similar item
  if (fileMenu) {
    fileMenu.submenu.append(
      new MenuItem({
        label: "New Window",
        accelerator: "CmdOrCtrl+N", // Optional: add a keyboard shortcut (Cmd+N / Ctrl+N)
        click: () => {
          _createWindow({ url: `http://localhost:${NEXT_PORT}` }); // Create new window when this option is clicked
        },
      })
    );
  }
}
