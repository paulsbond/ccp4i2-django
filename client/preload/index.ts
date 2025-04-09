import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getTheme: () => ipcRenderer.invoke("get-theme"),
  setTheme: (theme: string) => ipcRenderer.invoke("set-theme", theme),
  sendMessage: (channel: string, data: any[]) =>
    ipcRenderer.send(channel, data),
  onMessage: (
    channel: string,
    callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ) => ipcRenderer.on(channel, callback),
});
console.log("[Preload] Script loaded");
