// Percorre os fluxos principais num browser real: compra com M-Pesa até à página de obrigado,
// erro de operadora, cupão, saque e reembolso. Precisa de `vite preview` na porta 4173.
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://localhost:4173";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "pt-PT" })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let failed = 0;
const step = async (name, fn) => { try { await fn(); console.log("ok     " + name); } catch (e) { failed++; console.log("FALHOU " + name + "\n         " + String(e.message).split("\n")[0]); } };

await step("checkout: cupão ANA10 baixa o total", async () => {
  await page.goto(base + "/checkout/excel-zero-avancado", { waitUntil: "networkidle" });
  await page.getByPlaceholder("Tem um cupão?").fill("ANA10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await page.getByText("Cupão ANA10").waitFor({ timeout: 5000 });
  await page.locator(".co-total b").filter({ hasText: "2241,00" }).or(page.locator(".co-total b").filter({ hasText: "2 241,00" })).waitFor({ timeout: 3000 });
});
await step("checkout: número e-Mola com M-Pesa mostra aviso e recusa", async () => {
  await page.getByRole("radio", { name: /M-Pesa/ }).click();
  await page.locator("#co-wallet").fill("86 312 4471");
  await page.getByText("Este número é Movitel").waitFor({ timeout: 3000 });
  await page.locator(".co-pay").click();
  await page.getByText("Use um número Vodacom").waitFor({ timeout: 5000 });
});
await step("checkout: M-Pesa aprova e abre a página de obrigado", async () => {
  await page.locator("#co-wallet").fill("84 312 4471");
  await page.locator("#co-bump").check();
  await page.locator(".co-pay").click();
  await page.getByText("Confirme no seu telemóvel").waitFor({ timeout: 5000 });
  await page.waitForURL(/\/obrigado\//, { timeout: 15000 });
  await page.getByText("Pagamento aprovado").waitFor({ timeout: 5000 });
  await page.getByText("Ebook 100 Fórmulas", { exact: false }).first().waitFor({ timeout: 3000 });
});
await step("checkout: Apple Pay aprova", async () => {
  await page.goto(base + "/checkout/excel-zero-avancado", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /Apple Pay/ }).click();
  await page.getByRole("button", { name: /Pagar com Apple Pay/ }).click();
  await page.waitForURL(/\/obrigado\//, { timeout: 15000 });
});
await step("produtor: saque reduz o saldo", async () => {
  await page.goto(base + "/produtor/financeiro?sacar=1", { waitUntil: "networkidle" });
  await page.locator("#wd-v").fill("1000");
  await page.getByRole("button", { name: "Confirmar saque" }).click();
  await page.getByText("Saque a caminho").waitFor({ timeout: 5000 });
  await page.locator(".balance-card .big").filter({ hasText: "47" }).waitFor({ timeout: 5000 });
});
await step("produtor: reembolso de uma venda aprovada", async () => {
  await page.goto(base + "/produtor/vendas?status=approved", { waitUntil: "networkidle" });
  await page.locator("tr.click").first().click();
  await page.getByRole("button", { name: "Reembolsar", exact: true }).click();
  await page.getByRole("button", { name: /^Reembolsar \d/ }).click();
  await page.getByText("Reembolso enviado").waitFor({ timeout: 5000 });
});
await step("produtor: criar cupão novo", async () => {
  await page.goto(base + "/produtor/cupoes", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Criar cupão" }).first().click();
  await page.locator("#cp-code").fill("TESTE30");
  await page.getByRole("dialog").getByRole("button", { name: "Criar cupão" }).click();
  await page.getByText("TESTE30").first().waitFor({ timeout: 5000 });
});
await step("aluno: marcar aula como concluída atualiza o progresso", async () => {
  await page.goto(base + "/aluno/aulas/m2l3", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Marcar como concluída" }).click();
  await page.getByRole("button", { name: "Concluída" }).waitFor({ timeout: 5000 });
});
await step("backoffice: aprovar KYC tira a conta da fila", async () => {
  await page.goto(base + "/admin/kyc", { waitUntil: "networkidle" });
  const before = await page.locator(".kyc-list .queue-item").count();
  await page.getByRole("button", { name: "Aprovar" }).click();
  await page.getByText("Conta aprovada").waitFor({ timeout: 5000 });
  await page.waitForFunction((n) => document.querySelectorAll(".kyc-list .queue-item").length === n - 1, before, { timeout: 5000 });
});
await step("backoffice: aprovar saques em lote", async () => {
  await page.goto(base + "/admin/saques", { waitUntil: "networkidle" });
  await page.getByLabel("Selecionar todos").check();
  await page.getByRole("button", { name: "Aprovar e pagar" }).click();
  await page.getByText(/saques enviados para pagamento/).waitFor({ timeout: 5000 });
});
await step("visual: trocar para Academia Digital muda o data-skin", async () => {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Áreas do protótipo/ }).click();
  await page.getByRole("menuitemradio", { name: /Academia Digital/ }).click();
  const skin = await page.evaluate(() => document.documentElement.getAttribute("data-skin"));
  if (skin !== "academia") throw new Error("data-skin = " + skin);
});
if (errors.length) { failed++; console.log("FALHOU erros na página:\n         " + errors.join("\n         ")); }
await browser.close();
console.log(failed ? `\n${failed} fluxo(s) com problemas` : "\nTodos os fluxos funcionam");
process.exit(failed ? 1 : 0);
