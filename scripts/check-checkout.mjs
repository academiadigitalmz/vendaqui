// Testes do checkout no browser, com a API simulada por HTTP.
// Serve dist/ com os cabeçalhos de vercel.json, para a política de segurança ser exercitada.
// Uso: npm run build && npm run test:checkout   (CHROME_PATH escolhe outro Chrome/Chromium)
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const securityHeaders = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")).headers.find(
  (rule) => rule.source === "/(.*)",
).headers;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
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

const productId = "11111111-1111-4111-8111-111111111111";
const offerId = "22222222-2222-4222-8222-222222222222";
const orderId = "33333333-3333-4333-8333-333333333333";
const product = {
  product: {
    id: productId,
    slug: "curso",
    name: "Curso real",
    description: "Descrição",
    type: "course",
    guaranteeDays: 7,
  },
  offers: [
    {
      id: offerId,
      name: "Principal",
      priceAmount: 50,
      currency: "MZN",
      isActive: true,
      isDefault: true,
    },
  ],
  sellerDisplayName: "Produtor real",
};
const pending = () => ({
  order: {
    id: orderId,
    orderNumber: "VQ-REAL",
    status: "pending_payment",
    totalAmount: 50,
    currency: "MZN",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    items: [{ productId, productName: "Curso real", offerName: "Principal", totalAmount: 50 }],
  },
  payment: { id: "payment", status: "processing", confirmationStatus: "pending" },
  attempt: { id: "attempt", status: "pending", method: "mpesa" },
  claimStatus: "pending_payment",
});

let failed = 0;
async function test(name, fn) {
  const context = await browser.newContext();
  context.setDefaultTimeout(8000);
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) problems.push(message.text());
  });
  const api = {
    purchase: pending(),
    creates: [],
    retries: [],
    claims: [],
    onCreate: null,
    onRetry: null,
    onClaim: null,
  };
  const ok = (route, data, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });
  const fail = (route, status, code, message) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: { code, message } }),
    });
  api.ok = ok;
  api.fail = fail;
  // Sem depender da rede: as fontes externas respondem vazias.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.route("**/api/v1/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    const call = () => ({ body: request.postDataJSON(), headers: request.headers() });
    if (path === "/public/products/curso") return ok(route, product);
    if (path === "/payments/methods")
      return ok(route, [{ method: "mpesa", isEnabled: true, ready: true }]);
    if (path === "/checkout/orders") {
      api.creates.push(call());
      if (api.onCreate) return api.onCreate(route);
      return ok(route, { ...api.purchase, checkoutToken: "checkout-token" }, 201);
    }
    if (path === `/checkout/orders/${orderId}`) return ok(route, api.purchase);
    if (path.endsWith("/payment-attempts")) {
      api.retries.push(call());
      return api.onRetry(route);
    }
    if (path.endsWith("/claim")) {
      api.claims.push(call());
      return api.onClaim(route);
    }
    if (path === "/auth/login")
      return ok(route, {
        accessToken: "token",
        user: { id: "buyer", name: "Comprador", email: "buyer@example.com" },
      });
    if (path === "/seller/profile")
      return fail(route, 404, "seller_resource_not_found", "Sem perfil.");
    return fail(route, 401, "unauthorized", "Sem sessão.");
  });
  const buy = async () => {
    await page.goto(`${base}/checkout/curso`);
    await page.locator("#co-name").fill("Comprador real");
    await page.locator("#co-email").fill("buyer@example.com");
    await page.locator("#co-wallet").fill("84 422 6545");
    await page.getByRole("button", { name: /Comprar agora/ }).click();
  };
  const pay = () => {
    api.purchase.order.status = "paid";
    api.purchase.payment.status = "succeeded";
    api.purchase.attempt.status = "succeeded";
  };
  const refuse = () => {
    api.purchase.attempt.status = "failed";
    api.purchase.payment.status = "pending";
  };
  // Navega sem recarregar, para a sessão em memória se manter.
  const go = (path) =>
    page.evaluate((to) => {
      history.pushState({}, "", to);
      dispatchEvent(new PopStateEvent("popstate"));
    }, path);
  try {
    await fn({ page, api, buy, pay, refuse, go });
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

await test("compra de convidado: espera visível, claim filtrado e rascunho libertado", async (t) => {
  await t.buy();
  await t.page.getByText("A confirmar o pagamento").waitFor();
  await t.page.getByText("Encomenda VQ-REAL").waitFor();
  assert.equal(t.api.creates[0].body.msisdn, "+258844226545");
  t.api.onClaim = (route) => {
    t.api.purchase.claimStatus = "claimed";
    return t.api.ok(route, {
      order: t.api.purchase.order,
      accessToken: "token",
      user: { ID: "buyer", Name: "Comprador", Email: "buyer@example.com", Password: "hash" },
    });
  };
  t.pay();
  t.api.purchase.claimStatus = "pending_identity";
  t.api.purchase.claimMode = "create_account";
  await t.page.waitForURL(/obrigado/);
  await t.page.getByRole("button", { name: "Introduzir código" }).click();
  await t.page.locator("#claim-code").fill("123456");
  await t.page.locator("#claim-password").fill("palavra-passe-longa");
  await t.page.getByRole("button", { name: "Criar conta e aceder" }).click();
  await t.page.getByText("Aceder ao conteúdo").waitFor();
  await t.go("/checkout/curso");
  await t.page.getByRole("button", { name: /Comprar agora/ }).waitFor();
  await t.page.locator(".co-buyer").getByText("buyer@example.com").waitFor();
});

await test("resposta perdida na criação repete a mesma chave e o mesmo pedido", async (t) => {
  t.api.onCreate = (route) => {
    t.api.onCreate = null;
    return route.abort("connectionfailed");
  };
  await t.buy();
  await t.page.getByText("Não foi possível concluir o pedido").waitFor();
  await t.page.reload();
  await t.page.getByRole("button", { name: "Retomar pedido" }).click();
  await t.page.getByText("A confirmar o pagamento").waitFor();
  assert.equal(
    t.api.creates[0].headers["idempotency-key"],
    t.api.creates[1].headers["idempotency-key"],
  );
  assert.deepEqual(t.api.creates[0].body, t.api.creates[1].body);
});

await test("nova tentativa rejeitada permite corrigir o número", async (t) => {
  t.refuse();
  await t.buy();
  const again = t.page.getByRole("button", { name: "Tentar pagamento novamente" });
  t.api.onRetry = (route) => t.api.fail(route, 422, "invalid_msisdn", "Número recusado.");
  await again.click();
  await t.page.getByText("Número recusado.").waitFor();
  await t.page.locator("#co-wallet").fill("85 111 2222");
  t.api.onRetry = (route) => {
    t.api.purchase.attempt.status = "pending";
    return t.api.ok(
      route,
      { payment: t.api.purchase.payment, attempt: t.api.purchase.attempt },
      201,
    );
  };
  await again.click();
  await t.page.getByText("A confirmar o pagamento").waitFor();
  assert.equal(t.api.retries[1].body.msisdn, "+258851112222");
  assert.notEqual(
    t.api.retries[0].headers["idempotency-key"],
    t.api.retries[1].headers["idempotency-key"],
  );
  assert.equal(t.api.creates.length, 1);
});

await test("resposta perdida na nova tentativa bloqueia o número e repete a chave", async (t) => {
  t.refuse();
  await t.buy();
  const again = t.page.getByRole("button", { name: "Tentar pagamento novamente" });
  t.api.onRetry = (route) => route.abort("connectionfailed");
  await again.click();
  await t.page.getByText("Não foi possível confirmar a tentativa").waitFor();
  assert.equal(await t.page.locator("#co-wallet").isDisabled(), true);
  await again.click();
  await t.page.waitForTimeout(300);
  assert.equal(
    t.api.retries[0].headers["idempotency-key"],
    t.api.retries[1].headers["idempotency-key"],
  );
});

await test("encomenda expirada sem cobrança permite nova encomenda", async (t) => {
  t.refuse();
  t.api.purchase.order.status = "expired";
  await t.buy();
  await t.page.getByRole("button", { name: "Fazer nova encomenda" }).click();
  await t.page.getByRole("button", { name: /Comprar agora/ }).click();
  await t.page.getByRole("button", { name: "Fazer nova encomenda" }).waitFor();
  assert.notEqual(
    t.api.creates[0].headers["idempotency-key"],
    t.api.creates[1].headers["idempotency-key"],
  );
});

await test("encomenda encerrada com cobrança incerta não permite pagar de novo", async (t) => {
  t.api.purchase.order.status = "expired";
  await t.buy();
  await t.page.getByText("Não pague de novo", { exact: false }).waitFor();
  assert.equal(await t.page.getByRole("button", { name: "Fazer nova encomenda" }).count(), 0);
});

await test("prazo ultrapassado avisa o comprador", async (t) => {
  t.api.purchase.order.expiresAt = new Date(Date.now() + 3000).toISOString();
  await t.buy();
  await t.page.getByText("A confirmar o pagamento").waitFor();
  await t.page.getByText("Ainda sem confirmação").waitFor({ timeout: 8000 });
});

await test("conta existente: falha visível, sem acesso até a associação resultar", async (t) => {
  t.api.onClaim = (route) =>
    t.api.fail(route, 401, "login_required", "Inicie sessão para continuar.");
  t.pay();
  t.api.purchase.claimStatus = "pending_identity";
  t.api.purchase.claimMode = "existing_account";
  await t.buy();
  await t.page.getByText("Inicie sessão para continuar.").waitFor();
  assert.equal(await t.page.getByText("Aceder ao conteúdo").count(), 0);
  await t.page.getByRole("link", { name: "Iniciar sessão" }).waitFor();
  t.api.onClaim = (route) => t.api.ok(route, { order: t.api.purchase.order });
  await t.page.getByRole("button", { name: "Tentar novamente" }).click();
  await t.page.getByText("Aceder ao conteúdo").waitFor();
});

await test("o parâmetro next não leva para fora do site", async (t) => {
  for (const next of [
    "/\\evil.example",
    "//evil.example",
    "/.//evil.example",
    "https://evil.example",
  ]) {
    await t.page.goto(`${base}/entrar?next=${encodeURIComponent(next)}`);
    await t.page.locator("#login-email").fill("buyer@example.com");
    await t.page.locator("#login-password").fill("palavra-passe-longa");
    await t.page.getByRole("button", { name: "Entrar", exact: true }).click();
    await t.page.waitForURL((url) => url.pathname === "/aluno");
  }
});

await browser.close();
server.close();
process.exitCode = failed ? 1 : 0;
