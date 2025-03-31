const {
  app,
  session,
  dialog,
  BrowserWindow,
  Menu,
  MenuItem,
} = require("electron");
const path = require("path");
const next = require("next");
const express = require("express");
const { spawn, exec } = require("child_process");
const { getPort } = require("get-port-please");

//Way to say if launch fails
function showErrorAndExit(errorMessage) {
  dialog.showErrorBox("Failed to Start", errorMessage);
  app.quit();
}

// Here a routine to "source" the ccp4 environment

// Set environment variable based on platform
if (process.platform === "win32") {
  process.env.CCP4 = process.env.CCP4 || "C:\\Program Files\\CCP4-9";
} else if (process.platform === "darwin") {
  process.env.CCP4 = process.env.CCP4 || "/Applications/ccp4-9";
} else if (process.platform === "linux") {
  process.env.CCP4 = process.env.CCP4 || "/usr/local/ccp4-9";
} else {
  process.env.CCP4 = process.env.CCP4 || "/usr/local/ccp4-9"; // Fallback for other platforms
}
// And here execute the rest of the setup shell script (need to look into windows)
function runShellScript() {
  return new Promise((resolve, reject) => {
    try {
      let setup_script;
      if (["linux", "darwin"].includes(process.platform)) {
        setup_script = path.join(process.env.CCP4, "bin", "ccp4.setup-sh");
      } else if (process.platform === "win32") {
        setup_script = path.join(process.env.CCP4, "bin", "ccp4-setup.bat");
      }
      exec(`bash ${setup_script}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing script: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.warn(`Script stderr: ${stderr}`);
        }
        console.log(`Script stdout: ${stdout}`);
        resolve(stdout);
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      reject(error);
      showErrorAndExit(
        `Failed to execute setup script. Please check your CCP4 installation.`
      );
    }
  });
}

const isDev = !app.isPackaged; // ✅ Works in compiled builds

// Change the current working directory to the Resources folder
if (app.isPackaged) {
  const asarDir = app.getAppPath();
  const resourcesDir = path.resolve(asarDir, ".."); // Resolve the parent directory of the app.asar file
  // Change the working directory to the Resources folder where .next is
  process.chdir(resourcesDir);
  console.log("Executing in directory:", resourcesDir); // Print the directory
}

let pythonProcess = null;
let mainWindow;

// 1️⃣ Create the Next.js server
const nextApp = next({ dev: isDev });
const nextHandler = nextApp.getRequestHandler();

const env = Object.assign({}, process.env, {
  PYTHONPATH: path.join(__dirname, "..", "server"),
});

const createWindow = (port) => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      //contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);

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

let NEXT_PORT;
let UVICORN_PORT;
getPort()
  .then((aPort) => {
    UVICORN_PORT = aPort;
    return getPort(UVICORN_PORT + 1);
  })
  .then((aPort) => {
    NEXT_PORT = aPort;
    process.env.BACKEND_URL = `http://localhost:${UVICORN_PORT}`;
  })
  .then(() => runShellScript())
  .then(() => nextApp.prepare())
  .then(async () => {
    const server = express();
    server.get("/config", (req, res) => {
      const apiURL = `${req.protocol}://${
        req.get("host").split(":")[0]
      }:${UVICORN_PORT}`;
      res.json({ apiURL });
    });
    server.all("*", (req, res) => nextHandler(req, res));

    server.listen(NEXT_PORT, async () => {
      console.log(`🚀 Next.js running on http://localhost:${NEXT_PORT}`);
      const CCP4_PYTHON = path.join(process.env.CCP4, "bin", "ccp4-python");
      env.UVICORN_PORT = UVICORN_PORT;
      env.NEXT_ADDRESS = `http://localhost:${NEXT_PORT}`;
      // 2️⃣ Start Python process with dynamic port
      pythonProcess = spawn(
        CCP4_PYTHON,
        ["-m", "uvicorn", "asgi:application"],
        {
          env,
        }
      );

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
        createWindow(NEXT_PORT);
        // Modify the default menu by adding a "New Window" option
        const defaultMenu = Menu.getApplicationMenu();
        addNewWindowMenuItem(defaultMenu, NEXT_PORT);
        Menu.setApplicationMenu(defaultMenu);
      });
      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          // 3️⃣ Start Electron window
          app.whenReady().then(async () => {
            createWindow(NEXT_PORT);
            // Modify the default menu by adding a "New Window" option
            const defaultMenu = Menu.getApplicationMenu();
            addNewWindowMenuItem(defaultMenu, NEXT_PORT);
            Menu.setApplicationMenu(defaultMenu);
          });
        }
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

// Function to add "New Window" item to the default menu
function addNewWindowMenuItem(menu, NEXT_PORT) {
  // Find the File menu (usually at index 0)
  const fileMenu = menu.items[0];
  console.log("fileMenu", fileMenu.submenu.items);
  // If fileMenu is found, insert a "New Window" item right after the "New Tab" or similar item
  if (fileMenu) {
    fileMenu.submenu.append(
      new MenuItem({
        label: "New Window",
        accelerator: "CmdOrCtrl+N", // Optional: add a keyboard shortcut (Cmd+N / Ctrl+N)
        click: () => {
          createWindow(NEXT_PORT); // Create new window when this option is clicked
        },
      })
    );
  }
  console.log("fileMenu", fileMenu.submenu.items);
}
