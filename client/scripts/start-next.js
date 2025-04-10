// scripts/start-next.js
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nextPath = join(__dirname, "../node_modules/next/dist/bin/next");

exec(
  `node ${nextPath} start`,
  { cwd: join(__dirname, "..") },
  (err, stdout, stderr) => {
    if (err) {
      console.error("Failed to start Next.js:", err);
      process.exit(1);
    } else {
      console.log(stdout);
      console.error(stderr);
    }
  }
);
