import { ccp4_setup_sh } from "./ccp4i2-setup-sh";
import { ccp4_setup_windows } from "./ccp4i2-setup-windows";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gets the next available run number for log files
 */
function getNextRunNumber(logDir: string): number {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    return 1;
  }

  const files = fs.readdirSync(logDir);
  const logFiles = files.filter((file) => file.match(/^uvicorn-(\d+)\.log$/));

  if (logFiles.length === 0) {
    return 1;
  }

  const runNumbers = logFiles.map((file) => {
    const match = file.match(/^uvicorn-(\d+)\.log$/);
    return match ? parseInt(match[1], 10) : 0;
  });

  return Math.max(...runNumbers) + 1;
}

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
/**
 * Starts the Django server using Uvicorn with the specified configuration.
 *
 * @param CCP4Dir - The path to the CCP4 directory.
 * @param UVICORN_PORT - The port number for the Uvicorn server.
 * @param NEXT_PORT - The port number for the Next.js server.
 * @param isDev - A boolean flag indicating whether the server is running in development mode.
 *                If `true`, the Python path is set to the development server directory.
 *                If `false`, the Python path is set to the production server directory.
 * @returns The spawned Python process running the Uvicorn server.
 */
export async function startDjangoServer(
  CCP4Dir: string,
  UVICORN_PORT: number,
  NEXT_PORT: number,
  isDev: boolean = false,
  CCP4I2_PROJECTS_DIR: string = ""
) {
  let ccp4_python = "ccp4-python";
  if (process.platform === "win32") {
    ccp4_setup_windows(CCP4Dir);
    ccp4_python = "ccp4-python.bat";
  } else {
    ccp4_setup_sh(CCP4Dir);
  }

  if (CCP4I2_PROJECTS_DIR.length > 0) {
    process.env.CCP4I2_DB_FILE = path.join(CCP4I2_PROJECTS_DIR, "db.sqlite3");
  }

  console.log(`🚀 Next.js running on http://localhost:${NEXT_PORT}`);
  const CCP4_PYTHON = path.join(process.env.CCP4 || "", "bin", ccp4_python);
  console.log({ CCP4_PYTHON });

  // Set environment variables BEFORE any Python operations
  const pythonEnv = {
    ...process.env,
    UVICORN_PORT: `${UVICORN_PORT}`,
    NEXT_ADDRESS: `http://localhost:${NEXT_PORT}`,
    MPLBACKEND: "Agg", // Force matplotlib to use non-GUI backend
    //QT_QPA_PLATFORM: "offscreen", // Force Qt to use offscreen platform
    // Windows-specific DLL path fixes
    ...(process.platform === "win32" && {
      PATH: `${path.join(CCP4Dir, "bin")};${process.env.PATH}`,
      CCP4: CCP4Dir,
      // Force matplotlib to avoid Qt completely
      MPLCONFIGDIR: path.join(os.tmpdir(), "matplotlib-config"),
    }),
  };

  const oldCWD = process.cwd();
  const oldPythonPath = process.env.PYTHONPATH || "";
  let serverSrcPath: string;

  if (isDev) {
    serverSrcPath = path.join(process.cwd(), "..", "server");
    process.chdir(path.join(process.cwd(), "..", "server"));
  } else {
    serverSrcPath = path.join(process.resourcesPath, "server");
    process.chdir(path.join(process.resourcesPath, "server"));
  }

  // Set PYTHONPATH in the environment
  pythonEnv.PYTHONPATH = serverSrcPath;

  console.log(`🐍`, pythonEnv);
  // Run migrations with the updated environment
  try {
    const migrateResult = execSync(`"${CCP4_PYTHON}" manage.py migrate`, {
      env: pythonEnv,
      stdio: "inherit", // Show migration output
    });
    console.log(`🐍 Migration completed successfully`);
  } catch (error) {
    console.error(`🐍 Migration failed:`, error);
    // Try alternative approach for Windows
    if (process.platform === "win32") {
      try {
        const altResult = execSync(
          `"${CCP4_PYTHON}" -c "import os; os.environ['MPLBACKEND']='Agg'; import django; django.setup(); from django.core.management import execute_from_command_line; execute_from_command_line(['manage.py', 'migrate'])"`,
          {
            env: pythonEnv,
            cwd: serverSrcPath,
          }
        );
        console.log(`🐍 Alternative migration completed`);
      } catch (altError) {
        console.error(`🐍 Alternative migration also failed:`, altError);
        throw altError;
      }
    } else {
      throw error;
    }
  }

  console.log(`🐍 serverSrcPath: ${serverSrcPath} ${typeof serverSrcPath}`);

  // Setup logging for production
  let logStream: fs.WriteStream | null = null;
  if (!isDev) {
    const homeDir = os.homedir();
    let logDir = path.join(homeDir, ".ccp4x");
    if (!fs.existsSync(logDir)) {
      logDir = path.join(homeDir, "ccp4x");
    }

    const runNumber = getNextRunNumber(logDir);
    const logFile = path.join(logDir, `uvicorn-${runNumber}.log`);
    fs.mkdirSync(logDir, { recursive: true });
    logStream = fs.createWriteStream(logFile, { flags: "a" });
    console.log(`🐍 Uvicorn logs will be written to: ${logFile}`);
  }

  // Start Python process with the corrected environment
  let pythonProcess: any;
  const uvicornArgs = isDev
    ? ["-m", "uvicorn", "asgi:application", "--reload"]
    : ["-m", "uvicorn", "asgi:application"];

  pythonProcess = spawn(CCP4_PYTHON, uvicornArgs, {
    env: pythonEnv,
    shell: true,
    cwd: serverSrcPath, // Ensure we're in the right directory
  });

  console.log(`🚀 Uvicorn running on http://localhost:${UVICORN_PORT}`);

  // Restore original environment
  process.env.PYTHONPATH = oldPythonPath;
  process.chdir(oldCWD);

  pythonProcess.stdout.on("data", (data) => {
    if (isDev) {
      console.log(`🐍 Python Output: ${data}`);
    } else {
      logStream?.write(`[STDOUT] ${new Date().toISOString()}: ${data}`);
    }
  });

  pythonProcess.stderr.on("data", (data) => {
    if (isDev) {
      console.error(`🐍 Python Error: ${data}`);
    } else {
      logStream?.write(`[STDERR] ${new Date().toISOString()}: ${data}`);
    }
  });

  pythonProcess.on("close", (code) => {
    const message = `🐍 Python process exited with code ${code}`;
    if (isDev) {
      console.log(message);
    } else {
      logStream?.write(`[EXIT] ${new Date().toISOString()}: ${message}\n`);
      logStream?.end();
    }
  });

  return pythonProcess;
}
