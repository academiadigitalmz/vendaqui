/**
 * Contrato da API do VendAqui.
 *
 * Estes tipos são a fonte de verdade entre o frontend e o backend. O ficheiro
 * docs/openapi.yaml descreve os mesmos objetos para quem implementa o backend.
 * Valores monetários vêm em meticais (MZN) como número decimal; datas em ISO 8601.
 */

export type ID = string;
export type ISODate = string;
export type Money = number;

export type Role = "seller" | "admin" | "student";
export type PaymentMethod = "applepay" | "googlepay" | "mpesa" | "emola" | "card";
export type PayoutDestinationKind = "mpesa" | "emola" | "bank";
export type Period = "today" | "7d" | "30d" | "12m";

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

/* ── Autenticação ── */
export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  /** Só para produtores */
  business?: { name: string; nuit: string; kycStatus: KycStatus };
}
export interface Session {
  token: string;
  user: User;
}
export interface LoginInput { email: string; password: string }
export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  kind: "individual" | "company";
  businessName: string;
  nuit: string;
  category: string;
  payoutMethod: PayoutDestinationKind;
  payoutPhone?: string;
}
export type KycStatus = "not_started" | "pending" | "approved" | "changes_requested" | "rejected";

/* ── Produtos ── */
export type ProductType = "course" | "ebook" | "mentoring" | "subscription" | "event";
export type ProductStatus = "active" | "in_review" | "draft" | "suspended";
export type Cover = "orange" | "blue" | "green" | "purple" | "teal" | "red" | "slate";

export interface Product {
  id: ID;
  name: string;
  slug: string;
  type: ProductType;
  price: Money;
  recurring?: "monthly" | "yearly";
  status: ProductStatus;
  cover: Cover;
  sales: number;
  revenue: Money;
  conversion: number;
  students: number;
  createdAt: ISODate;
}

export interface Offer {
  id: ID;
  name: string;
  price: Money;
  slug: string;
  active: boolean;
  sales: number;
}

export interface CheckoutSettings {
  accent: "orange" | "blue" | "green" | "purple" | "red" | "ink";
  ctaLabel: string;
  timer: { enabled: boolean; minutes: number };
  orderBump: { enabled: boolean; productId?: ID; title: string; price: Money; originalPrice: Money; description: string };
  testimonial: { enabled: boolean; text: string; author: string };
  askNuit: boolean;
  methods: Record<PaymentMethod, boolean>;
}

export interface ProductDetail extends Product {
  description: string;
  guaranteeDays: 7 | 15 | 30;
  salesPageUrl?: string;
  checkoutUrl: string;
  offers: Offer[];
  checkout: CheckoutSettings;
  upsell: { enabled: boolean; title: string; price: Money; acceptRate: number };
  affiliate: { enabled: boolean; autoApprove: boolean; commissionPercent: number; cookieDays: number; attribution: "last_click" | "first_click"; materialsUrl?: string };
  bumpStats: { acceptRate: number; extraRevenue30d: Money };
}

export interface ProductInput {
  type: ProductType;
  name: string;
  description: string;
  category: string;
  price: Money;
  priceUsd?: number;
  recurring?: "monthly" | "yearly";
  guaranteeDays: 7 | 15 | 30;
  delivery: "members_area" | "file" | "external_link";
  deliveryUrl?: string;
  welcomeMessage: string;
}

/* ── Vendas ── */
export type SaleStatus = "approved" | "pending" | "declined" | "refunded" | "chargeback" | "expired";

export interface Sale {
  id: ID;
  createdAt: ISODate;
  status: SaleStatus;
  method: PaymentMethod;
  product: { id: ID; name: string };
  buyer: { name: string; email: string; phone: string; city: string };
  amount: Money;
  fee: Money;
  affiliate?: { name: string; commission: Money };
  net: Money;
  orderBump: boolean;
}
export interface SaleEvent { at: ISODate; label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
export interface SaleDetail extends Sale {
  timeline: SaleEvent[];
  tracking: { source: string; utmCampaign?: string; pixel?: string };
  device: string;
}
export interface SalesQuery { q?: string; status?: SaleStatus | ""; method?: PaymentMethod | ""; productId?: ID | ""; page?: number }
export interface SalesPage extends Paginated<Sale> {
  counts: Record<SaleStatus, number>;
  approvedAmount: Money;
}

/* ── Painel do produtor ── */
export interface Balance {
  available: Money;
  pending: Money;
  reserve: Money;
  nextRelease?: { date: ISODate; amount: Money };
}
export interface Dashboard {
  period: Period;
  revenueNet: Money;
  approvedSales: number;
  affiliateSales: number;
  avgTicket: Money;
  conversion: number;
  refundRate: number;
  deltas: { revenue: number; sales: number; ticket: number; conversion: number };
  series: { label: string; value: Money }[];
  salesSpark: number[];
  methods: { method: PaymentMethod; share: number; approvalRate: number }[];
  topProducts: { productId: ID; name: string; type: ProductType; cover: Cover; share: number; revenue: Money }[];
  balance: Balance;
  plaque: { goal: Money; total: Money };
  onboarding: { key: string; label: string; done: boolean; href: string }[];
  salesToday: number;
}

/* ── Assinaturas, clientes, afiliados, cupões ── */
export interface Subscription {
  id: ID;
  subscriber: { name: string; email: string };
  method: PaymentMethod;
  since: ISODate;
  nextCharge?: ISODate;
  status: "active" | "past_due" | "canceled";
  totalPaid: Money;
}
export interface SubscriptionsSummary { mrr: Money; mrrDelta: number; active: number; newThisMonth: number; churn: number; churned30d: number; pendingRenewals: number }

export interface Customer { id: ID; name: string; email: string; city: string; purchases: number; totalSpent: Money; lastPurchaseAt: ISODate }
export interface CustomersSummary { total: number; repeatRate: number; avgValue: Money; topCity: string; topCityShare: number }

export interface Affiliate { id: ID; name: string; email: string; sales: number; commissions: Money; conversion: number; status: "active" | "suspended" }
export interface AffiliateRequest { id: ID; name: string; audience: string; productName: string }
export interface MarketplaceProduct { id: ID; name: string; producer: string; type: ProductType; cover: Cover; price: Money; commissionPercent: number; rating: number }
export interface AffiliatesOverview {
  summary: { sales: number; salesShare: number; commissionsPaid: Money; active: number; defaultCommission: number; cookieDays: number };
  affiliates: Affiliate[];
  requests: AffiliateRequest[];
  marketplace: MarketplaceProduct[];
}

export interface Coupon { id: ID; code: string; discount: { kind: "percent" | "fixed"; value: number }; uses: number; limit?: number; expiresAt?: ISODate; products: "all" | ID[]; productsLabel: string; status: "active" | "draft" | "expired" }
export interface CouponInput { code: string; kind: "percent" | "fixed"; value: number; limit?: number; expiresAt?: ISODate; productId?: ID }

/* ── Recuperação ── */
export interface RecoveryAutomation { id: ID; channel: "sms" | "whatsapp" | "email"; title: string; delay: string; message: string; enabled: boolean }
export interface AbandonedCart { id: ID; buyer: { name: string; phone: string }; productName: string; amount: Money; reason: string }
export interface RecoveryOverview {
  summary: { abandoned: number; recovered: number; recoveredAmount: Money; rate: number; rateDelta: number };
  automations: RecoveryAutomation[];
  carts: AbandonedCart[];
}

/* ── Área de membros ── */
export interface Lesson { id: ID; title: string; duration: string; freePreview?: boolean; done?: boolean }
export interface CourseModule { id: ID; title: string; lessons: Lesson[] }
export interface Course {
  productId: ID;
  title: string;
  modules: CourseModule[];
  stats?: { activeStudents: number; completion: number; certificates: number; openQuestions: number };
  progress?: { done: number; total: number; percent: number };
}

/* ── Financeiro ── */
export interface StatementEntry { id: ID; at: ISODate; description: string; amount: Money }
export interface PayoutAccount { id: ID; kind: PayoutDestinationKind; label: string; masked: string; fee: Money; eta: string; primary: boolean }
export interface Payout { id: ID; requestedAt: ISODate; seller?: string; destination: PayoutDestinationKind; amount: Money; status: "pending" | "processing" | "paid" | "failed" | "rejected"; reason?: string }
export interface Finance {
  balance: Balance;
  statement: Paginated<StatementEntry>;
  payouts: Payout[];
  accounts: PayoutAccount[];
  releaseRules: { method: PaymentMethod; days: number }[];
  reservePercent: number;
  reserveDays: number;
  fee: { percent: number; fixed: Money };
}
export interface PayoutInput { amount: Money; accountId: ID }

/* ── Integrações e conta ── */
export interface Integration { id: ID; name: string; description: string; connected: boolean; color: string; letter: string }
export interface Webhook { id: ID; url: string; events: string[]; lastDelivery: { status: number; at: ISODate } }
export interface IntegrationsOverview { integrations: Integration[]; apiKeys: { id: ID; label: string; masked: string; mode: "live" | "test" }[]; webhooks: Webhook[] }
export interface TeamMember { id: ID; name: string; email: string; role: string; access: string }
export interface Account {
  profile: { businessName: string; supportEmail: string; supportWhatsapp: string; website: string };
  verification: { level: 1 | 2; verifiedAt?: ISODate; documents: { label: string; status: KycStatus; note: string }[]; limits: { label: string; value: string }[] };
  notifications: { key: string; label: string; channel: string; enabled: boolean }[];
  security: { twoFactor: boolean; confirmLargePayouts: boolean; sessions: { device: string; city: string; lastSeen: string }[] };
  team: TeamMember[];
}

/* ── Checkout público ── */
export interface PublicCheckout {
  slug: string;
  product: { id: ID; name: string; subtitle: string; price: Money; cover: Cover; type: ProductType };
  seller: { name: string; nuit: string };
  guaranteeDays: number;
  settings: CheckoutSettings;
}
export interface OrderInput {
  buyer: { name: string; email: string; phone: string; nuit?: string };
  method: PaymentMethod;
  /** Número da carteira para M-Pesa e e-Mola */
  walletPhone?: string;
  /** Token do cartão devolvido pelo adquirente; o frontend nunca envia o número do cartão à API */
  cardToken?: string;
  orderBump: boolean;
  coupon?: string;
}
export type OrderStatus = "awaiting_confirmation" | "approved" | "declined" | "expired";
export interface Order {
  id: ID;
  status: OrderStatus;
  method: PaymentMethod;
  total: Money;
  items: { name: string; amount: Money }[];
  buyerEmail: string;
  buyerPhone: string;
  guaranteeUntil: ISODate;
  accessUrl?: string;
  upsell?: { title: string; description: string; price: Money; originalPrice: Money };
}
export interface CouponCheck { valid: boolean; percent?: number; message?: string }

/* ── Área do aluno ── */
export interface LibraryItem { productId: ID; name: string; type: ProductType; cover: Cover; progress: number; subtitle: string; nextLessonId?: ID }
export interface Library { studentName: string; items: LibraryItem[]; recommended?: { name: string; price: Money; originalPrice: Money; slug: string; note: string } }
export interface Purchase { id: ID; orderId: ID; productName: string; date: ISODate; method: PaymentMethod; amount: Money; status: SaleStatus; refundableUntil?: ISODate }
export interface RefundRequestInput { reason: string; message?: string }

/* ── Backoffice ── */
export interface AdminOverview {
  live: { gmvToday: Money; gmvDelta: number; txToday: number; txLastHour: number; approval: number; platformRevenueToday: Money; sellersSelling: number; sellersActive: number };
  kpis: { gmv30d: Money; gmvDelta: number; revenue30d: Money; revenueDelta: number; chargebackRate: number; owedToSellers: Money };
  series: { label: string; gmv: Money; revenue: Money }[];
  queue: { key: "kyc" | "payouts" | "moderation" | "disputes"; count: number; note: string }[];
  gateways: GatewayHealth[];
  topSellers: SellerRow[];
}
export interface GatewayHealth { id: ID; method: PaymentMethod; name: string; status: "operational" | "degraded" | "down"; approval: number; latencyMs: number; note?: string }
export interface SellerRow { id: ID; business: string; owner: string; category: string; gmv30d: Money; buyers: number; chargebackRate: number; status: "verified" | "in_review" | "blocked"; plan: string; nuit: string; since: string; feePercent: number; feeFixed: Money }
export interface KycRequest { id: ID; name: string; business: string; waitingHours: number; kind: "individual" | "company"; category: string; faceMatch: number; nameMatch: "yes" | "partial" | "no"; nuitValid: boolean; riskCategory: "low" | "high"; documents: string[]; declared: { bi: string; nuit: string; city: string; wallet: string } }
export type KycDecision = "approve" | "request_changes" | "reject";
export interface ModerationItem { id: ID; productName: string; seller: string; type: ProductType; price: Money; cover: Cover; flags: string[] }
export interface AdminTransaction extends Sale { seller: string; risk: number; route: string }
export interface RiskOverview {
  summary: { blockedToday: number; blockedAmount: Money; manualReview: number; falsePositiveRate: number; chargebacksAvoided: number };
  rules: { id: ID; description: string; action: string; enabled: boolean; icon: string }[];
  blocklist: { kind: "phone" | "bin" | "email"; value: string; reason: string }[];
  flagged: AdminTransaction[];
}
export interface Dispute { id: ID; kind: "chargeback" | "late_refund" | "complaint"; saleId: ID; seller: string; reason: string; method: PaymentMethod; amount: Money; deadline?: string; urgent: boolean; status: "open" | "won" | "lost" | "resolved" }
export interface Gateway { id: ID; method: PaymentMethod | "bank"; name: string; description: string; status: "operational" | "degraded"; approval: number; costPercent: number; enabled: boolean }
export interface RoutingRule { id: ID; condition: string; route: string[] }
export interface FeePlan { id: ID; name: string; percent: number | null; fixed: Money; sellers: number; perks: string[]; isDefault: boolean }
export interface FeesConfig { plans: FeePlan[]; release: { method: PaymentMethod; days: number; reservePercent: number }[]; payouts: { label: string; value: string }[] }
export interface StaffMember { id: ID; name: string; email: string; role: string; twoFactor: boolean; lastSeen: string }
export interface AuditLog { id: ID; at: string; actor: string; actorRole: string; action: string; target: string; ip: string }
