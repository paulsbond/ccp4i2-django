// electron-global.d.ts
import { ipcRenderer } from "electron";

declare global {
  // Adds the Electron API to globalThis
  var electron: {
    onMessage: (channel, callback) => typeof ipcRenderer.on;
    sendMessage: (channel, ...args) => typeof ipcRenderer.send;
  };
}
