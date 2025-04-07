import { ccp4_setup } from "./ccp4_setup_windows.cjs";
import path from "path";
const { spawn, spawnSync } = require("child_process");

ccp4_setup("C:\\Users\\nmemn\\ccp4-9\\CCP4");
process.env.UVICORN_PORT = 3001;
process.cwd = path.join(__dirname, "..", "server");
console.log(process.env);
const result = spawn(
  "C:\\Users\\nmemn\\ccp4-9\\CCP4\\bin\\ccp4-python",
  { shell: true, env: process.env }
  //["-m", "uvicorn", "asgi:application"],
  //{ stdio: "inherit", cwd: path.join(__dirname, "..", "server") }
);
if (result.error) {
  console.error("Error:", result.error);
} else {
  console.log("Django server started.");
}
