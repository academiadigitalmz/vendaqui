import type { PaymentMethod, PayoutDestinationKind } from "@/api/types";
import type { IconName } from "./icons";

export const METHODS: Record<PaymentMethod, { label: string; caption: string; prefixes: string[]; operator?: string; icon: IconName; wallet: boolean }> = {
  applepay: { label: "Apple Pay", caption: "Face ID ou Touch ID", prefixes: [], icon: "phone", wallet: false },
  googlepay: { label: "Google Pay", caption: "Android · Chrome", prefixes: [], icon: "wallet", wallet: false },
  mpesa: { label: "M-Pesa", caption: "Vodacom", prefixes: ["84", "85"], operator: "Vodacom", icon: "phone", wallet: true },
  emola: { label: "e-Mola", caption: "Movitel", prefixes: ["86", "87"], operator: "Movitel", icon: "phone", wallet: true },
  card: { label: "Cartão", caption: "Crédito ou débito", prefixes: [], icon: "card", wallet: false },
};
export const METHOD_ORDER: PaymentMethod[] = ["applepay", "googlepay", "mpesa", "emola", "card"];
export const destLabel = (k: PayoutDestinationKind) => (k === "bank" ? "Banco" : METHODS[k].label);

/** Operadora pelo prefixo do número moçambicano. */
export function operatorOf(phone: string): PaymentMethod | "tmcel" | null {
  const p = phone.replace(/\D/g, "").replace(/^258/, "").slice(0, 2);
  return ({ "84": "mpesa", "85": "mpesa", "86": "emola", "87": "emola", "82": "tmcel", "83": "tmcel" } as Record<string, PaymentMethod | "tmcel">)[p] ?? null;
}
