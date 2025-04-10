import { ccp4_setup_sh } from "./ccp4i2-setup-sh";
import { ccp4_setup_windows } from "./ccp4i2-setup-windows";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startDjangoServer(
  CCP4Dir: string,
  UVICORN_PORT: number,
  NEXT_PORT: number
) {
  let ccp4_python = "ccp4-python";
  if (process.platform === "win32") {
    ccp4_setup_windows(CCP4Dir);
    ccp4_python = "ccp4-python.bat";
  } else {
    ccp4_setup_sh(CCP4Dir);
  }
  console.log(`🚀 Next.js running on http://localhost:${NEXT_PORT}`);
  const CCP4_PYTHON = path.join(process.env.CCP4 || "", "bin", ccp4_python);
  //.replace(/\\/g, "/");
  console.log({ CCP4_PYTHON });
  process.env.UVICORN_PORT = `${UVICORN_PORT}`;
  process.env.NEXT_ADDRESS = `http://localhost:${NEXT_PORT}`;
  process.env.PYTHONPATH = path.join(process.cwd(), "server");
  //console.log(process.env);
  // 2️⃣ Start Python process with dynamic port
  const pythonProcess = spawn(
    CCP4_PYTHON,
    ["-m", "uvicorn", "asgi:application"],
    {
      env: process.env,
      shell: true,
    }
  );
  console.log(`🚀 Uvicorn running on http://localhost:${UVICORN_PORT}`);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`🐍 Python Output: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`🐍 Python Error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`🐍 Python process exited with code ${code}`);
  });

  return pythonProcess;
}
