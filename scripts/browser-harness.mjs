// Base dos testes de browser: serve dist/ com os cabeçalhos de vercel.json e abre o Chrome.
// CHROME_PATH escolhe outro Chrome/Chromium.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};

export const ok = (route, data, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });
export const fail = (route, status, code, message) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ error: { code, message } }),
  });

export async function startHarness() {
  const securityHeaders = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")).headers.find(
    (rule) => rule.source === "/(.*)",
  ).headers;
  const server = createServer((req, res) => {
    let file = join(dist, normalize(new URL(req.url, "http://x").pathname));
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, "index.html");
    for (const { key, value } of securityHeaders) res.setHeader(key, value);
    res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    res.end(readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" },
  );
  let failed = 0;

  async function test(name, fn) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    const problems = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (message.text().includes("Content Security Policy")) problems.push(message.text());
    });
    // Sem depender da rede: as fontes externas respondem vazias.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.fulfill({ contentType: "text/css", body: "" }),
    );
    try {
      await fn({ page, base });
      assert.deepEqual(problems, []);
      console.log(`ok   ${name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${name}\n`, error.message, problems);
    } finally {
      // Um browser que já caiu não pode esconder o resultado do teste.
      await context.close().catch((error) => console.error(error.message));
    }
  }

  async function close() {
    await browser.close();
    server.close();
    process.exitCode = failed ? 1 : 0;
  }

  return { test, close };
}
