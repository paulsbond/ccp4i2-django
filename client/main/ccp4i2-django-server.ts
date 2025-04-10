import { ccp4_setup_sh } from "./ccp4i2-setup-sh";
import { ccp4_setup_windows } from "./ccp4i2-setup-windows";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Starts a Django server using Uvicorn and sets up the environment for the server.
 * This function handles platform-specific configurations and spawns a Python process
 * to run the Uvicorn server for the Django application.
 *
 * @param {string} CCP4Dir - The directory path to the CCP4 installation.
 * @param {number} UVICORN_PORT - The port number on which the Uvicorn server will run.
 * @param {number} NEXT_PORT - The port number on which the Next.js application is running.
 * @returns {ChildProcess} The spawned Python process running the Uvicorn server.
 *
 * @remarks
 * - On Windows, the function uses `ccp4-python.bat` and calls `ccp4_setup_windows`.
 * - On other platforms, it uses `ccp4-python` and calls `ccp4_setup_sh`.
 * - The function sets several environment variables, including `UVICORN_PORT`, `NEXT_ADDRESS`, and `PYTHONPATH`.
 * - Logs are printed to the console for both standard output and error streams of the Python process.
 * - The function ensures that the Python process is executed with the appropriate environment variables.
 *
 * @example
 * ```typescript
 * const pythonProcess = await startDjangoServer("/path/to/ccp4", 8000, 3000);
 * pythonProcess.on("close", (code) => {
 *   console.log(`Python process exited with code ${code}`);
 * });
 * ```
 */
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
