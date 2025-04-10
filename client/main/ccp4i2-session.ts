import { app, BrowserWindow, dialog } from "electron";
import path from "path";

export function installWillDownloadHandler(session: Electron.Session) {
  // Intercept downloads
  session.on("will-download", async (event, item, webContents) => {
    const browserWindow = BrowserWindow.fromWebContents(webContents);
    if (!browserWindow) {
      console.error("Browser window not found");
      return;
    }
    // Prevent the default download behavior
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
  });
}
