import { http } from "./http";

export type WalletMethod = "mpesa" | "emola";
export interface CheckoutProduct {
  product: { id: string; name: string; slug: string; description: string; type: string; guaranteeDays: number | null };
  offers: { id: string; name: string; priceAmount: number; currency: string; isActive: boolean; isDefault: boolean; billingPeriod?: string }[];
  sellerDisplayName: string;
  coverUrl?: string;
}
export interface PaymentMethodConfig { method: string; isEnabled: boolean; ready: boolean }
export interface PurchaseInput {
  productId: string; offerId: string; method: WalletMethod; msisdn: string;
  buyer?: { name: string; email: string; msisdn: string };
}
export interface CheckoutOrder {
  id: string; orderNumber: string; status: string; totalAmount: number; currency: string; expiresAt: string;
  items?: { productId: string; productName: string; offerName: string; totalAmount: number }[];
}
export interface PaymentResult {
  payment: { id: string; status: string; confirmationStatus: string };
  attempt: { id: string; status: string; method: string; failureCode?: string };
  message?: string;
}
export interface Purchase extends PaymentResult { order: CheckoutOrder; checkoutToken?: string; claimStatus?: string }
export interface BuyerIdentity { id: string; name: string; email: string; msisdn?: string }
export interface BuyerSession { accessToken: string; user: BuyerIdentity }
// The claim endpoint currently serializes its domain user with PascalCase keys.
// Whitelist public identity fields; never persist the raw domain object.
interface ClaimIdentity { ID: string; Name: string; Email: string; MSISDN?: string }
const publicIdentity = (user: BuyerIdentity | ClaimIdentity): BuyerIdentity => "ID" in user
  ? { id: user.ID, name: user.Name, email: user.Email, msisdn: user.MSISDN }
  : { id: user.id, name: user.name, email: user.email, msisdn: user.msisdn };

const request = <T>(method: string, path: string, body?: unknown, headers?: Record<string, string>) =>
  http<T>(method, path, { body, headers, envelope: true, credentials: "include" });
const checkoutHeaders = (token?: string, key?: string) => ({ ...(token ? { "Checkout-Token": token } : {}), ...(key ? { "Idempotency-Key": key } : {}) });

export const checkoutApi = {
  product: (slug: string) => request<CheckoutProduct>("GET", `/public/products/${encodeURIComponent(slug)}`),
  methods: () => request<PaymentMethodConfig[]>("GET", "/payments/methods"),
  create: (input: PurchaseInput, key: string) => request<Purchase>("POST", "/checkout/orders", input, checkoutHeaders(undefined, key)),
  order: (id: string, token?: string) => request<Purchase>("GET", `/checkout/orders/${encodeURIComponent(id)}`, undefined, checkoutHeaders(token)),
  retry: (id: string, input: Pick<PurchaseInput, "method" | "msisdn">, key: string, token?: string) =>
    request<PaymentResult>("POST", `/checkout/orders/${encodeURIComponent(id)}/payment-attempts`, input, checkoutHeaders(token, key)),
  claim: async (id: string, code: string, password: string, token?: string) => {
    const result = await request<{ order: CheckoutOrder; accessToken?: string; user?: BuyerIdentity | ClaimIdentity }>("POST", `/checkout/orders/${encodeURIComponent(id)}/claim`, { code, password }, checkoutHeaders(token));
    return { order: result.order, accessToken: result.accessToken, user: result.user ? publicIdentity(result.user) : undefined };
  },
  login: (email: string, password: string) => request<BuyerSession>("POST", "/auth/login", { email, password }),
};
