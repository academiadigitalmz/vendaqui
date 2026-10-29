import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// BASE_PATH permite publicar numa subpasta, ex.: BASE_PATH=/vendaqui/ para o GitHub Pages
const base = process.env.BASE_PATH || "/";

/** No GitHub Pages não há reescritas: o 404.html é uma cópia do index.html e a app trata da rota. */
const spaFallback = () => ({
  name: "spa-404-fallback",
  apply: "build" as const,
  closeBundle() {
    const out = resolve(fileURLToPath(new URL(".", import.meta.url)), "dist");
    if (existsSync(resolve(out, "index.html"))) copyFileSync(resolve(out, "index.html"), resolve(out, "404.html"));
  },
});

export default defineConfig({
  base,
  plugins: [react(), spaFallback()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  css: {
    transformer: "lightningcss",
    lightningcss: { targets: { safari: (15 << 16) | (4 << 8), chrome: 100 << 16, firefox: 100 << 16 } },
  },
  build: { cssMinify: "lightningcss", target: "es2020", sourcemap: true },
  server: { port: 5173 },
});
