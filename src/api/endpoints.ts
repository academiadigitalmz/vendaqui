/**
 * Todos os pedidos que a app faz ao backend. Cada função corresponde a uma
 * operação em docs/openapi.yaml (o comentário indica o método e o caminho).
 */
import { get, patch, post, put } from "./http";
import type * as T from "./types";

export const api = {
  auth: {
    /** POST /auth/login */
    login: (b: T.LoginInput) => post<T.Session>("/auth/login", b),
    /** POST /auth/register */
    register: (b: T.RegisterInput) => post<T.Session>("/auth/register", b),
    /** GET /me */
    me: () => get<T.User>("/me"),
  },

  seller: {
    /** GET /seller/dashboard?period= */
    dashboard: (period: T.Period) => get<T.Dashboard>("/seller/dashboard", { period }),
    /** GET /seller/products */
    products: () => get<T.Product[]>("/seller/products"),
    /** POST /seller/products */
    createProduct: (b: T.ProductInput) => post<T.Product>("/seller/products", b),
    /** GET /seller/products/{id} */
    product: (id: T.ID) => get<T.ProductDetail>(`/seller/products/${id}`),
    /** PATCH /seller/products/{id} */
    updateProduct: (id: T.ID, b: Partial<T.ProductDetail>) => patch<T.ProductDetail>(`/seller/products/${id}`, b),
    /** PUT /seller/products/{id}/checkout */
    saveCheckout: (id: T.ID, b: T.CheckoutSettings) => put<T.CheckoutSettings>(`/seller/products/${id}/checkout`, b),
    /** GET /seller/sales */
    sales: (q: T.SalesQuery) => get<T.SalesPage>("/seller/sales", { ...q }),
    /** GET /seller/sales/{id} */
    sale: (id: T.ID) => get<T.SaleDetail>(`/seller/sales/${id}`),
    /** POST /seller/sales/{id}/refund */
    refundSale: (id: T.ID) => post<T.SaleDetail>(`/seller/sales/${id}/refund`),
    /** POST /seller/sales/{id}/resend-access */
    resendAccess: (id: T.ID) => post<void>(`/seller/sales/${id}/resend-access`),
    /** GET /seller/subscriptions */
    subscriptions: () => get<{ summary: T.SubscriptionsSummary; items: T.Subscription[]; total: number }>("/seller/subscriptions"),
    /** GET /seller/customers */
    customers: (q?: string) => get<{ summary: T.CustomersSummary } & T.Paginated<T.Customer>>("/seller/customers", { q }),
    /** GET /seller/affiliates */
    affiliates: () => get<T.AffiliatesOverview>("/seller/affiliates"),
    /** POST /seller/affiliates/requests/{id} */
    decideAffiliate: (id: T.ID, approve: boolean) => post<void>(`/seller/affiliates/requests/${id}`, { decision: approve ? "approve" : "reject" }),
    /** GET /seller/coupons */
    coupons: () => get<T.Coupon[]>("/seller/coupons"),
    /** POST /seller/coupons */
    createCoupon: (b: T.CouponInput) => post<T.Coupon>("/seller/coupons", b),
    /** GET /seller/recovery */
    recovery: () => get<T.RecoveryOverview>("/seller/recovery"),
    /** PATCH /seller/recovery/automations/{id} */
    toggleAutomation: (id: T.ID, enabled: boolean) => patch<T.RecoveryAutomation>(`/seller/recovery/automations/${id}`, { enabled }),
    /** POST /seller/recovery/carts/{id}/contact */
    contactCart: (id: T.ID) => post<void>(`/seller/recovery/carts/${id}/contact`),
    /** GET /seller/courses/{productId} */
    course: (productId: T.ID) => get<T.Course>(`/seller/courses/${productId}`),
    /** GET /seller/finance */
    finance: () => get<T.Finance>("/seller/finance"),
    /** POST /seller/payouts */
    requestPayout: (b: T.PayoutInput) => post<T.Payout>("/seller/payouts", b),
    /** GET /seller/integrations */
    integrations: () => get<T.IntegrationsOverview>("/seller/integrations"),
    /** GET /seller/account */
    account: () => get<T.Account>("/seller/account"),
    /** PATCH /seller/account/profile */
    saveProfile: (b: T.Account["profile"]) => patch<T.Account["profile"]>("/seller/account/profile", b),
  },

  checkout: {
    /** GET /public/checkout/{slug} */
    get: (slug: string) => get<T.PublicCheckout>(`/public/checkout/${slug}`),
    /** POST /public/checkout/{slug}/coupons */
    checkCoupon: (slug: string, code: string) => post<T.CouponCheck>(`/public/checkout/${slug}/coupons`, { code }),
    /** POST /public/checkout/{slug}/orders */
    createOrder: (slug: string, b: T.OrderInput) => post<T.Order>(`/public/checkout/${slug}/orders`, b),
    /** GET /public/orders/{id} — o checkout consulta até sair de awaiting_confirmation */
    order: (id: T.ID) => get<T.Order>(`/public/orders/${id}`),
    /** POST /public/orders/{id}/upsell */
    acceptUpsell: (id: T.ID) => post<T.Order>(`/public/orders/${id}/upsell`),
  },

  student: {
    /** GET /student/library */
    library: () => get<T.Library>("/student/library"),
    /** GET /student/courses/{productId} */
    course: (productId: T.ID) => get<T.Course>(`/student/courses/${productId}`),
    /** POST /student/lessons/{id}/progress */
    setLessonDone: (lessonId: T.ID, done: boolean) => post<T.Course>(`/student/lessons/${lessonId}/progress`, { done }),
    /** GET /student/purchases */
    purchases: () => get<T.Purchase[]>("/student/purchases"),
    /** POST /student/purchases/{id}/refund */
    requestRefund: (id: T.ID, b: T.RefundRequestInput) => post<void>(`/student/purchases/${id}/refund`, b),
  },

  admin: {
    /** GET /admin/overview */
    overview: () => get<T.AdminOverview>("/admin/overview"),
    /** GET /admin/sellers */
    sellers: (q?: string) => get<T.Paginated<T.SellerRow>>("/admin/sellers", { q }),
    /** PATCH /admin/sellers/{id} */
    updateSeller: (id: T.ID, b: Partial<Pick<T.SellerRow, "status" | "feePercent" | "feeFixed">>) => patch<T.SellerRow>(`/admin/sellers/${id}`, b),
    /** GET /admin/kyc */
    kyc: () => get<T.KycRequest[]>("/admin/kyc"),
    /** POST /admin/kyc/{id}/decision */
    decideKyc: (id: T.ID, decision: T.KycDecision, note?: string) => post<void>(`/admin/kyc/${id}/decision`, { decision, note }),
    /** GET /admin/moderation */
    moderation: () => get<T.ModerationItem[]>("/admin/moderation"),
    /** POST /admin/moderation/{id}/decision */
    decideModeration: (id: T.ID, approve: boolean) => post<void>(`/admin/moderation/${id}/decision`, { decision: approve ? "approve" : "reject" }),
    /** GET /admin/transactions */
    transactions: () => get<T.Paginated<T.AdminTransaction>>("/admin/transactions"),
    /** GET /admin/risk */
    risk: () => get<T.RiskOverview>("/admin/risk"),
    /** PATCH /admin/risk/rules/{id} */
    toggleRule: (id: T.ID, enabled: boolean) => patch<void>(`/admin/risk/rules/${id}`, { enabled }),
    /** GET /admin/payouts */
    payouts: () => get<{ summary: { paidToday: T.Money; paidCount: number; autoShare: number; awaiting: T.Money; awaitingCount: number; avgMpesaSeconds: number; settlement: T.Money }; items: T.Payout[] }>("/admin/payouts"),
    /** POST /admin/payouts/batch */
    decidePayouts: (ids: T.ID[], approve: boolean) => post<void>("/admin/payouts/batch", { ids, decision: approve ? "approve" : "reject" }),
    /** GET /admin/disputes */
    disputes: () => get<T.Dispute[]>("/admin/disputes"),
    /** POST /admin/disputes/{id}/evidence */
    sendEvidence: (id: T.ID, note: string) => post<void>(`/admin/disputes/${id}/evidence`, { note }),
    /** GET /admin/gateways */
    gateways: () => get<{ gateways: T.Gateway[]; routing: T.RoutingRule[]; incident?: { title: string; text: string } }>("/admin/gateways"),
    /** GET /admin/fees */
    fees: () => get<T.FeesConfig>("/admin/fees"),
    /** GET /admin/team */
    team: () => get<{ members: T.StaffMember[]; roles: { role: string; permissions: Record<string, boolean> }[] }>("/admin/team"),
    /** GET /admin/audit-logs */
    auditLogs: () => get<T.Paginated<T.AuditLog>>("/admin/audit-logs"),
  },
};
