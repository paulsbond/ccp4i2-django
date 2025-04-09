import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: path.resolve(__dirname, "main/index.ts"),
      output: {
        entryFileNames: "main.js",
        format: "esm",
      },
      external: [
        "electron",
        "fs",
        "path",
        "os",
        "stubborn-fs",
        "node:process",
        "node:util",
        "node:os",
        "node:net",
        "child_process",
      ], // add more if needed
    },
    target: "node18",
    emptyOutDir: true,
  },
});
