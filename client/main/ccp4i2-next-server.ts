import next from "next";
import path from "path";
import express from "express";
import { fileURLToPath } from "node:url";
import { Server } from "node:http";
//import { createProxyMiddleware } from "http-proxy-middleware";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Starts a Next.js server with custom configurations, including a Content Security Policy (CSP)
 * and optional proxying of API requests to a Django server.
 *
 * @param isDev - A boolean indicating whether the server is running in development mode.
 * @param nextServerPort - The port number on which the Next.js server will listen.
 * @param djangoServerPort - The port number of the Django server to proxy API requests to.
 * @returns A promise that resolves to the created server instance.
 *
 * @remarks
 * - The server sets a Content Security Policy (CSP) header to enhance security.
 * - The `dir` option for the Next.js app is set to the `../renderer` directory relative to the current file.
 * - The server uses Express.js to handle requests and apply middleware.
 * - Proxying to the Django server is currently commented out but can be enabled by uncommenting the relevant code.
 *
 * @example
 * ```typescript
 * const server = await startNextServer(true, 3000, 8000);
 * console.log("Server started successfully");
 * ```
 */
export const startNextServer = async (
  isDev: boolean,
  nextServerPort: number,
  djangoServerPort: number
): Promise<Server> => {
  const nextApp = next({
    dev: isDev,
    dir: path.join(__dirname, "../renderer"), // this is your Next app root
  });

  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  // Set the Content Security Policy header
  const csp = {
    defaultSrc: "'self'",
    connectSrc: `http://localhost:${nextServerPort} ws://localhost:${nextServerPort} https://www.ebi.ac.uk https://pubmed.ncbi.nlm.nih.gov`,
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
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next_operator();
  });

  server.use(express.static(path.join(__dirname, "../renderer/public")));

  server.use((req, res) => handle(req, res));

  const serverInstance: Server = server.listen(nextServerPort, () => {
    console.log(`Next.js ready on http://localhost:${nextServerPort}`);
  });

  return serverInstance;
};
