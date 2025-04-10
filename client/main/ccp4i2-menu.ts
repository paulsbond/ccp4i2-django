import { Menu, MenuItem } from "electron";
import { createWindow } from "./ccp4i2-create-window";

// Function to add "New Window" item to the default menu
export function addNewWindowMenuItem(NEXT_PORT: number) {
  // Modify the default menu by adding a "New Window" option
  const menu = Menu.getApplicationMenu();
  if (!menu) {
    console.error("Menu not found");
    return;
  }
  // Find the File menu (usually at index 0)
  const fileMenu = menu.items[0];
  // If fileMenu is found, insert a "New Window" item right after the "New Tab" or similar item
  if (fileMenu) {
    fileMenu.submenu?.append(
      new MenuItem({
        label: "New Window",
        accelerator: "CmdOrCtrl+N", // Optional: add a keyboard shortcut (Cmd+N / Ctrl+N)
        click: () => {
          createWindow(`http://localhost:${NEXT_PORT}`); // Create new window when this option is clicked
        },
      })
    );
  }
  Menu.setApplicationMenu(menu);
}
