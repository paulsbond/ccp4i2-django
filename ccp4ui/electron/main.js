const { app, BrowserWindow, nativeImage } = require("electron");

app.whenReady().then(() => {
  const icon_path = __dirname + "/../static/ccp4.png";
  const icon = nativeImage.createFromPath(icon_path);
  const window = new BrowserWindow({ icon: icon });
  window.maximize();
  window.setMenuBarVisibility(false);
  window.loadURL(process.env.CCP4UI_URL);
});
