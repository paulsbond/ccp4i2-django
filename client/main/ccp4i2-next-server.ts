import next from "next";
import path from "path";
import express from "express";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const startNextServer = async (
  isDev: boolean,
  nextServerPort: number,
  djangoServerPort: number
): Promise<express.Express> => {
  const nextApp = next({
    dev: isDev,
    dir: path.join(__dirname, "../renderer"), // this is your Next app root
  });

  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  // Set the Content Security Policy header
  const csp = {
    defaultSrc: "'self'",
    connectSrc: `http://localhost:${nextServerPort} ws://localhost:${nextServerPort}`,
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

  //const server = createServer((req, res) => handle(req, res));
  const server = express();

  // Proxy Django API requests
  /*
  server.use(
    "/api",
    createProxyMiddleware({
      target: `http://localhost:${djangoServerPort}`, // Your Django server URL
      changeOrigin: true,
      pathRewrite: {
        "^/api": "", // Remove `/api` prefix when forwarding to Django
      },
    })
  );
*/
  server.use((req, res, next_operator) => {
    res.setHeader("Content-Security-Policy", cspString);
    next_operator();
  });

  server.use((req, res) => handle(req, res));

  server.listen(nextServerPort, () => {
    console.log(`Next.js ready on http://localhost:${nextServerPort}`);
  });

  return server;
};
