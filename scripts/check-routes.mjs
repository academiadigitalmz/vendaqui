// Abre cada rota da app num browser real e falha se houver erros na consola,
// pedidos falhados ou páginas vazias. Opcionalmente guarda capturas de ecrã.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/check-routes.mjs [--base http://localhost:4173] [--shots pasta] [--skin cakto-laranja] [--theme dark] [--width 1280]
//
// Usa o Chrome instalado (CHROME_PATH para outro executável).
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const base = arg("--base", "http://localhost:4173");
const shots = arg("--shots", "");
const skin = arg("--skin", "cakto-laranja");
const theme = arg("--theme", "light");
const width = Number(arg("--width", "1280"));
const only = arg("--only", "");
const executablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const ROUTES = [
  "/", "/checkout/excel-zero-avancado", "/entrar", "/criar-conta",
  "/aluno", "/aluno/aulas/m2l3", "/aluno/compras",
  "/produtor", "/produtor/produtos", "/produtor/produtos/novo", "/produtor/produtos/p1", "/produtor/produtos/p1?tab=checkout", "/produtor/produtos/p1?tab=afiliacao",
  "/produtor/vendas", "/produtor/assinaturas", "/produtor/clientes", "/produtor/afiliados", "/produtor/afiliados?tab=mercado", "/produtor/cupoes",
  "/produtor/recuperacao", "/produtor/membros", "/produtor/financeiro", "/produtor/financeiro?sacar=1", "/produtor/integracoes", "/produtor/conta", "/produtor/conta?tab=verificacao",
  "/admin", "/admin/transacoes", "/admin/saques", "/admin/disputas", "/admin/produtores", "/admin/kyc", "/admin/produtos", "/admin/antifraude",
  "/admin/pagamentos", "/admin/taxas", "/admin/equipa", "/admin/auditoria",
].filter((r) => !only || r.includes(only));

const browser = await chromium.launch({ executablePath, headless: true });
const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme === "dark" ? "dark" : "light", locale: "pt-PT" });
await ctx.addInitScript(([s, t]) => { try { localStorage.setItem("vq.skin", JSON.stringify(s)); localStorage.setItem("vq.theme", JSON.stringify(t)); } catch {} }, [skin, theme]);
if (shots) mkdirSync(shots, { recursive: true });

let failed = 0;
for (const route of ROUTES) {
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error") problems.push("consola: " + m.text().slice(0, 200)); });
  page.on("pageerror", (e) => problems.push("erro: " + e.message.slice(0, 200)));
  page.on("requestfailed", (r) => { if (!r.url().includes("fonts.g")) problems.push("pedido falhou: " + r.url()); });
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const text = (await page.locator("#root").innerText()).trim();
  const busy = await page.locator('[aria-busy="true"]').count();
  const errBox = await page.getByText("Não foi possível carregar estes dados").count();
  if (text.length < 80) problems.push(`página quase vazia (${text.length} caracteres)`);
  if (busy) problems.push("ainda a carregar");
  if (errBox) problems.push("mostra erro de carregamento");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) problems.push(`scroll horizontal de ${overflow}px`);
  if (shots) await page.screenshot({ path: `${shots}/${route.replace(/[/?=]+/g, "_").replace(/^_|_$/g, "") || "inicio"}.png`, fullPage: false });
  console.log(`${problems.length ? "FALHOU" : "ok    "} ${route}${problems.length ? "\n         " + problems.join("\n         ") : ""}`);
  if (problems.length) failed++;
  await page.close();
}
await browser.close();
console.log(`\n${ROUTES.length - failed} de ${ROUTES.length} rotas sem problemas`);
process.exit(failed ? 1 : 0);
