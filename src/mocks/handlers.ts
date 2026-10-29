/**
 * Implementação simulada da API (MSW). Serve de demonstração no Vercel e de
 * referência viva do contrato: cada handler devolve exatamente o formato de
 * src/api/types.ts. Quando o backend existir, ponha VITE_USE_MOCKS=false.
 */
import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/api/http";
import type * as T from "@/api/types";
import { DEMO_USERS } from "@/lib/demo-users";
import {
  ADMIN_PAYOUTS, CHECKOUT_DEFAULT, COUPONS, DAYS30, FEE, KYC, NAMES, PAYOUTS_SELLER, PRODUCTS, SALES, SELLERS,
  course, dayLabel, emailOf, pick, progressDone, reseed, rnd, series, CITIES, daysAgoIso,
} from "./data";

const url = (p: string) => API_URL + p;
const ok = async <X,>(body: X, ms = 220) => { await delay(ms); return HttpResponse.json(body as never); };
const err = (status: number, code: string, message: string) => HttpResponse.json({ code, message }, { status });
const page = <X,>(items: X[], p = 1, size = 12): T.Paginated<X> => ({ items: items.slice((p - 1) * size, p * size), page: p, pageSize: size, total: items.length });

const { seller: SELLER_USER, admin: ADMIN_USER, student: STUDENT_USER } = DEMO_USERS;
const userFor = (email: string): T.User => (email.includes("vendaqui") || email.startsWith("admin") ? ADMIN_USER : email.includes("celso") || email.startsWith("aluno") ? STUDENT_USER : SELLER_USER);

const balance: T.Balance = { available: 48320, pending: 126480, reserve: 18210, nextRelease: { date: "2026-10-24T00:00:00Z", amount: 6120 } };
const checkoutSettings: Record<string, T.CheckoutSettings> = {};
const settingsFor = (id: string) => (checkoutSettings[id] ??= structuredClone(CHECKOUT_DEFAULT));
const orders = new Map<string, { order: T.Order; created: number }>();
let orderSeq = 48214;
let kyc = [...KYC];
let moderation: T.ModerationItem[] = [
  { id: "MOD-1", productName: "Templates de Gestão Financeira", seller: "Excel com a Ana", type: "ebook", price: 990, cover: "red", flags: [] },
  { id: "MOD-2", productName: "Método Lucro Diário no Forex", seller: "Trader Fácil MZ", type: "course", price: 12000, cover: "slate", flags: ["Promessa de ganhos garantidos", "Produtor com chargeback de 6,4%"] },
  { id: "MOD-3", productName: "Bolos de Festa para Vender", seller: "Doces da Matilde", type: "course", price: 1500, cover: "orange", flags: [] },
  { id: "MOD-4", productName: "Inglês para Entrevistas · Turma 3", seller: "Talk Moz", type: "course", price: 2900, cover: "blue", flags: [] },
  { id: "MOD-5", productName: "Emagreça 10 kg em 10 dias", seller: "Beleza Natural", type: "ebook", price: 350, cover: "green", flags: ["Alegação de saúde sem fundamento"] },
];
const affiliateRequests: T.AffiliateRequest[] = [
  { id: "ar1", name: "Arsénio Bila", audience: "Instagram · 12 mil seguidores", productName: "Excel do Zero ao Avançado" },
  { id: "ar2", name: "Elsa Nhamuave", audience: "Grupo de WhatsApp de contabilistas", productName: "Ebook: 100 Fórmulas de Excel" },
  { id: "ar3", name: "Francisco Tamele", audience: "Canal de YouTube · 4 mil subscritores", productName: "Excel do Zero ao Avançado" },
  { id: "ar4", name: "Lina Macuácua", audience: "TikTok · 31 mil seguidores", productName: "Clube Excel Pro" },
];
const automations: T.RecoveryAutomation[] = [
  { id: "ra1", channel: "sms", title: "SMS", delay: "15 minutos depois", message: "Olá {nome}, o seu pagamento de {produto} não foi concluído. Termine aqui: {link}", enabled: true },
  { id: "ra2", channel: "whatsapp", title: "WhatsApp", delay: "1 hora depois", message: "Mensagem com o link e uma pergunta: precisa de ajuda com o pagamento?", enabled: true },
  { id: "ra3", channel: "email", title: "Email com cupão", delay: "24 horas depois", message: "Oferece 10% de desconto válido por 48 horas.", enabled: false },
];
const purchases: T.Purchase[] = [
  { id: "pu1", orderId: "VQ-48214", productName: "Excel do Zero ao Avançado", date: "2026-10-22T09:50:00Z", method: "applepay", amount: 2490, status: "approved", refundableUntil: "2026-10-29T23:59:00Z" },
  { id: "pu2", orderId: "VQ-48214", productName: "Ebook: 100 Fórmulas de Excel", date: "2026-10-22T09:50:00Z", method: "applepay", amount: 190, status: "approved", refundableUntil: "2026-10-29T23:59:00Z" },
  { id: "pu3", orderId: "VQ-46102", productName: "Clube Excel Pro · outubro", date: "2026-10-14T08:00:00Z", method: "emola", amount: 790, status: "approved" },
  { id: "pu4", orderId: "VQ-43988", productName: "Clube Excel Pro · setembro", date: "2026-09-14T08:00:00Z", method: "emola", amount: 790, status: "approved" },
];

const PERIOD_FACTOR: Record<T.Period, number> = { today: 0.034, "7d": 0.24, "30d": 1, "12m": 10.8 };
const REV30 = series(30, 52000, 0.2, 650, 5);

function saleDetail(s: T.Sale): T.SaleDetail {
  const t = new Date(s.createdAt).getTime();
  const at = (ms: number) => new Date(t + ms).toISOString();
  const tl: T.SaleEvent[] = [
    { at: at(-90000), label: "Pedido criado no checkout", tone: "neutral" },
    { at: at(-60000), label: s.method === "mpesa" || s.method === "emola" ? `Pedido de PIN enviado para ${s.buyer.phone}` : "Pagamento autorizado pelo emissor", tone: "info" },
  ];
  if (s.status === "approved") tl.push({ at: s.createdAt, label: "Pagamento aprovado", tone: "success" }, { at: at(20000), label: "Acesso enviado por email e SMS", tone: "success" });
  else tl.push({ at: s.createdAt, label: { pending: "A aguardar confirmação do comprador", declined: "Pagamento recusado", refunded: "Venda reembolsada", chargeback: "Chargeback recebido", expired: "Pedido expirou" }[s.status as Exclude<T.SaleStatus, "approved">], tone: s.status === "pending" ? "warning" : s.status === "refunded" || s.status === "expired" ? "neutral" : "danger" });
  return { ...s, timeline: tl, tracking: { source: s.affiliate ? "Link de afiliado" : "Instagram · anúncio", utmCampaign: "excel-out-26", pixel: "Purchase enviado" }, device: "197.218.x.x · Android" };
}

export const handlers = [
  /* ── Autenticação ── */
  http.post(url("/auth/login"), async ({ request }) => {
    const b = (await request.json()) as T.LoginInput;
    if (!b.email) return err(422, "invalid_credentials", "Indique o email.");
    return ok<T.Session>({ token: "demo-" + Date.now(), user: userFor(b.email) }, 400);
  }),
  http.post(url("/auth/register"), async ({ request }) => {
    const b = (await request.json()) as T.RegisterInput;
    return ok<T.Session>({ token: "demo-" + Date.now(), user: { ...SELLER_USER, name: b.name || SELLER_USER.name, email: b.email || SELLER_USER.email, business: { name: b.businessName, nuit: b.nuit, kycStatus: "pending" } } }, 500);
  }),
  http.get(url("/me"), () => ok(SELLER_USER)),

  /* ── Produtor ── */
  http.get(url("/seller/dashboard"), ({ request }) => {
    const period = (new URL(request.url).searchParams.get("period") || "30d") as T.Period;
    const f = PERIOD_FACTOR[period] ?? 1;
    const labels12 = ["nov", "dez", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out"];
    const hours = ["08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h"];
    const values = period === "12m" ? series(12, 1200000, 0.12, 30000, 9) : period === "7d" ? REV30.slice(-7) : period === "today" ? series(12, 4200, 0.4, 120, 4) : REV30;
    const labels = period === "12m" ? labels12 : period === "today" ? hours : (period === "7d" ? DAYS30.slice(-7) : DAYS30).map(dayLabel);
    const revenue = 1648230 * f;
    const n = Math.round(771 * f);
    const body: T.Dashboard = {
      period, revenueNet: revenue, approvedSales: n, affiliateSales: Math.round(n * 0.11), avgTicket: 2137.6, conversion: 7.8, refundRate: 0.9,
      deltas: { revenue: 12.4, sales: 8.1, ticket: 3.2, conversion: -0.6 },
      series: values.map((value, i) => ({ label: labels[i], value })),
      salesSpark: REV30.slice(-14).map((v) => Math.round(v / 2140)),
      methods: [{ method: "mpesa", share: 46.3, approvalRate: 98.1 }, { method: "emola", share: 18.2, approvalRate: 94.6 }, { method: "card", share: 15.4, approvalRate: 86.3 }, { method: "applepay", share: 10.8, approvalRate: 93.4 }, { method: "googlepay", share: 9.3, approvalRate: 92.1 }],
      topProducts: PRODUCTS.slice(0, 4).map((p, i) => ({ productId: p.id, name: p.name, type: p.type, cover: p.cover, share: [0.52, 0.27, 0.13, 0.08][i], revenue: revenue * [0.52, 0.27, 0.13, 0.08][i] })),
      balance, plaque: { goal: 10000000, total: 5870340 },
      onboarding: [
        { key: "kyc", label: "Verificar identidade", done: true, href: "/produtor/conta?tab=verificacao" },
        { key: "product", label: "Criar o primeiro produto", done: true, href: "/produtor/produtos/novo" },
        { key: "payout", label: "Adicionar conta de recebimento", done: true, href: "/produtor/financeiro" },
        { key: "pixel", label: "Ligar o Pixel da Meta", done: false, href: "/produtor/integracoes" },
        { key: "affiliate", label: "Convidar o primeiro afiliado", done: false, href: "/produtor/afiliados" },
      ],
      salesToday: 37,
    };
    return ok(body);
  }),
  http.get(url("/seller/products"), () => ok(PRODUCTS)),
  http.post(url("/seller/products"), async ({ request }) => {
    const b = (await request.json()) as T.ProductInput;
    const p: T.Product = { id: "p" + (PRODUCTS.length + 1), name: b.name, slug: b.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), type: b.type, price: b.price, recurring: b.recurring, status: "in_review", cover: "red", sales: 0, revenue: 0, conversion: 0, students: 0, createdAt: new Date().toISOString() };
    PRODUCTS.push(p);
    return ok(p, 500);
  }),
  http.get(url("/seller/products/:id"), ({ params }) => {
    const p = PRODUCTS.find((x) => x.id === params.id);
    if (!p) return err(404, "not_found", "Produto não encontrado.");
    const d: T.ProductDetail = {
      ...p, description: "Do primeiro clique à tabela dinâmica: 20 aulas práticas com ficheiros de exercício reais, certificado no fim e suporte na comunidade.",
      guaranteeDays: 7, salesPageUrl: "https://excelcomaana.co.mz/curso", checkoutUrl: `https://pay.vendaqui.co.mz/${p.slug}`,
      offers: [
        { id: "o1", name: "Principal", price: p.price, slug: "", active: true, sales: 964 },
        { id: "o2", name: "Black Friday · 40%", price: Math.round(p.price * 0.6), slug: "bf26", active: false, sales: 0 },
        { id: "o3", name: "Combo Excel + Power BI", price: p.price + 2990, slug: "combo", active: true, sales: 141 },
        { id: "o4", name: "Turma fechada empresas (10 acessos)", price: p.price * 7, slug: "empresas", active: true, sales: 12 },
      ],
      checkout: settingsFor(p.id),
      upsell: { enabled: true, title: "Power BI com 40% de desconto", price: 2390, acceptRate: 11.2 },
      affiliate: { enabled: true, autoApprove: false, commissionPercent: 40, cookieDays: 60, attribution: "last_click", materialsUrl: "https://drive.google.com/excelcomaana-afiliados" },
      bumpStats: { acceptRate: 28.4, extraRevenue30d: 41420 },
    };
    return ok(d);
  }),
  http.patch(url("/seller/products/:id"), async ({ params, request }) => {
    const p = PRODUCTS.find((x) => x.id === params.id);
    if (!p) return err(404, "not_found", "Produto não encontrado.");
    Object.assign(p, await request.json());
    return ok(p);
  }),
  http.put(url("/seller/products/:id/checkout"), async ({ params, request }) => {
    checkoutSettings[String(params.id)] = (await request.json()) as T.CheckoutSettings;
    return ok(checkoutSettings[String(params.id)]);
  }),
  http.get(url("/seller/sales"), ({ request }) => {
    const q = new URL(request.url).searchParams;
    const term = (q.get("q") || "").toLowerCase();
    const rows = SALES.filter((s) => (!q.get("status") || s.status === q.get("status")) && (!q.get("method") || s.method === q.get("method")) && (!q.get("productId") || s.product.id === q.get("productId")) && (!term || (s.buyer.name + s.id + s.buyer.email).toLowerCase().includes(term)));
    const counts = { approved: 0, pending: 0, declined: 0, refunded: 0, chargeback: 0, expired: 0 } as Record<T.SaleStatus, number>;
    SALES.forEach((s) => counts[s.status]++);
    const body: T.SalesPage = { ...page(rows, Number(q.get("page") || 1)), counts, approvedAmount: SALES.filter((s) => s.status === "approved").reduce((a, s) => a + s.amount, 0) };
    return ok(body);
  }),
  http.get(url("/seller/sales/:id"), ({ params }) => {
    const s = SALES.find((x) => x.id === params.id);
    return s ? ok(saleDetail(s)) : err(404, "not_found", "Venda não encontrada.");
  }),
  http.post(url("/seller/sales/:id/refund"), ({ params }) => {
    const s = SALES.find((x) => x.id === params.id);
    if (!s) return err(404, "not_found", "Venda não encontrada.");
    if (s.status !== "approved") return err(409, "not_refundable", "Só vendas aprovadas podem ser reembolsadas.");
    s.status = "refunded";
    return ok(saleDetail(s), 500);
  }),
  http.post(url("/seller/sales/:id/resend-access"), async () => { await delay(300); return new HttpResponse(null, { status: 204 }); }),
  http.get(url("/seller/subscriptions"), () => {
    reseed(77);
    const items: T.Subscription[] = NAMES.slice(0, 10).map((n, i) => ({
      id: "sub" + i, subscriber: { name: n, email: emailOf(n) }, method: pick(["mpesa", "mpesa", "emola", "card", "applepay"] as const),
      since: new Date(2026, 2 + (i % 7), 14).toISOString(), nextCharge: i === 7 ? undefined : new Date(2026, 10, 10 + i).toISOString(),
      status: i === 3 ? "past_due" : i === 7 ? "canceled" : "active", totalPaid: 790 * (2 + (i % 7)),
    }));
    return ok({ summary: { mrr: 251220, mrrDelta: 6.3, active: 318, newThisMonth: 24, churn: 4.2, churned30d: 13, pendingRenewals: 12 }, items, total: 318 });
  }),
  http.get(url("/seller/customers"), ({ request }) => {
    reseed(99);
    const term = (new URL(request.url).searchParams.get("q") || "").toLowerCase();
    const all: T.Customer[] = NAMES.slice(0, 12).map((n, i) => ({ id: "cu" + i, name: n, email: emailOf(n), city: pick(CITIES), purchases: 1 + Math.floor(rnd() * 4), totalSpent: Math.round(450 + rnd() * 9000), lastPurchaseAt: SALES[i * 3].createdAt }));
    const items = all.filter((c) => !term || (c.name + c.email).toLowerCase().includes(term));
    return ok({ summary: { total: 3641, repeatRate: 23.5, avgValue: 3104, topCity: "Maputo", topCityShare: 41 }, items, page: 1, pageSize: 12, total: term ? items.length : 3641 });
  }),
  http.get(url("/seller/affiliates"), () => ok<T.AffiliatesOverview>({
    summary: { sales: 383, salesShare: 11, commissionsPaid: 268080, active: 42, defaultCommission: 40, cookieDays: 60 },
    affiliates: ([["Kelvin Duarte", 184, 128400, 6.1, "active"], ["Sónia Matavele", 97, 71910, 4.8, "active"], ["Pedro Uamusse", 61, 42670, 3.9, "active"], ["Inês Cuamba", 33, 20120, 2.7, "active"], ["Wilson Mondego", 8, 4980, 1.1, "suspended"]] as const)
      .map(([name, sales, commissions, conversion, status], i) => ({ id: "af" + i, name, email: emailOf(name), sales, commissions, conversion, status })),
    requests: affiliateRequests,
    marketplace: [
      { id: "mk1", name: "Finanças para Jovens", producer: "Nélio Cumbe", type: "course", cover: "green", price: 1890, commissionPercent: 50, rating: 4.8 },
      { id: "mk2", name: "Inglês para Entrevistas", producer: "Talk Moz", type: "course", cover: "blue", price: 2900, commissionPercent: 45, rating: 4.9 },
      { id: "mk3", name: "Guia do Agronegócio", producer: "Campo Vivo", type: "ebook", cover: "teal", price: 650, commissionPercent: 60, rating: 4.6 },
      { id: "mk4", name: "Fotografia com Telemóvel", producer: "Lente Moz", type: "course", cover: "purple", price: 1500, commissionPercent: 40, rating: 4.7 },
    ],
  })),
  http.post(url("/seller/affiliates/requests/:id"), async ({ params }) => {
    const i = affiliateRequests.findIndex((r) => r.id === params.id);
    if (i >= 0) affiliateRequests.splice(i, 1);
    await delay(250);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(url("/seller/coupons"), () => ok(COUPONS)),
  http.post(url("/seller/coupons"), async ({ request }) => {
    const b = (await request.json()) as T.CouponInput;
    const code = (b.code || "").toUpperCase().replace(/\s+/g, "");
    if (!code) return err(422, "invalid_code", "Indique um código.");
    if (COUPONS.some((c) => c.code === code)) return err(409, "duplicate_code", `O cupão ${code} já existe.`);
    const c: T.Coupon = { id: "c" + Date.now(), code, discount: { kind: b.kind, value: b.value }, uses: 0, limit: b.limit, expiresAt: b.expiresAt, products: b.productId ? [b.productId] : "all", productsLabel: b.productId ? PRODUCTS.find((p) => p.id === b.productId)?.name ?? "1 produto" : "Todos", status: "active" };
    COUPONS.unshift(c);
    return ok(c, 400);
  }),
  http.get(url("/seller/recovery"), () => ok<T.RecoveryOverview>({
    summary: { abandoned: 214, recovered: 61, recoveredAmount: 98400, rate: 28.5, rateDelta: 4.1 },
    automations,
    carts: SALES.filter((s) => s.status !== "approved" && s.status !== "refunded").slice(0, 7).map((s) => ({ id: s.id, buyer: { name: s.buyer.name, phone: s.buyer.phone }, productName: s.product.name, amount: s.amount, reason: s.status === "pending" ? "PIN não introduzido" : s.status === "declined" ? "Saldo insuficiente" : "Pedido expirou" })),
  })),
  http.patch(url("/seller/recovery/automations/:id"), async ({ params, request }) => {
    const a = automations.find((x) => x.id === params.id);
    if (!a) return err(404, "not_found", "Automação não encontrada.");
    a.enabled = ((await request.json()) as { enabled: boolean }).enabled;
    return ok(a);
  }),
  http.post(url("/seller/recovery/carts/:id/contact"), async () => { await delay(300); return new HttpResponse(null, { status: 204 }); }),
  http.get(url("/seller/courses/:productId"), ({ params }) => ok(course(String(params.productId), false))),
  http.get(url("/seller/finance"), () => {
    const credits = SALES.filter((s) => s.status === "approved").slice(0, 7).map((s) => ({ id: "st-" + s.id, at: s.createdAt, description: `Venda ${s.id} · ${s.product.name}`, amount: s.net }));
    credits.splice(2, 0, { id: "st-sq", at: "2026-10-21T18:02:00Z", description: "Saque para M-Pesa 84 ••• •471", amount: -35000 });
    credits.splice(5, 0, { id: "st-rf", at: "2026-10-21T09:15:00Z", description: "Reembolso VQ-48180", amount: -2367.99 });
    const body: T.Finance = {
      balance, statement: { items: credits, page: 1, pageSize: 9, total: 1284 }, payouts: PAYOUTS_SELLER,
      accounts: [
        { id: "acc1", kind: "mpesa", label: "M-Pesa", masked: "84 ••• •471", fee: 0, eta: "cerca de 40 segundos", primary: true },
        { id: "acc2", kind: "bank", label: "BCI", masked: "NIB •••• 2281 5", fee: 25, eta: "1 dia útil", primary: false },
      ],
      releaseRules: [{ method: "mpesa", days: 2 }, { method: "emola", days: 2 }, { method: "card", days: 14 }, { method: "applepay", days: 14 }, { method: "googlepay", days: 14 }],
      reservePercent: 5, reserveDays: 30, fee: { percent: FEE.percent, fixed: FEE.fixed },
    };
    return ok(body);
  }),
  http.post(url("/seller/payouts"), async ({ request }) => {
    const b = (await request.json()) as T.PayoutInput;
    if (!(b.amount >= 100)) return err(422, "min_amount", "O valor mínimo de saque é 100 MT.");
    if (b.amount > balance.available) return err(422, "insufficient_balance", "O valor é maior do que o saldo disponível.");
    balance.available = +(balance.available - b.amount).toFixed(2);
    const p: T.Payout = { id: "SQ-" + (9935 + PAYOUTS_SELLER.length), requestedAt: new Date().toISOString(), destination: b.accountId === "acc2" ? "bank" : "mpesa", amount: b.amount, status: b.accountId === "acc2" ? "processing" : "paid" };
    PAYOUTS_SELLER.unshift(p);
    return ok(p, 600);
  }),
  http.get(url("/seller/integrations"), () => ok<T.IntegrationsOverview>({
    integrations: [
      { id: "meta", name: "Meta Pixel", description: "Envia Purchase, InitiateCheckout e AddPaymentInfo com API de conversões.", color: "#1d4ed8", letter: "M", connected: true },
      { id: "tiktok", name: "TikTok Pixel", description: "Eventos de compra para otimizar campanhas no TikTok Ads.", color: "#111722", letter: "T", connected: true },
      { id: "gads", name: "Google Ads", description: "Conversões de compra com valor em meticais.", color: "#12884c", letter: "G", connected: false },
      { id: "ga4", name: "Google Analytics 4", description: "Funil do checkout e origem das vendas.", color: "#b86d04", letter: "A", connected: false },
      { id: "wa", name: "WhatsApp Business", description: "Mensagens de recuperação e de boas-vindas.", color: "#0b7a4c", letter: "W", connected: true },
      { id: "mail", name: "Email marketing", description: "Adiciona compradores a listas no Mailchimp ou Brevo.", color: "#7022b2", letter: "@", connected: false },
    ],
    apiKeys: [{ id: "k1", label: "Produção", masked: "vq_live_••••••••••••••••••••3f9a", mode: "live" }, { id: "k2", label: "Teste", masked: "vq_test_••••••••••••••••••••a71c", mode: "test" }],
    webhooks: [
      { id: "w1", url: "https://api.excelcomaana.co.mz/vq", events: ["sale.approved", "sale.refunded"], lastDelivery: { status: 200, at: daysAgoIso(0.003) } },
      { id: "w2", url: "https://hooks.zapier.com/…/8812", events: ["subscription.canceled"], lastDelivery: { status: 200, at: daysAgoIso(1) } },
    ],
  })),
  http.get(url("/seller/account"), () => ok<T.Account>({
    profile: { businessName: "Excel com a Ana", supportEmail: "suporte@excelcomaana.co.mz", supportWhatsapp: "84 312 4471", website: "excelcomaana.co.mz" },
    verification: {
      level: 2, verifiedAt: "2025-03-14T00:00:00Z",
      documents: [
        { label: "BI e selfie", status: "approved", note: "Aprovado a 14 mar 2025" },
        { label: "NUIT 400 128 765", status: "approved", note: "Validado na Autoridade Tributária" },
        { label: "Comprovativo de morada", status: "approved", note: "Aprovado a 15 mar 2025" },
        { label: "Certidão comercial", status: "not_started", note: "Necessária só para vendas acima de 2 milhões MT/mês" },
      ],
      limits: [{ label: "Nível 1 · só BI", value: "até 50 000 MT por mês" }, { label: "Nível 2 · BI, NUIT e morada", value: "sem limite" }, { label: "Saque máximo por dia", value: "500 000 MT" }],
    },
    notifications: [
      { key: "sale", label: "Cada venda aprovada", channel: "Push e som no telemóvel", enabled: true },
      { key: "daily", label: "Resumo diário", channel: "Email às 20h com as vendas do dia", enabled: true },
      { key: "refund", label: "Pedidos de reembolso", channel: "Email e SMS", enabled: true },
      { key: "affiliate", label: "Novos pedidos de afiliação", channel: "Email", enabled: false },
      { key: "payout", label: "Saques concluídos", channel: "SMS", enabled: true },
    ],
    security: { twoFactor: true, confirmLargePayouts: true, sessions: [{ device: "Chrome · macOS (esta)", city: "Maputo", lastSeen: "Agora" }, { device: "App · Android", city: "Maputo", lastSeen: "Há 2 h" }, { device: "Safari · iPhone", city: "Matola", lastSeen: "Há 3 dias" }] },
    team: [
      { id: "t1", name: "Ana Sitoe", email: "ana@excelcomaana.co.mz", role: "Dona da conta", access: "Tudo" },
      { id: "t2", name: "Jaime Novela", email: "jaime@excelcomaana.co.mz", role: "Suporte", access: "Vendas, clientes, reembolsos" },
      { id: "t3", name: "Clara Muthemba", email: "clara@agencia.co.mz", role: "Marketing", access: "Cupões, integrações, relatórios" },
    ],
  })),
  http.patch(url("/seller/account/profile"), async ({ request }) => ok(await request.json())),

  /* ── Checkout público ── */
  http.get(url("/public/checkout/:slug"), ({ params }) => {
    const p = PRODUCTS.find((x) => x.slug === params.slug) ?? PRODUCTS[0];
    return ok<T.PublicCheckout>({ slug: p.slug, product: { id: p.id, name: p.name, subtitle: p.type === "course" ? "Curso online · 20 aulas · acesso por 1 ano" : "Acesso imediato", price: p.price, cover: p.cover, type: p.type }, seller: { name: "Excel com a Ana", nuit: "400 128 765" }, guaranteeDays: 7, settings: settingsFor(p.id) });
  }),
  http.post(url("/public/checkout/:slug/coupons"), async ({ request }) => {
    const { code } = (await request.json()) as { code: string };
    const c = COUPONS.find((x) => x.code === String(code).trim().toUpperCase() && x.status === "active" && x.discount.kind === "percent");
    return ok<T.CouponCheck>(c ? { valid: true, percent: c.discount.value } : { valid: false, message: "Este cupão não existe ou já expirou." }, 300);
  }),
  http.post(url("/public/checkout/:slug/orders"), async ({ params, request }) => {
    const b = (await request.json()) as T.OrderInput;
    if (!b.buyer?.name || !/.+@.+\..+/.test(b.buyer?.email || "")) return err(422, "invalid_buyer", "Preencha o nome e um email válido para receber o acesso.");
    const prefix = (b.walletPhone || "").replace(/\D/g, "").replace(/^258/, "").slice(0, 2);
    if (b.method === "mpesa" && !["84", "85"].includes(prefix)) return err(422, "wallet_mismatch", "Use um número Vodacom (84 ou 85) para pagar com M-Pesa.");
    if (b.method === "emola" && !["86", "87"].includes(prefix)) return err(422, "wallet_mismatch", "Use um número Movitel (86 ou 87) para pagar com e-Mola.");
    const p = PRODUCTS.find((x) => x.slug === params.slug) ?? PRODUCTS[0];
    const s = settingsFor(p.id);
    const items = [{ name: p.name, amount: p.price }];
    if (b.orderBump && s.orderBump.enabled) items.push({ name: "Ebook 100 Fórmulas", amount: s.orderBump.price });
    let total = items.reduce((a, i) => a + i.amount, 0);
    const c = b.coupon ? COUPONS.find((x) => x.code === b.coupon!.toUpperCase() && x.status === "active" && x.discount.kind === "percent") : undefined;
    if (c) { const d = Math.round(p.price * c.discount.value / 100); items.push({ name: `Cupão ${c.code}`, amount: -d }); total -= d; }
    const order: T.Order = {
      id: "VQ-" + orderSeq++, status: "awaiting_confirmation", method: b.method, total, items, buyerEmail: b.buyer.email, buyerPhone: b.walletPhone || b.buyer.phone,
      guaranteeUntil: new Date(Date.now() + 7 * 864e5).toISOString(), accessUrl: "/aluno",
      upsell: { title: "Dashboards Profissionais no Power BI", description: "Transforme as suas folhas de Excel em relatórios interativos. 32 aulas.", price: 2390, originalPrice: 3990 },
    };
    orders.set(order.id, { order, created: Date.now() });
    return ok(order, 500);
  }),
  http.get(url("/public/orders/:id"), ({ params }) => {
    const o = orders.get(String(params.id));
    if (!o) return ok<T.Order>({ id: String(params.id), status: "approved", method: "applepay", total: 2490, items: [{ name: PRODUCTS[0].name, amount: 2490 }], buyerEmail: "celso.matsinhe@gmail.com", buyerPhone: "84 312 4471", guaranteeUntil: "2026-10-29T23:59:00Z", accessUrl: "/aluno", upsell: { title: "Dashboards Profissionais no Power BI", description: "Transforme as suas folhas de Excel em relatórios interativos. 32 aulas.", price: 2390, originalPrice: 3990 } });
    const wallet = o.order.method === "mpesa" || o.order.method === "emola";
    if (o.order.status === "awaiting_confirmation" && Date.now() - o.created > (wallet ? 3600 : 2200)) o.order.status = "approved";
    return ok(o.order, 150);
  }),
  http.post(url("/public/orders/:id/upsell"), async ({ params }) => {
    const o = orders.get(String(params.id));
    if (o) { o.order.items.push({ name: "Dashboards Profissionais no Power BI", amount: 2390 }); o.order.total += 2390; o.order.upsell = undefined; }
    return ok(o?.order ?? null, 500);
  }),

  /* ── Aluno ── */
  http.get(url("/student/library"), () => {
    const c = course("p1", true);
    const next = c.modules.flatMap((m) => m.lessons).find((l) => !l.done);
    return ok<T.Library>({
      studentName: STUDENT_USER.name,
      items: [
        { productId: "p1", name: PRODUCTS[0].name, type: "course", cover: "orange", progress: c.progress!.percent, subtitle: `${c.progress!.done} de ${c.progress!.total} aulas`, nextLessonId: next?.id },
        { productId: "p3", name: PRODUCTS[2].name, type: "ebook", cover: "green", progress: 100, subtitle: "Ebook · PDF de 84 páginas" },
        { productId: "p4", name: PRODUCTS[3].name, type: "subscription", cover: "purple", progress: 40, subtitle: "Comunidade · renova a 14 nov" },
      ],
      recommended: { name: "Dashboards Profissionais no Power BI", price: 2390, originalPrice: 3990, slug: "power-bi-dashboards", note: "Alunos do curso de Excel têm 40% de desconto" },
    });
  }),
  http.get(url("/student/courses/:productId"), ({ params }) => ok(course(String(params.productId), true))),
  http.post(url("/student/lessons/:id/progress"), async ({ params, request }) => {
    const { done } = (await request.json()) as { done: boolean };
    done ? progressDone.add(String(params.id)) : progressDone.delete(String(params.id));
    return ok(course("p1", true), 150);
  }),
  http.get(url("/student/purchases"), () => ok(purchases)),
  http.post(url("/student/purchases/:id/refund"), async () => { await delay(500); return new HttpResponse(null, { status: 202 }); }),

  /* ── Backoffice ── */
  http.get(url("/admin/overview"), () => {
    const gmv = series(30, 610000, 0.14, 4200, 21);
    return ok<T.AdminOverview>({
      live: { gmvToday: 684210, gmvDelta: 9.4, txToday: 1931, txLastHour: 412, approval: 95.2, platformRevenueToday: 42380, sellersSelling: 611, sellersActive: 3412 },
      kpis: { gmv30d: 19820400, gmvDelta: 14.2, revenue30d: 1228860, revenueDelta: 11.8, chargebackRate: 0.31, owedToSellers: 4186300 },
      series: gmv.map((v, i) => ({ label: dayLabel(DAYS30[i]), gmv: v, revenue: Math.round(v * 0.062) })),
      queue: [
        { key: "kyc", count: kyc.length, note: "A mais antiga há 26 h" },
        { key: "payouts", count: ADMIN_PAYOUTS.filter((p) => p.status === "pending").length, note: "Acima de 100 000 MT" },
        { key: "moderation", count: moderation.length, note: "SLA de 2 horas" },
        { key: "disputes", count: 3, note: "2 com prazo amanhã" },
      ],
      gateways: [
        { id: "g1", method: "mpesa", name: "M-Pesa API · Vodacom", status: "operational", approval: 98.1, latencyMs: 312 },
        { id: "g2", method: "emola", name: "e-Mola API · Movitel", status: "degraded", approval: 91.2, latencyMs: 1800, note: "Latência elevada desde as 13:20" },
        { id: "g3", method: "applepay", name: "Apple Pay · Adquirente A", status: "operational", approval: 93.4, latencyMs: 690 },
        { id: "g4", method: "googlepay", name: "Google Pay · Adquirente A", status: "operational", approval: 92.1, latencyMs: 710 },
        { id: "g5", method: "card", name: "Cartões · Adquirente A", status: "operational", approval: 86.3, latencyMs: 780 },
      ],
      topSellers: SELLERS.slice(0, 5),
    });
  }),
  http.get(url("/admin/sellers"), ({ request }) => {
    const term = (new URL(request.url).searchParams.get("q") || "").toLowerCase();
    const items = SELLERS.filter((s) => !term || (s.business + s.owner + s.nuit + s.id).toLowerCase().includes(term));
    return ok({ items, page: 1, pageSize: 12, total: term ? items.length : 3412 });
  }),
  http.patch(url("/admin/sellers/:id"), async ({ params, request }) => {
    const s = SELLERS.find((x) => x.id === params.id);
    if (!s) return err(404, "not_found", "Produtor não encontrado.");
    Object.assign(s, await request.json());
    return ok(s);
  }),
  http.get(url("/admin/kyc"), () => ok(kyc)),
  http.post(url("/admin/kyc/:id/decision"), async ({ params }) => { kyc = kyc.filter((k) => k.id !== params.id); await delay(300); return new HttpResponse(null, { status: 204 }); }),
  http.get(url("/admin/moderation"), () => ok(moderation)),
  http.post(url("/admin/moderation/:id/decision"), async ({ params }) => { moderation = moderation.filter((m) => m.id !== params.id); await delay(300); return new HttpResponse(null, { status: 204 }); }),
  http.get(url("/admin/transactions"), () => {
    const risks = [8, 12, 64, 5, 22, 9, 81, 15, 7, 33, 11, 4, 52, 18];
    const items: T.AdminTransaction[] = SALES.slice(0, 14).map((s, i) => ({ ...s, seller: i % 4 === 1 ? "Finanças para Jovens" : i % 5 === 2 ? "Talk Moz" : "Excel com a Ana", risk: risks[i], route: s.method === "mpesa" ? "M-Pesa API" : s.method === "emola" ? "e-Mola API" : i % 2 ? "Adquirente A" : "Adquirente B" }));
    return ok({ items, page: 1, pageSize: 14, total: 1931 });
  }),
  http.get(url("/admin/risk"), () => {
    const risks = [8, 12, 64, 5, 22, 9, 81, 15, 7, 33, 11, 4, 52, 18];
    const flagged: T.AdminTransaction[] = SALES.slice(0, 14).map((s, i) => ({ ...s, seller: i % 5 === 2 ? "Talk Moz" : "Excel com a Ana", risk: risks[i], route: "Adquirente A" })).filter((s) => s.risk >= 40);
    return ok<T.RiskOverview>({
      summary: { blockedToday: 38, blockedAmount: 96400, manualReview: 6, falsePositiveRate: 2.1, chargebacksAvoided: 112 },
      rules: [
        { id: "r1", description: "Mais de 3 compras do mesmo número em 10 minutos", action: "Bloquear e pedir verificação", enabled: true, icon: "phone" },
        { id: "r2", description: "Cartão emitido fora de Moçambique acima de 10 000 MT", action: "Exigir 3-D Secure", enabled: true, icon: "card" },
        { id: "r3", description: "Mais de 5 cartões diferentes no mesmo dispositivo", action: "Bloquear dispositivo por 24 h", enabled: true, icon: "monitor" },
        { id: "r4", description: "Produtor novo (< 7 dias) com vendas acima de 200 000 MT", action: "Reter saldo para revisão", enabled: true, icon: "store" },
        { id: "r5", description: "Comprador com reembolso pedido em 3 produtos diferentes", action: "Marcar para revisão manual", enabled: false, icon: "refund" },
      ],
      blocklist: [{ kind: "phone", value: "+258 86 ••• •902", reason: "Fraude confirmada" }, { kind: "phone", value: "+258 84 ••• •117", reason: "Chargebacks repetidos" }, { kind: "phone", value: "+258 87 ••• •450", reason: "Teste de contas" }, { kind: "phone", value: "+258 85 ••• •338", reason: "Pedido do titular" }],
      flagged,
    });
  }),
  http.patch(url("/admin/risk/rules/:id"), async () => { await delay(200); return new HttpResponse(null, { status: 204 }); }),
  http.get(url("/admin/payouts"), () => ok({ summary: { paidToday: 1840200, paidCount: 214, autoShare: 96, awaiting: ADMIN_PAYOUTS.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0), awaitingCount: ADMIN_PAYOUTS.filter((p) => p.status === "pending").length, avgMpesaSeconds: 38, settlement: 9204000 }, items: ADMIN_PAYOUTS })),
  http.post(url("/admin/payouts/batch"), async ({ request }) => {
    const { ids, decision } = (await request.json()) as { ids: string[]; decision: string };
    ADMIN_PAYOUTS.forEach((p) => { if (ids.includes(p.id)) p.status = decision === "approve" ? "processing" : "rejected"; });
    await delay(400);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(url("/admin/disputes"), () => ok<T.Dispute[]>([
    { id: "DS-311", kind: "chargeback", saleId: "VQ-47702", seller: "Mentoria Negócio Digital", reason: "Produto não recebido", method: "card", amount: 3990, deadline: "amanhã", urgent: true, status: "open" },
    { id: "DS-309", kind: "late_refund", saleId: "VQ-47115", seller: "Talk Moz", reason: "Aulas não correspondem à descrição", method: "mpesa", amount: 2900, deadline: "em 3 dias", urgent: false, status: "open" },
    { id: "DS-306", kind: "chargeback", saleId: "VQ-46820", seller: "Trader Fácil MZ", reason: "Transação não reconhecida", method: "card", amount: 12000, deadline: "amanhã", urgent: true, status: "open" },
    { id: "DS-298", kind: "complaint", saleId: "VQ-46011", seller: "Excel com a Ana", reason: "Acesso não chegou · reenviado", method: "emola", amount: 2490, urgent: false, status: "resolved" },
    { id: "DS-290", kind: "chargeback", saleId: "VQ-45230", seller: "Trader Fácil MZ", reason: "Fraude de cartão", method: "card", amount: 12000, urgent: false, status: "lost" },
  ])),
  http.post(url("/admin/disputes/:id/evidence"), async () => { await delay(400); return new HttpResponse(null, { status: 202 }); }),
  http.get(url("/admin/gateways"), () => ok({
    gateways: [
      { id: "gw1", method: "mpesa", name: "M-Pesa API · Vodacom", description: "C2B e B2C", status: "operational", approval: 98.1, costPercent: 1.5, enabled: true },
      { id: "gw2", method: "emola", name: "e-Mola API · Movitel", description: "C2B e B2C", status: "degraded", approval: 91.2, costPercent: 1.5, enabled: true },
      { id: "gw3", method: "applepay", name: "Apple Pay", description: "Pagamento tokenizado via Adquirente A", status: "operational", approval: 93.4, costPercent: 2.9, enabled: true },
      { id: "gw4", method: "googlepay", name: "Google Pay", description: "Pagamento tokenizado via Adquirente A", status: "operational", approval: 92.1, costPercent: 2.9, enabled: true },
      { id: "gw5", method: "card", name: "Adquirente A", description: "Visa e Mastercard · 3-D Secure", status: "operational", approval: 86.3, costPercent: 2.9, enabled: true },
      { id: "gw6", method: "card", name: "Adquirente B", description: "Visa e Mastercard · contingência", status: "operational", approval: 82.7, costPercent: 3.2, enabled: true },
      { id: "gw7", method: "bank", name: "Transferência bancária", description: "Referência por NIB · confirmação manual", status: "operational", approval: 100, costPercent: 0, enabled: false },
    ] satisfies T.Gateway[],
    routing: [
      { id: "rt1", condition: "Cartões emitidos em Moçambique", route: ["Adquirente A", "Adquirente B"] },
      { id: "rt2", condition: "Cartões internacionais", route: ["Adquirente B", "Adquirente A"] },
      { id: "rt3", condition: "Valor acima de 50 000 MT", route: ["Adquirente A", "Revisão manual"] },
    ] satisfies T.RoutingRule[],
    incident: { title: "e-Mola com latência elevada desde as 13:20", text: "A aprovação caiu para 91,2%. Os compradores veem uma mensagem a sugerir M-Pesa, Apple Pay, Google Pay ou cartão quando o pedido demora mais de 30 segundos." },
  })),
  http.get(url("/admin/fees"), () => ok<T.FeesConfig>({
    plans: [
      { id: "fp1", name: "Padrão", percent: 4.9, fixed: 10, sellers: 3361, perks: ["Todos os métodos de pagamento", "Saques grátis para carteira móvel", "Libertação D+2 e D+14"], isDefault: true },
      { id: "fp2", name: "Escala", percent: 3.9, fixed: 10, sellers: 48, perks: ["A partir de 500 mil MT por mês", "Antecipação de cartão a 1,9%", "Gestor de conta dedicado"], isDefault: false },
      { id: "fp3", name: "Personalizado", percent: null, fixed: 0, sellers: 3, perks: ["Acima de 5 milhões MT por mês", "Taxas por método", "Liquidação diária para banco"], isDefault: false },
    ],
    release: [{ method: "mpesa", days: 2, reservePercent: 5 }, { method: "emola", days: 2, reservePercent: 5 }, { method: "card", days: 14, reservePercent: 10 }, { method: "applepay", days: 14, reservePercent: 10 }, { method: "googlepay", days: 14, reservePercent: 10 }],
    payouts: [{ label: "Para carteira móvel", value: "Grátis" }, { label: "Para banco", value: "25,00 MT" }, { label: "Mínimo", value: "100,00 MT" }, { label: "Automático até", value: "100 000 MT" }, { label: "Máximo por dia (nível 2)", value: "500 000 MT" }],
  })),
  http.get(url("/admin/team"), () => {
    const perms = ["Ver transações", "Reembolsar", "Aprovar KYC", "Aprovar saques", "Alterar taxas", "Gerir equipa"];
    const matrix: [string, number[]][] = [["Administrador", [1, 1, 1, 1, 1, 1]], ["Operações", [1, 1, 1, 1, 0, 0]], ["Conformidade", [1, 0, 1, 0, 0, 0]], ["Suporte", [1, 1, 0, 0, 0, 0]], ["Finanças", [1, 0, 0, 1, 1, 0]]];
    return ok({
      members: [
        { id: "s1", name: "Rita Machava", email: "rita@vendaqui.co.mz", role: "Administrador", twoFactor: true, lastSeen: "Agora" },
        { id: "s2", name: "Samuel Govene", email: "samuel@vendaqui.co.mz", role: "Operações", twoFactor: true, lastSeen: "Há 12 min" },
        { id: "s3", name: "Teresa Mazive", email: "teresa@vendaqui.co.mz", role: "Conformidade", twoFactor: true, lastSeen: "Há 1 h" },
        { id: "s4", name: "Faruk Abdul", email: "faruk@vendaqui.co.mz", role: "Suporte", twoFactor: false, lastSeen: "Ontem" },
        { id: "s5", name: "Luísa Chambe", email: "luisa@vendaqui.co.mz", role: "Finanças", twoFactor: true, lastSeen: "Há 3 h" },
      ] satisfies T.StaffMember[],
      roles: matrix.map(([role, v]) => ({ role, permissions: Object.fromEntries(perms.map((p, i) => [p, !!v[i]])) })),
    });
  }),
  http.get(url("/admin/audit-logs"), () => ok<T.Paginated<T.AuditLog>>({
    items: [
      { id: "l1", at: "14:05:12", actor: "Rita Machava", actorRole: "Administrador", action: "Aprovou KYC", target: "PR-2460 · Paula Comé", ip: "41.220.x.x" },
      { id: "l2", at: "13:58:40", actor: "Samuel Govene", actorRole: "Operações", action: "Aprovou 3 saques", target: "SQ-9922…9924", ip: "41.220.x.x" },
      { id: "l3", at: "13:21:03", actor: "Sistema", actorRole: "Automático", action: "Abriu incidente de latência", target: "INC-0412 · e-Mola", ip: "—" },
      { id: "l4", at: "12:47:19", actor: "Luísa Chambe", actorRole: "Finanças", action: "Alterou taxa do produtor", target: "PR-2238 · 4,9% → 3,9%", ip: "197.235.x.x" },
      { id: "l5", at: "11:30:55", actor: "Teresa Mazive", actorRole: "Conformidade", action: "Bloqueou produtor", target: "PR-2423 · Trader Fácil MZ", ip: "41.220.x.x" },
      { id: "l6", at: "10:12:08", actor: "Faruk Abdul", actorRole: "Suporte", action: "Reembolsou venda", target: "VQ-48003 · 2 490,00 MT", ip: "197.235.x.x" },
      { id: "l7", at: "09:02:41", actor: "Rita Machava", actorRole: "Administrador", action: "Ativou regra antifraude", target: "RF-007 · cartões por dispositivo", ip: "41.220.x.x" },
    ],
    page: 1, pageSize: 7, total: 2840,
  })),
];

