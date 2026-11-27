import { http } from "./http";

export type WalletMethod = "mpesa" | "emola";
export interface CheckoutProduct {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    type: string;
    guaranteeDays: number | null;
  };
  offers: {
    id: string;
    name: string;
    priceAmount: number;
    currency: string;
    isActive: boolean;
    isDefault: boolean;
    billingPeriod?: string;
  }[];
  sellerDisplayName: string;
  coverUrl?: string;
}
export interface PaymentMethodConfig {
  method: string;
  isEnabled: boolean;
  ready: boolean;
}
export interface PurchaseInput {
  productId: string;
  offerId: string;
  method: WalletMethod;
  msisdn: string;
  buyer?: { name: string; email: string; msisdn: string };
}
export interface CheckoutOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  expiresAt: string;
  items?: { productId: string; productName: string; offerName: string; totalAmount: number }[];
}
export interface PaymentResult {
  payment: { id: string; status: string; confirmationStatus: string };
  attempt: { id: string; status: string; method: string; failureCode?: string };
  message?: string;
}
export interface Purchase extends PaymentResult {
  order: CheckoutOrder;
  checkoutToken?: string;
  claimStatus?: string;
  claimMode?: "existing_account" | "unverified_account" | "create_account";
}
export interface BuyerIdentity {
  id: string;
  name: string;
  email: string;
  msisdn?: string;
}
export interface BuyerSession {
  accessToken: string;
  user: BuyerIdentity;
}
// The claim endpoint may serialize its domain user with PascalCase keys and internal fields.
type RawIdentity = Partial<BuyerIdentity> & {
  ID?: string;
  Name?: string;
  Email?: string;
  MSISDN?: string;
};

/** Copies only the public identity fields, so nothing else reaches app state. */
const publicIdentity = (user: RawIdentity): BuyerIdentity => ({
  id: user.id ?? user.ID ?? "",
  name: user.name ?? user.Name ?? "",
  email: user.email ?? user.Email ?? "",
  msisdn: user.msisdn ?? user.MSISDN,
});

const request = <T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
) => http<T>(method, path, { body, headers });
const checkoutHeaders = (token?: string, key?: string) => ({
  ...(token ? { "Checkout-Token": token } : {}),
  ...(key ? { "Idempotency-Key": key } : {}),
});

export const checkoutApi = {
  product: (slug: string) =>
    request<CheckoutProduct>("GET", `/public/products/${encodeURIComponent(slug)}`),
  methods: () => request<PaymentMethodConfig[]>("GET", "/payments/methods"),
  create: (input: PurchaseInput, key: string) =>
    request<Purchase>("POST", "/checkout/orders", input, checkoutHeaders(undefined, key)),
  order: (id: string, token?: string) =>
    request<Purchase>(
      "GET",
      `/checkout/orders/${encodeURIComponent(id)}`,
      undefined,
      checkoutHeaders(token),
    ),
  retry: (
    id: string,
    input: Pick<PurchaseInput, "method" | "msisdn">,
    key: string,
    token?: string,
  ) =>
    request<PaymentResult>(
      "POST",
      `/checkout/orders/${encodeURIComponent(id)}/payment-attempts`,
      input,
      checkoutHeaders(token, key),
    ),
  claim: async (id: string, code: string, password: string, token?: string) => {
    const result = await request<{
      order: CheckoutOrder;
      accessToken?: string;
      user?: RawIdentity;
    }>(
      "POST",
      `/checkout/orders/${encodeURIComponent(id)}/claim`,
      { code, password },
      checkoutHeaders(token),
    );
    return {
      order: result.order,
      accessToken: result.accessToken,
      user: result.user ? publicIdentity(result.user) : undefined,
    };
  },
  login: async (email: string, password: string): Promise<BuyerSession> => {
    const result = await request<{ accessToken: string; user: RawIdentity }>(
      "POST",
      "/auth/login",
      {
        email,
        password,
      },
    );
    return { accessToken: result.accessToken, user: publicIdentity(result.user) };
  },
};
