// File: vite.preload.config.ts
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: path.resolve(__dirname, "preload/index.ts"),
      formats: ["es"],
      fileName: () => "preload.js",
    },
    rollupOptions: {
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
    emptyOutDir: false, // so it doesn't wipe out dist/main.js
  },
});
