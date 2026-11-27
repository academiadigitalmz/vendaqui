// Testes de sessão e saques no browser, com a API simulada por HTTP.
// Uso: npm run build && npm run test:account
import assert from "node:assert/strict";
import { fail, ok, startHarness } from "./browser-harness.mjs";

const harness = await startHarness();
const user = (id) => ({
  id,
  name: `Produtor ${id}`,
  email: `${id}@example.com`,
  msisdn: "+258840000000",
  status: "active",
});
const empty = { items: [], total: 0, page: 1, pageSize: 50, series: [], period: { days: 30 } };
const metric = { value: 0, previousValue: 0, changePercent: null };

const test = (name, fn) =>
  harness.test(name, async ({ page, base }) => {
    const api = {
      cookie: null,
      logoutFails: false,
      payoutStatus: 0,
      payouts: [],
      balanceReads: [],
    };
    await page.route("**/api/v1/**", (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace("/api/v1", "");
      const who = (request.headers().authorization || "").replace("Bearer token-", "");
      // O primeiro carácter do email identifica o produtor: a@… é "a".
      if (path === "/auth/login") {
        api.cookie = request.postDataJSON().email[0];
        return ok(route, { accessToken: `token-${api.cookie}`, user: user(api.cookie) });
      }
      if (path === "/auth/refresh")
        return api.cookie
          ? ok(route, { accessToken: `token-${api.cookie}` })
          : fail(route, 401, "no_session", "Sem sessão.");
      if (path === "/auth/logout") {
        if (api.logoutFails) return route.abort("connectionfailed");
        api.cookie = null;
        return route.fulfill({ status: 204, body: "" });
      }
      if (path === "/backoffice/auth/login")
        return ok(route, {
          accessToken: "token-staff",
          staff: { id: "staff", name: "Operação", email: "s@example.com" },
        });
      if (path === "/backoffice/finance/overview")
        return ok(route, { confirmedPayments: 0, commissionRevenue: 0, payoutsInFlight: 0 });
      if (path === "/backoffice/payouts")
        return ok(route, {
          ...empty,
          items: [
            {
              id: "p1",
              destinationName: "Titular Real",
              destinationReference: "841234567",
              provider: "mpesa",
              amount: 750,
              status: "pending_approval",
              requestedAt: "2026-11-20T10:00:00Z",
            },
          ],
        });
      if (path === "/me") return ok(route, user(who));
      if (path === "/seller/profile")
        return ok(route, { id: who, displayName: `Loja ${who}`, nuit: "1", status: "active" });
      if (path === "/seller/verification")
        return ok(route, { verification: { id: "v", status: "approved" }, documents: [] });
      if (path === "/seller/finance/balance") {
        api.balanceReads.push(who);
        return ok(route, {
          available: who === "a" ? 9000 : 4000,
          pending: 0,
          reserved: 0,
          payoutInTransit: 0,
          currency: "MZN",
        });
      }
      if (path === "/seller/payout-accounts")
        return ok(route, [
          {
            id: `account-${who}`,
            provider: "mpesa",
            accountName: `Titular ${who}`,
            accountReference: "84***",
            status: "active",
          },
        ]);
      if (path === "/seller/payouts" && request.method() === "POST") {
        api.payouts.push({
          who,
          body: request.postDataJSON(),
          key: request.headers()["idempotency-key"],
        });
        return api.payoutStatus
          ? fail(route, api.payoutStatus, "payout_refused", "Pedido recusado.")
          : route.abort("connectionfailed");
      }
      if (path.endsWith("unread-count")) return ok(route, { count: 0 });
      return ok(route, {
        ...empty,
        netRevenue: metric,
        approvedSales: metric,
        averageTicket: metric,
      });
    });

    const login = async (id) => {
      await page.locator("#login-email").fill(`${id}@example.com`);
      await page.locator("#login-password").fill("palavra-passe-longa");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      // Depois de sair, o destino pode ser a página onde o anterior estava.
      await page.waitForURL((url) => url.pathname.startsWith("/produtor"));
    };
    const logout = async () => {
      await page.locator(".vq-account-trigger").click();
      await page.getByRole("button", { name: "Terminar sessão" }).click();
    };
    const finance = async () => {
      // Um saque pendente abre o diálogo por cima do menu quando já se está na página.
      if (new URL(page.url()).pathname !== "/produtor/financeiro")
        await page.locator('a[href="/produtor/financeiro"]').first().click();
      await page.locator(".balance-card .big").waitFor();
    };
    const balance = () => page.locator(".balance-card .big").innerText();
    const dialog = page.getByRole("dialog");
    const askPayout = async () => {
      await page.getByRole("button", { name: "Solicitar saque" }).click();
      await dialog.locator('input[type="number"]').fill("500");
      const select = dialog.locator("select");
      if (await select.count()) await select.selectOption("account-a");
      else {
        await dialog.getByText("Seleccione um destino").click();
        await page.getByText("M-Pesa · Titular a").last().click();
      }
      await dialog.getByRole("button", { name: "Confirmar saque" }).click();
      await dialog.getByText("Não foi possível confirmar o pedido").waitFor();
    };

    await fn({ page, base, api, login, logout, finance, balance, askPayout, dialog });
  });

await test("quem entra a seguir não vê dados em cache do anterior", async (t) => {
  await t.page.goto(`${t.base}/entrar`);
  await t.login("a");
  await t.finance();
  assert.match(await t.balance(), /9\s?000/);
  await t.logout();
  await t.page.waitForURL(/\/entrar/);
  await t.login("b");
  await t.finance();
  assert.match(await t.balance(), /4\s?000/);
  assert.equal(t.api.balanceReads.at(-1), "b");
});

await test("um saque por confirmar fica com o dono e retoma com a mesma chave", async (t) => {
  await t.page.goto(`${t.base}/entrar`);
  await t.login("a");
  await t.finance();
  await t.askPayout();
  // O diálogo pode ser fechado sem perder a operação.
  await t.dialog.getByRole("button", { name: "Fechar" }).last().click();
  await t.logout();
  await t.page.waitForURL(/\/entrar/);
  await t.login("b");
  await t.finance();
  await t.page.getByRole("button", { name: "Solicitar saque" }).waitFor();
  assert.equal(await t.dialog.count(), 0);
  await t.logout();
  await t.page.waitForURL(/\/entrar/);
  await t.login("a");
  await t.finance();
  await t.dialog.getByRole("button", { name: "Retomar pedido" }).click();
  await t.dialog.getByText("Não foi possível confirmar o pedido").waitFor();
  assert.deepEqual(
    t.api.payouts.map((p) => p.who),
    ["a", "a"],
  );
  assert.equal(t.api.payouts[0].key, t.api.payouts[1].key);
});

await test("só uma recusa definitiva descarta a referência do saque", async (t) => {
  await t.page.goto(`${t.base}/entrar`);
  await t.login("a");
  await t.finance();
  t.api.payoutStatus = 429;
  await t.askPayout();
  await t.dialog.getByRole("button", { name: "Retomar pedido" }).click();
  await t.page.waitForTimeout(300);
  assert.equal(t.api.payouts[0].key, t.api.payouts[1].key);
  t.api.payoutStatus = 422;
  await t.dialog.getByRole("button", { name: "Retomar pedido" }).click();
  await t.dialog.getByRole("button", { name: "Confirmar saque" }).click();
  await t.page.waitForTimeout(300);
  assert.notEqual(t.api.payouts[2].key, t.api.payouts[3].key);
});

await test("uma saída que falha avisa e mantém a sessão", async (t) => {
  await t.page.goto(`${t.base}/entrar`);
  await t.login("a");
  t.api.logoutFails = true;
  await t.logout();
  await t.page.getByText("Não foi possível terminar a sessão").waitFor();
  assert.equal(new URL(t.page.url()).pathname, "/produtor");
  // A aplicação continua autenticada.
  await t.finance();
  assert.equal(t.api.balanceReads.at(-1), "a");
  t.api.logoutFails = false;
  await t.logout();
  await t.page.waitForURL(/\/entrar/);
  assert.equal(t.api.cookie, null);
});

await test("a aprovação de um saque mostra o destino", async (t) => {
  await t.page.goto(`${t.base}/admin/entrar`);
  await t.page.locator("#staff-email").fill("s@example.com");
  await t.page.locator("#staff-password").fill("palavra-passe-longa");
  await t.page.getByRole("button", { name: "Entrar no backoffice" }).click();
  await t.page.locator('a[href="/admin/saques"]').first().click();
  await t.page.getByText("M-Pesa · 841234567").waitFor();
  await t.page.getByRole("button", { name: "Aprovar" }).click();
  await t.dialog.getByText("841234567", { exact: false }).waitFor();
  await t.dialog.getByText("Titular Real", { exact: false }).waitFor();
});

await harness.close();
