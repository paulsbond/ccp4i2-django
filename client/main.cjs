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
const { ccp4_setup_windows } = require("./ccp4_setup_windows.cjs");
//Way to say if launch fails
function showErrorAndExit(errorMessage) {
  dialog.showErrorBox("Failed to Start", errorMessage);
  app.quit();
}

// Here a routine to "source" the ccp4 environment

// Set environment variable based on platform
let CCP4Dir;
let ccp4_python = "ccp4-python";
if (process.platform === "win32") {
  CCP4Dir = process.env.CCP4 || "C:/Users/nmemn/CCP4-9/CCP4";
  ccp4_python = "ccp4-python.bat";
} else if (process.platform === "darwin") {
  CCP4Dir = process.env.CCP4 || "/Applications/ccp4-9";
} else if (process.platform === "linux") {
  CCP4Dir = process.env.CCP4 || "/usr/local/ccp4-9";
} else {
  CCP4Dir = process.env.CCP4 || "/usr/local/ccp4-9"; // Fallback for other platforms
}
process.env.CCP4 = CCP4Dir;

// And here execute the rest of the setup shell script (need to look into windows)
async function runShellScript(CCP4Dir) {
  if (["linux", "darwin"].includes(process.platform)) {
    return new Promise((resolve, reject) => {
      try {
        let setup_script = path.join(CCP4Dir, "bin", "ccp4.setup-sh");
        exec(
          `./capture_env_changes.sh source ${setup_script}`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing script: ${error.message}`);
              return reject(error);
            }
            if (stderr) {
              console.warn(`Script stderr: ${stderr}`);
            }
            console.log(`Script stdout: ${stdout}`);
            resolve(stdout);
          }
        );
      } catch (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        showErrorAndExit(
          `Failed to execute setup script. Please check your CCP4 installation.`
        );
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      try {
        let setup_script = path.join(CCP4Dir, "ccp4.setup.bat");
        exec(
          `capture_env_changes.bat ${setup_script}`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing script: ${error.message}`);
              return reject(error);
            }
            if (stderr) {
              console.warn(`Script stderr: ${stderr}`);
            }
            console.log(`Script stdout: ${stdout}`);
            resolve(stdout);
          }
        );
      } catch (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        showErrorAndExit(
          `Failed to execute setup script. Please check your CCP4 installation.`
        );
      }
    });
  }
}

const isDev = !app.isPackaged; // ✅ Works in compiled builds

// Change the current working directory to the Resources folder
if (app.isPackaged) {
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
    process.env.PYTHONPATH = path.join(__dirname, "..", "server");
    UVICORN_PORT = aPort;
    return getPort(UVICORN_PORT + 1);
  })
  .then((aPort) => {
    NEXT_PORT = aPort;
    process.env.BACKEND_URL = `http://localhost:${UVICORN_PORT}`;
  })
  .then(async () => {
    if (process.platform === "win32") {
      ccp4_setup_windows(CCP4Dir);
    } else {
      const stdout = await runShellScript(CCP4Dir);
      console.log({ stdout });
      if (stdout) {
        const envChanges = JSON.parse(stdout);
        for (const [key, value] of Object.entries(envChanges)) {
          process.env[key] = value;
        }
      }
    }
    return Promise.resolve(true);
  })
  .then(() => nextApp.prepare())
  .then(async () => {
    const server = express();
    // Set the Content Security Policy header
    server.use((req, res, next) => {
      res.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; connect-src http://localhost:${NEXT_PORT}; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'`
      );
      next();
    });
    //img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';
    server.get("/config", (req, res) => {
      const apiURL = `${req.protocol}://${
        req.get("host").split(":")[0]
      }:${UVICORN_PORT}`;
      res.json({ apiURL });
    });
    server.all("*", (req, res) => nextHandler(req, res));

    server.listen(NEXT_PORT, async () => {
      console.log(`🚀 Next.js running on http://localhost:${NEXT_PORT}`);
      const CCP4_PYTHON = path.join(process.env.CCP4, "bin", ccp4_python);
      //.replace(/\\/g, "/");
      console.log({ CCP4_PYTHON });
      process.env.UVICORN_PORT = UVICORN_PORT;
      process.env.NEXT_ADDRESS = `http://localhost:${NEXT_PORT}`;
      //console.log(process.env);
      // 2️⃣ Start Python process with dynamic port
      pythonProcess = spawn(
        CCP4_PYTHON,
        ["-m", "uvicorn", "asgi:application"],
        {
          env: process.env,
          shell: true,
          //stdio: "inherit",
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
}
