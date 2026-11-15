import { http, HttpResponse } from "msw";
import { API_URL } from "@/api/http";
import type { CheckoutProduct, Purchase, PurchaseInput } from "@/api/checkout";

const productId = "11111111-1111-4111-8111-111111111111";
const offerId = "22222222-2222-4222-8222-222222222222";
const product: CheckoutProduct = { product: { id: productId, name: "Excel do Zero ao Avançado", slug: "excel-zero-avancado", description: "Curso de Excel", type: "course", guaranteeDays: 7 }, sellerDisplayName: "Excel com a Ana", offers: [{ id: offerId, name: "Acesso ao curso", priceAmount: 2490, currency: "MZN", isActive: true, isDefault: true }] };
interface Stored { purchase: Purchase; key: string; created: number; guest: boolean; claimed: boolean; retryKeys: string[] }
const read = (): Stored[] => JSON.parse(sessionStorage.getItem("vq.mock.purchases") || "[]");
const save = (rows: Stored[]) => sessionStorage.setItem("vq.mock.purchases", JSON.stringify(rows));
const data = (value: unknown, status = 200) => HttpResponse.json({ data: value }, { status });
const fail = (status: number, code: string, message: string) => HttpResponse.json({ error: { code, message } }, { status });
const route = (path: string) => API_URL + path;
const authorized = (r: Request, row: Stored) => row.guest && !row.claimed ? r.headers.get("Checkout-Token") === row.key : !!r.headers.get("Authorization");
export const checkoutHandlers = [
  http.get(route("/public/products/:slug"), ({ params }) => params.slug === product.product.slug ? data(product) : fail(404, "not_found", "Produto não encontrado.")),
  http.get(route("/payments/methods"), () => data([{ method: "mpesa", isEnabled: true, ready: true }, { method: "emola", isEnabled: true, ready: true }])),
  http.post(route("/checkout/orders"), async ({ request }) => {
    const b = await request.json() as PurchaseInput;
    const key = request.headers.get("Idempotency-Key") || "";
    const rows = read();
    const existing = rows.find(r => r.key === key);
    if (existing) return data(existing.purchase, 201);
    if (!/^[0-9a-f-]{36}$/i.test(key) || b.productId !== productId || b.offerId !== offerId || !["mpesa", "emola"].includes(b.method)) return fail(422, "invalid_checkout_request", "Pedido inválido.");
    const guest = !request.headers.has("Authorization");
    if (guest && (!b.buyer?.name || !b.buyer.email.includes("@") || !b.buyer.msisdn)) return fail(422, "guest_details_required", "Preencha os seus dados.");
    const purchase: Purchase = { order: { id: crypto.randomUUID(), orderNumber: "VQ-DEMO", status: "pending_payment", totalAmount: 2490, currency: "MZN", expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [{ productId, productName: product.product.name, offerName: "Acesso ao curso", totalAmount: 2490 }] }, payment: { id: crypto.randomUUID(), status: "processing", confirmationStatus: "pending" }, attempt: { id: crypto.randomUUID(), method: b.method, status: "pending" }, ...(guest ? { checkoutToken: key, claimStatus: "pending_payment" } : {}) };
    rows.push({ purchase, key, created: Date.now(), guest, claimed: false, retryKeys: [] }); save(rows);
    return data(purchase, 201);
  }),
  http.get(route("/checkout/orders/:id"), ({ params, request }) => {
    const rows = read(), row = rows.find(r => r.purchase.order.id === params.id);
    if (!row || !authorized(request, row)) return fail(404, "not_found", "Compra não encontrada.");
    if (Date.now() - row.created > 2500) {
      row.purchase.order.status = "paid"; row.purchase.payment.status = "succeeded";
      row.purchase.payment.confirmationStatus = "confirmed"; row.purchase.attempt.status = "succeeded";
      row.purchase.claimStatus = row.guest && !row.claimed ? "pending_identity" : undefined;
      save(rows);
    }
    return data(row.purchase);
  }),
  http.post(route("/checkout/orders/:id/payment-attempts"), async ({ params, request }) => {
    const rows = read(), row = rows.find(r => r.purchase.order.id === params.id);
    if (!row || !authorized(request, row)) return fail(404, "not_found", "Compra não encontrada.");
    const key = request.headers.get("Idempotency-Key") || "";
    if (row.retryKeys.includes(key)) return data({ payment: row.purchase.payment, attempt: row.purchase.attempt }, 201);
    if (!["failed", "cancelled"].includes(row.purchase.attempt.status)) return fail(409, "payment_result_unknown", "Aguarde a confirmação.");
    const b = await request.json() as { method: string };
    row.purchase.attempt = { id: crypto.randomUUID(), status: "pending", method: b.method };
    row.purchase.payment.status = "processing"; row.created = Date.now(); row.retryKeys.push(key); save(rows);
    return data({ payment: row.purchase.payment, attempt: row.purchase.attempt }, 201);
  }),
  http.post(route("/checkout/orders/:id/claim"), async ({ params, request }) => {
    const rows = read(), row = rows.find(r => r.purchase.order.id === params.id);
    if (!row || request.headers.get("Checkout-Token") !== row.key) return fail(404, "not_found", "Compra não encontrada.");
    const b = await request.json() as { code: string; password: string };
    if (b.code !== "123456") return fail(422, "invalid_claim_code", "O código de confirmação é inválido.");
    if (!request.headers.has("Authorization") && b.password.length < 12) return fail(422, "invalid_password", "Use pelo menos 12 caracteres.");
    row.claimed = true; row.purchase.claimStatus = undefined; save(rows);
    return data({ order: row.purchase.order, accessToken: "demo-claimed", user: { id: "buyer", name: "Comprador", email: "comprador@example.com" } });
  }),
  http.get(route("/me/products/:id/content"), ({ params, request }) => request.headers.has("Authorization") ? data({ product: { ...product.product, id: params.id }, modules: [{ id: "module", title: "Introdução", lessons: [] }] }) : fail(401, "invalid_credentials", "Inicie sessão para aceder.")),
];
