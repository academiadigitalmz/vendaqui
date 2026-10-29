/** Dados de exemplo determinísticos, usados só em modo simulado (VITE_USE_MOCKS). */
import type * as T from "@/api/types";

let seed = 7;
export const reseed = (s: number) => { seed = s; };
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const pick = <X,>(a: readonly X[]): X => a[Math.floor(rnd() * a.length)];

export const NAMES = ["Celso Matsinhe", "Lurdes Nhantumbo", "Dércio Langa", "Yolanda Muianga", "Edson Tembe", "Fátima Bila", "Hélder Chongo", "Sheila Mabunda", "Ivo Massingue", "Telma Zandamela", "Arlindo Cossa", "Neusa Manhique", "Jorge Mucavele", "Cátia Macamo", "Rui Nhaca", "Benedita Guambe", "Osvaldo Sitoe", "Albertina Chauque", "Marcelino Tivane", "Graça Muchanga", "Abel Novela", "Rosita Mavie"];
export const CITIES = ["Maputo", "Matola", "Beira", "Nampula", "Quelimane", "Tete", "Chimoio", "Pemba", "Inhambane", "Xai-Xai", "Lichinga"];
const PREFIX: Record<T.PaymentMethod, string[]> = { mpesa: ["84", "85"], emola: ["86", "87"], applepay: ["84", "86"], googlepay: ["84", "86"], card: ["84", "86"] };
export const phoneFor = (m: T.PaymentMethod) => `+258 ${pick(PREFIX[m])} ${100 + Math.floor(rnd() * 899)} ${1000 + Math.floor(rnd() * 8999)}`;
export const emailOf = (n: string) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(" ", ".") + "@gmail.com";

export const FEE = { percent: 4.9, fixed: 10 };
export const feeOf = (v: number) => +(v * FEE.percent / 100 + FEE.fixed).toFixed(2);
export const NOW = new Date(2026, 9, 22, 9, 41);
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => iso(new Date(NOW.getTime() - n * 864e5));

export const PRODUCTS: T.Product[] = [
  { id: "p1", name: "Excel do Zero ao Avançado", slug: "excel-zero-avancado", type: "course", price: 2490, status: "active", cover: "orange", sales: 1284, revenue: 2891400, conversion: 7.8, students: 1290, createdAt: "2025-03-12T10:00:00Z" },
  { id: "p2", name: "Dashboards Profissionais no Power BI", slug: "power-bi-dashboards", type: "course", price: 3990, status: "active", cover: "blue", sales: 412, revenue: 1498200, conversion: 5.1, students: 415, createdAt: "2025-06-02T10:00:00Z" },
  { id: "p3", name: "Ebook: 100 Fórmulas de Excel", slug: "ebook-100-formulas", type: "ebook", price: 450, status: "active", cover: "green", sales: 2106, revenue: 884520, conversion: 11.4, students: 2106, createdAt: "2025-02-01T10:00:00Z" },
  { id: "p4", name: "Clube Excel Pro", slug: "clube-excel-pro", type: "subscription", price: 790, recurring: "monthly", status: "active", cover: "purple", sales: 318, revenue: 251220, conversion: 4.2, students: 318, createdAt: "2025-08-20T10:00:00Z" },
  { id: "p5", name: "Mentoria Carreira em Dados", slug: "mentoria-dados", type: "mentoring", price: 15000, status: "in_review", cover: "teal", sales: 23, revenue: 345000, conversion: 1.9, students: 23, createdAt: "2026-09-30T10:00:00Z" },
  { id: "p6", name: "Templates de Gestão Financeira", slug: "templates-financas", type: "ebook", price: 990, status: "draft", cover: "red", sales: 0, revenue: 0, conversion: 0, students: 0, createdAt: "2026-10-20T10:00:00Z" },
];

function genSales(n: number): T.Sale[] {
  reseed(42);
  const methods: T.PaymentMethod[] = ["mpesa", "mpesa", "mpesa", "mpesa", "emola", "emola", "applepay", "googlepay", "card", "card"];
  const statuses: T.SaleStatus[] = ["approved", "approved", "approved", "approved", "approved", "approved", "approved", "pending", "declined", "refunded", "expired"];
  const out: T.Sale[] = [];
  let t = NOW.getTime();
  for (let i = 0; i < n; i++) {
    const p = PRODUCTS[Math.floor(rnd() * 4.6)];
    const m = pick(methods);
    const name = pick(NAMES);
    const s = i === 2 ? "pending" : pick(statuses);
    const bump = rnd() < 0.28 && p.id === "p1";
    const amount = p.price + (bump ? 190 : 0);
    const affName = rnd() < 0.3 ? pick(["Kelvin Duarte", "Sónia Matavele", "Pedro Uamusse"]) : null;
    t -= Math.floor(6 + rnd() * 70) * 60000;
    const fee = feeOf(amount);
    const commission = affName ? +(amount * 0.4).toFixed(2) : 0;
    out.push({
      id: "VQ-" + (48213 - i), createdAt: iso(new Date(t)), status: s, method: m,
      product: { id: p.id, name: p.name },
      buyer: { name, email: emailOf(name), phone: phoneFor(m), city: pick(CITIES) },
      amount, fee, affiliate: affName ? { name: affName, commission } : undefined,
      net: +(amount - fee - commission).toFixed(2), orderBump: bump,
    });
  }
  return out;
}
export const SALES = genSales(48);

export function series(n: number, base: number, vol: number, trend: number, s = 3) {
  reseed(s);
  const a: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v = Math.max(base * 0.35, v * (1 + (rnd() - 0.45) * vol) + trend);
    const weekend = i % 7 === 5 || i % 7 === 6 ? 0.82 : 1;
    a.push(Math.round(v * weekend));
  }
  return a;
}
export const DAYS30 = Array.from({ length: 30 }, (_, i) => new Date(2026, 8, 23 + i));
export const dayLabel = (d: Date) => d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });

export const COURSE_MODULES: { id: string; title: string; lessons: string[] }[] = [
  { id: "m1", title: "Primeiros passos", lessons: ["Conhecer o ecrã do Excel", "Células, linhas e colunas", "Formatar como um profissional", "Guardar e partilhar ficheiros"] },
  { id: "m2", title: "Fórmulas essenciais", lessons: ["SOMA, MÉDIA e CONTAR", "Referências absolutas com $", "SE e condições encadeadas", "PROCV e PROCX na prática", "Erros comuns e como corrigir"] },
  { id: "m3", title: "Tabelas dinâmicas", lessons: ["Criar a primeira tabela dinâmica", "Agrupar por datas e categorias", "Segmentação de dados", "Relatório de vendas mensal"] },
  { id: "m4", title: "Gráficos e dashboards", lessons: ["Escolher o gráfico certo", "Gráficos combinados", "Montar um dashboard numa folha", "Atualizar com um clique"] },
  { id: "m5", title: "Automação com macros", lessons: ["Gravar a primeira macro", "Botões que executam macros", "Projeto final: controlo de stock"] },
];
const DUR = ["06:12", "08:40", "11:05", "07:31", "09:58", "12:20", "14:03", "10:47", "13:15", "08:02"];
export const progressDone = new Set(["m1l1", "m1l2", "m1l3", "m1l4", "m2l1", "m2l2"]);
export function course(productId: string, withProgress: boolean): T.Course {
  const modules = COURSE_MODULES.map((m, mi) => ({
    id: m.id, title: m.title,
    lessons: m.lessons.map((title, li) => {
      const id = `${m.id}l${li + 1}`;
      return { id, title, duration: DUR[(mi * 5 + li) % DUR.length], freePreview: id === "m1l1", done: withProgress ? progressDone.has(id) : undefined };
    }),
  }));
  const total = modules.reduce((a, m) => a + m.lessons.length, 0);
  return {
    productId, title: PRODUCTS.find((p) => p.id === productId)?.name ?? "Curso", modules,
    stats: withProgress ? undefined : { activeStudents: 1290, completion: 46, certificates: 412, openQuestions: 9 },
    progress: withProgress ? { done: progressDone.size, total, percent: Math.round((progressDone.size / total) * 100) } : undefined,
  };
}

export const CHECKOUT_DEFAULT: T.CheckoutSettings = {
  accent: "orange", ctaLabel: "Comprar agora",
  timer: { enabled: true, minutes: 15 },
  orderBump: { enabled: true, productId: "p3", title: "Ebook “100 Fórmulas de Excel”", price: 190, originalPrice: 450, description: "As fórmulas que mais aparecem em entrevistas de emprego, prontas a copiar." },
  testimonial: { enabled: true, text: "Fiz o curso em 3 semanas e passei no teste de Excel da entrevista. As aulas de tabelas dinâmicas valem o preço todo.", author: "Sheila Mabunda · Maputo" },
  askNuit: false,
  methods: { applepay: true, googlepay: true, mpesa: true, emola: true, card: true },
};

export const COUPONS: T.Coupon[] = [
  { id: "c1", code: "ANA10", discount: { kind: "percent", value: 10 }, uses: 214, limit: 500, expiresAt: "2026-12-31T23:59:00Z", products: "all", productsLabel: "Todos", status: "active" },
  { id: "c2", code: "BEMVINDO", discount: { kind: "fixed", value: 150 }, uses: 88, products: ["p1"], productsLabel: "Excel do Zero", status: "active" },
  { id: "c3", code: "BLACK40", discount: { kind: "percent", value: 40 }, uses: 0, limit: 300, expiresAt: "2026-11-27T23:59:00Z", products: "all", productsLabel: "Todos", status: "draft" },
  { id: "c4", code: "SETEMBRO", discount: { kind: "percent", value: 20 }, uses: 120, limit: 120, expiresAt: "2026-09-30T23:59:00Z", products: ["p2"], productsLabel: "Power BI", status: "expired" },
];

export const PAYOUTS_SELLER: T.Payout[] = [
  { id: "SQ-9921", requestedAt: "2026-10-21T18:02:00Z", destination: "mpesa", amount: 35000, status: "paid" },
  { id: "SQ-9874", requestedAt: "2026-10-17T09:40:00Z", destination: "mpesa", amount: 61200, status: "paid" },
  { id: "SQ-9810", requestedAt: "2026-10-12T15:12:00Z", destination: "bank", amount: 150000, status: "paid" },
  { id: "SQ-9777", requestedAt: "2026-10-08T11:31:00Z", destination: "emola", amount: 22500, status: "paid" },
];

export const SELLERS: T.SellerRow[] = ([
  ["Excel com a Ana", "Ana Sitoe", "Educação", 1648230, 3641, 0.4, "verified", "Padrão"],
  ["Finanças para Jovens", "Nélio Cumbe", "Finanças", 1204500, 2810, 0.6, "verified", "Escala"],
  ["Talk Moz", "Joana Mungói", "Idiomas", 986300, 1702, 0.3, "verified", "Padrão"],
  ["Mentoria Negócio Digital", "Lúcia Mabote", "Negócios", 742000, 312, 1.8, "verified", "Padrão"],
  ["Campo Vivo", "Agostinho Nhaúle", "Agricultura", 288400, 905, 0.2, "verified", "Padrão"],
  ["Lente Moz", "Dino Chilaule", "Fotografia", 194750, 401, 0.5, "in_review", "Padrão"],
  ["Trader Fácil MZ", "Bruno Tembe", "Investimentos", 158000, 96, 6.4, "blocked", "Padrão"],
  ["Beleza Natural", "Zaida Cossa", "Beleza", 121300, 377, 0.7, "verified", "Padrão"],
] as const).map(([business, owner, category, gmv30d, buyers, chargebackRate, status, plan], i) => ({
  id: "PR-" + (2201 + i * 37), business, owner, category, gmv30d, buyers, chargebackRate, status, plan,
  nuit: "40" + String(1000000 + i * 1234567).slice(0, 7),
  since: ["mar 2025", "jan 2025", "jun 2025", "ago 2025", "fev 2026", "set 2026", "jul 2026", "abr 2026"][i],
  feePercent: plan === "Escala" ? 3.9 : 4.9, feeFixed: 10,
}));

export const KYC: T.KycRequest[] = ([
  ["Dino Chilaule", "Lente Moz", 26, "individual", 96, "yes", "low", "Fotografia", "Beira"],
  ["Matilde Nhavoto", "Doces da Matilde", 19, "individual", 91, "yes", "low", "Culinária", "Maputo"],
  ["Ernesto Macie", "EM Consultoria, Lda", 17, "company", 88, "yes", "low", "Negócios", "Matola"],
  ["Sara Bulande", "Inglês com a Sara", 11, "individual", 72, "partial", "low", "Idiomas", "Nampula"],
  ["Hugo Massango", "Cripto Rápido", 6, "individual", 41, "no", "high", "Investimentos", "Maputo"],
  ["Paula Comé", "Yoga em Casa", 2, "individual", 94, "yes", "low", "Saúde", "Inhambane"],
] as const).map(([name, business, waitingHours, kind, faceMatch, nameMatch, riskCategory, category, city], i) => ({
  id: "KYC-" + (310 + i), name, business, waitingHours, kind, faceMatch, nameMatch, riskCategory, category, nuitValid: true,
  documents: ["BI · frente", "BI · verso", "Selfie com BI", kind === "company" ? "Certidão comercial" : "Cartão NUIT"],
  declared: { bi: `1101 0234 5678 ${name.length}B`, nuit: `4011${name.length}8 723`, city, wallet: `M-Pesa 84 ••• •${200 + name.length * 7}` },
}));

export const ADMIN_PAYOUTS: T.Payout[] = [
  { id: "SQ-9934", requestedAt: "2026-10-22T08:10:00Z", seller: "Finanças para Jovens", destination: "mpesa", amount: 186000, status: "pending", reason: "Acima do limite automático" },
  { id: "SQ-9933", requestedAt: "2026-10-22T07:55:00Z", seller: "Talk Moz", destination: "bank", amount: 120500, status: "pending", reason: "Acima do limite automático" },
  { id: "SQ-9931", requestedAt: "2026-10-22T07:12:00Z", seller: "Trader Fácil MZ", destination: "mpesa", amount: 41200, status: "pending", reason: "Produtor bloqueado" },
  { id: "SQ-9929", requestedAt: "2026-10-21T19:40:00Z", seller: "Mentoria Negócio Digital", destination: "emola", amount: 64900, status: "pending", reason: "Primeiro saque" },
  { id: "SQ-9926", requestedAt: "2026-10-21T18:02:00Z", seller: "Excel com a Ana", destination: "mpesa", amount: 35000, status: "paid", reason: "Automático" },
  { id: "SQ-9925", requestedAt: "2026-10-21T14:00:00Z", seller: "Campo Vivo", destination: "bank", amount: 22800, status: "processing", reason: "Lote BCI 14h" },
  { id: "SQ-9921", requestedAt: "2026-10-21T10:20:00Z", seller: "Beleza Natural", destination: "emola", amount: 9800, status: "failed", reason: "Número e-Mola inativo" },
];

export const daysAgoIso = daysAgo;
