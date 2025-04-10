import next from "next";
import path from "path";
import express from "express";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const startNextServer = async (isDev: boolean, port: number) => {
  const nextApp = next({
    dev: isDev,
    dir: path.join(__dirname, "../renderer"), // this is your Next app root
  });

  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const server = express();
  // Set the Content Security Policy header
  const csp = {
    defaultSrc: "'self'",
    connectSrc: `http://localhost:${port} ws://localhost:${port}`,
    styleSrc: "'self' https://cdn.jsdelivr.net 'unsafe-inline'",
    fontSrc: "'self' https://cdn.jsdelivr.net 'unsafe-inline'",
    scriptSrc: "'self' https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'",
    workerSrc: "'self' blob:",
  };

  const cspString = `
    default-src ${csp.defaultSrc};
    connect-src ${csp.connectSrc};
    style-src ${csp.styleSrc};
    font-src ${csp.fontSrc};
    script-src ${csp.scriptSrc};
    worker-src ${csp.workerSrc};
  `
    .replace(/\n\s+/g, " ")
    .trim(); // Clean up whitespace

  server.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", cspString);
    next();
  });

  server.listen(port, () => {
    console.log(`Next.js ready on http://localhost:${port}`);
  });
};
