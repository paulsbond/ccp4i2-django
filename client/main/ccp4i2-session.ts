import { app, BrowserWindow, dialog } from "electron";
import path from "path";

/**
 * Installs a handler for the "will-download" event on the provided Electron session.
 * This handler intercepts download events, prompts the user to select a save location,
 * and sets the file's save path accordingly. If the user cancels the save dialog,
 * the download is canceled.
 *
 * @param session - The Electron session to attach the "will-download" event handler to.
 *
 * The handler performs the following steps:
 * - Retrieves the browser window associated with the download.
 * - Displays a save dialog to the user, defaulting to the Downloads folder.
 * - Sets the file's save path to the user-selected location or cancels the download if no location is chosen.
 *
 * Note: If the browser window cannot be found, an error is logged, and the handler exits.
 */
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
