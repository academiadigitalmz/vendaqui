import type { Purchase, PurchaseInput } from "@/api/checkout";

export interface CheckoutDraft {
  key: string;
  input: PurchaseInput;
  ownerId?: string;
  orderId?: string;
  token?: string;
  retry?: { key: string; input: Pick<PurchaseInput, "method" | "msisdn"> };
}
const prefix = "vq.checkout.";
// Save before submitting: a lost response must never generate a second purchase.
export function saveDraft(slug: string, draft: CheckoutDraft) {
  sessionStorage.setItem(prefix + slug, JSON.stringify(draft));
  if (draft.orderId)
    sessionStorage.setItem(prefix + "order." + draft.orderId, JSON.stringify(draft));
}
export function readDraft(key: string): CheckoutDraft | null {
  try {
    return JSON.parse(sessionStorage.getItem(prefix + key) || "null");
  } catch {
    return null;
  }
}
export function clearDraft(key: string, draft?: CheckoutDraft | null) {
  sessionStorage.removeItem(prefix + key);
  if (draft?.orderId) sessionStorage.removeItem(prefix + "order." + draft.orderId);
}
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 9 ? `+258${digits}` : `+${digits}`;
}
export function paymentState(p: Purchase): "paid" | "retry" | "closed" | "waiting" {
  if (p.order.status === "paid" && p.payment.status === "succeeded") return "paid";
  if (["cancelled", "expired", "refunded"].includes(p.order.status)) return "closed";
  // Unknown, pending and reconciliation states must never offer another charge.
  if (
    p.order.status === "pending_payment" &&
    new Date(p.order.expiresAt).getTime() > Date.now() &&
    ["failed", "cancelled"].includes(p.attempt.status) &&
    ["pending", "failed", "cancelled"].includes(p.payment.status)
  )
    return "retry";
  return "waiting";
}
