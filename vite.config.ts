import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  css: {
    transformer: "lightningcss",
    lightningcss: { targets: { safari: (15 << 16) | (4 << 8), chrome: 100 << 16, firefox: 100 << 16 } },
  },
  build: { cssMinify: "lightningcss", target: "es2020", sourcemap: true },
  server: { port: 5173 },
});
