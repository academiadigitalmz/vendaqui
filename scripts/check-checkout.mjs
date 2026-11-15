// Contract tests run against HTTP fixtures with VITE_USE_MOCKS=false.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const base = process.argv[2] || "http://localhost:4173";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/chromium", headless: true });
const productId = "11111111-1111-4111-8111-111111111111", offerId = "22222222-2222-4222-8222-222222222222", orderId = "33333333-3333-4333-8333-333333333333";
const product = { product: { id: productId, slug: "curso", name: "Curso real", description: "Conteúdo do produto", type: "course", guaranteeDays: 7 }, offers: [{ id: offerId, name: "Oferta principal", priceAmount: 50, currency: "MZN", isActive: true, isDefault: true }], sellerDisplayName: "Produtor real" };
const methods = [{ method: "mpesa", isEnabled: true, ready: true }, { method: "emola", isEnabled: false, ready: true }, { method: "card_visa", isEnabled: true, ready: false }];
const pending = () => ({ order: { id: orderId, orderNumber: "VQ-REAL", status: "pending_payment", totalAmount: 50, currency: "MZN", expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [{ productId, productName: "Curso real", offerName: "Oferta principal", totalAmount: 50 }] }, payment: { id: "payment", status: "processing", confirmationStatus: "pending" }, attempt: { id: "attempt", status: "pending", method: "mpesa" }, claimStatus: "pending_payment" });
let failed = 0;
async function test(name, fn) {
 const ctx = await browser.newContext(); const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(e.message));
 let purchase = pending(), posts = [], retries = [], claims = [], reads = [], lost = false, authenticated = false;
 const json = (route, value, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data: value }) });
 const error = (route, code, message, status = 422) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ error: { code, message } }) });
 await page.route("**/api/v1/**", async route => {
  const req = route.request(), path = new URL(req.url()).pathname, headers = req.headers();
  if (path === "/api/v1/public/products/curso") return json(route, product);
  if (path === "/api/v1/payments/methods") return json(route, methods);
  if (path === "/api/v1/checkout/orders" && req.method() === "POST") {
   posts.push({ body: req.postDataJSON(), headers });
   assert.match(headers["idempotency-key"], /^[a-f0-9-]{36}$/);
   assert.equal(posts.at(-1).body.productId, productId); assert.equal(posts.at(-1).body.offerId, offerId);
   assert.equal(posts.at(-1).body.msisdn, "258844226545");
   if (lost && posts.length === 1) return route.abort("connectionfailed");
   return json(route, { ...purchase, checkoutToken: authenticated ? undefined : headers["idempotency-key"] }, 201);
  }
  if (path === `/api/v1/checkout/orders/${orderId}` && req.method() === "GET") {
   reads.push(headers);
   if (!authenticated) assert.equal(headers["checkout-token"], posts[0].headers["idempotency-key"]);
   return json(route, purchase);
  }
  if (path.endsWith("/payment-attempts")) { retries.push({ body: req.postDataJSON(), headers }); purchase.attempt.status = "pending"; purchase.payment.status = "processing"; return json(route, { payment: purchase.payment, attempt: purchase.attempt }, 201); }
  if (path.endsWith("/claim")) {
   claims.push(req.postDataJSON());
   if (req.postDataJSON().code !== "123456") return error(route, "invalid_claim_code", "Código incorrecto.");
   authenticated = true; purchase.claimStatus = undefined;
   return json(route, { order: purchase.order, accessToken: "buyer-token", user: { ID: "buyer", Name: "Comprador", Email: "buyer@example.com", Password: "must-not-be-persisted" } });
  }
  if (path === "/api/v1/auth/login") { authenticated = true; return json(route, { accessToken: "buyer-token", user: { id: "buyer", name: "Comprador", email: "buyer@example.com" } }); }
  if (path.endsWith("/content")) return json(route, { product: product.product, modules: [{ id: "module", title: "Módulo comprado", lessons: [] }] });
  return error(route, "unexpected_route", path, 404);
 });
 const start = async () => { await page.goto(base + "/checkout/curso"); await page.locator("#co-wallet").waitFor(); if (!authenticated) { await page.locator("#co-name").fill("Comprador real"); await page.locator("#co-email").fill("buyer@example.com"); } await page.locator("#co-wallet").fill("84 422 6545"); await page.getByRole("button", { name: /Pagar 50/ }).click(); };
 try { await fn({page, ctx, start, posts, retries, claims, reads, get purchase(){return purchase}, setLost:()=>lost=true, authenticate: async()=> { authenticated=true; purchase.claimStatus=undefined; await ctx.addInitScript(()=> { localStorage.setItem("vq.token","buyer-token"); localStorage.setItem("vq.session",JSON.stringify({token:"buyer-token",user:{id:"buyer",name:"Comprador",email:"buyer@example.com",role:"student"}})); }); } }); assert.deepEqual(errors, []); console.log("ok " + name); }
 catch(e) { failed++; console.error("FAIL " + name, e); await page.screenshot({ path: "/tmp/checkout-failure.png" }); }
 finally { await ctx.close(); }
}
await test("guest payload, pending reload, no premature success, claim and purchased content", async t => {
 await t.start(); await t.page.getByText("Estamos a confirmar", {exact:false}).waitFor();
 assert.deepEqual(t.posts[0].body.buyer, {name:"Comprador real",email:"buyer@example.com",msisdn:"258844226545"});
 assert.equal(await t.page.getByRole("radio").count(),1); assert.equal(await t.page.getByText("Pagamento aprovado", {exact:true}).count(),0);
 await t.page.reload(); await t.page.getByText("Estamos a confirmar", {exact:false}).waitFor(); assert.equal(t.posts.length,1);
 t.purchase.order.status="paid"; t.purchase.payment.status="succeeded"; t.purchase.attempt.status="succeeded"; t.purchase.claimStatus="pending_identity";
 await t.page.waitForURL(/obrigado/); await t.page.getByText("Associar a compra à sua conta").waitFor();
 await t.page.getByLabel("Código de confirmação").fill("bad"); await t.page.getByLabel("Nova palavra-passe",{exact:false}).fill("strong-password-123"); await t.page.getByRole("button",{name:"Confirmar acesso"}).click(); await t.page.getByText("Código incorrecto.").waitFor();
 await t.page.getByLabel("Código de confirmação").fill("123456"); await t.page.getByRole("button",{name:"Confirmar acesso"}).click(); await t.page.getByRole("link",{name:"Aceder a Curso real"}).click(); await t.page.getByRole("heading",{name:"Módulo comprado"}).waitFor();
 assert.equal(await t.page.evaluate(() => localStorage.getItem("vq.session").includes("must-not-be-persisted")), false);
});
await test("lost create response reuses the exact idempotency key and body after reload", async t => {
 t.setLost(); await t.start(); await t.page.getByText("Não foi possível concluir o pedido").waitFor(); await t.page.reload(); await t.page.getByRole("button",{name:"Retomar pedido"}).click(); await t.page.getByText("Estamos a confirmar",{exact:false}).waitFor();
 assert.equal(t.posts.length,2); assert.equal(t.posts[0].headers["idempotency-key"],t.posts[1].headers["idempotency-key"]); assert.deepEqual(t.posts[0].body,t.posts[1].body);
});
await test("unknown result blocks retry; a confirmed refusal retries the existing order", async t => {
 t.purchase.attempt.status="unknown"; await t.start(); await t.page.getByText("Estamos a confirmar",{exact:false}).waitFor(); assert.equal(await t.page.getByRole("button",{name:"Tentar pagamento novamente"}).count(),0);
 t.purchase.attempt.status="failed"; t.purchase.payment.status="pending"; await t.page.getByRole("button",{name:"Tentar pagamento novamente"}).click(); await t.page.getByText("Estamos a confirmar",{exact:false}).waitFor(); assert.equal(t.posts.length,1); assert.equal(t.retries.length,1); assert.notEqual(t.retries[0].headers["idempotency-key"],t.posts[0].headers["idempotency-key"]); assert.equal(t.retries[0].headers["checkout-token"],t.posts[0].headers["idempotency-key"]);
});
await test("authenticated purchase omits guest identity and keeps bearer token", async t => {
 await t.authenticate(); await t.start(); await t.page.getByText("Estamos a confirmar",{exact:false}).waitFor(); assert.equal(t.posts[0].body.buyer,undefined); assert.equal(t.posts[0].headers.authorization,"Bearer buyer-token");
});
await test("an unknown order never renders a success page", async t => {
 await t.page.goto(base+"/obrigado/missing"); await t.page.getByText("Não foi possível carregar",{exact:false}).waitFor(); assert.equal(await t.page.getByRole("heading",{name:"Pagamento aprovado"}).count(),0);
});
await browser.close(); process.exitCode=failed?1:0;
