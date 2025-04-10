import { BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createWindow = async (port) => {
  const newWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // Intercept window.open and create a new Electron window instead
  newWindow.webContents.setWindowOpenHandler(({ url }) => {
    createWindow(port);
    return { action: "deny" }; // Prevent default behavior
  });

  setTimeout(() => newWindow?.loadURL(`http://localhost:${port}/config`), 1500);
  return newWindow;
};
