import { ICONS, type IconName } from "./icon-paths";
import { BRAND } from "./brand-paths";
import type { PaymentMethod } from "@/api/types";

export type { IconName };

export function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={`ad-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
  );
}

export function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 6.5 10 18l3.2-6.6" /><path d="M14.6 8.6 17 6.2l2.5 2.4" /><path d="M17 6.2V13" />
    </svg>
  );
}

function Brand({ k }: { k: "applepay" | "googlepay" | "visa" | "mastercard" }) {
  const b = BRAND[k];
  return <svg className={`pm-svg pm-svg-${k}`} viewBox={b.viewBox} fill="currentColor" role="img" aria-label={b.name}><path d={b.d} /></svg>;
}

/** Logótipo cinzento de um meio de pagamento (ou "bank" para transferência). */
export function PayLogo({ method }: { method: PaymentMethod | "bank" }) {
  switch (method) {
    case "applepay": case "googlepay":
      return <span className="pm-logo" title={BRAND[method].name}><Brand k={method} /></span>;
    case "card":
      return <span className="pm-logo" title="Visa e Mastercard"><Brand k="visa" /><Brand k="mastercard" /></span>;
    case "mpesa":
      return <span className="pm-logo" title="M-Pesa"><svg className="pm-svg pm-svg-mpesa" viewBox={BRAND.mpesa.viewBox} fill="currentColor" role="img" aria-label="M-Pesa" dangerouslySetInnerHTML={{ __html: BRAND.mpesa.svg }} /></span>;
    case "emola":
      return <span className="pm-logo" title="e-Mola"><span className="pm-mask pm-mask-emola" role="img" aria-label="e-Mola" /></span>;
    case "bank":
      return <span className="pm-logo" title="Transferência bancária"><Icon name="bank" size={20} /><span className="pm-wm pm-wm-sm">Transferência</span></span>;
  }
}
