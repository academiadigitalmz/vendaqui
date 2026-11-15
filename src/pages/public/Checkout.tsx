import { useEffect, useState } from "react";
import type { PaymentMethod, PublicCheckout } from "@/api/types";
import { Icon, PayLogo } from "@/lib/icons";
import { METHODS, METHOD_ORDER, operatorOf } from "@/lib/methods";
import { mt } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { Avatar, Btn, Cover, ErrorState, Field, Input, Loading } from "@/components/ui";

const coverIcon = (t: string) => (t === "ebook" ? "book" : t === "subscription" ? "repeat" : t === "mentoring" ? "users" : "cap") as "cap";

function OperatorHint({ phone, method, onSwitch }: { phone: string; method: PaymentMethod; onSwitch: (m: PaymentMethod) => void }) {
  const op = operatorOf(phone);
  if (op === "tmcel") return <><Icon name="alert" size={14} />Números Tmcel (82 e 83) não são aceites. Use M-Pesa, e-Mola ou cartão.</>;
  if (op && op !== method) return <><Icon name="alert" size={14} />Este número é {METHODS[op].operator}. <button type="button" className="ad-btn-link" onClick={() => onSwitch(op)}>Pagar com {METHODS[op].label}</button></>;
  return <>Números {METHODS[method].prefixes.join(" e ")} · {METHODS[method].operator}</>;
}

function Timer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  useEffect(() => { setLeft(minutes * 60); const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, [minutes]);
  return <b>{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</b>;
}

/** O checkout em si. Com `preview` fica estático (usado no editor do produtor). */
export function CheckoutView({ data, preview, onPay, paying }: { data: PublicCheckout; preview?: boolean; onPay?: (p: { name: string; email: string; phone: string; method: PaymentMethod; bump: boolean; coupon?: string }) => void; paying?: boolean }) {
  const s = data.settings;
  const methods = METHOD_ORDER.filter((m) => s.methods[m]);
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "card");
  const [name, setName] = useState("Celso Matsinhe");
  const [email, setEmail] = useState("celso.matsinhe@gmail.com");
  const [phone, setPhone] = useState("84 312 4471");
  const [bump, setBump] = useState(false);
  useEffect(() => { if (!methods.includes(method) && methods[0]) setMethod(methods[0]); }, [methods.join(), method]);


  const p = data.product;
  const bumpAmount = s.orderBump.enabled && bump ? s.orderBump.price : 0;
  const disc = 0;
  const total = p.price + bumpAmount - disc;
  const wallet = METHODS[method].wallet, xpay = method === "applepay" || method === "googlepay";

  return (
    <div className={`co acc-${s.accent}`}>
      {s.timer.enabled ? <div className="co-timer"><Icon name="clock" size={16} />Preço de lançamento termina em <Timer minutes={s.timer.minutes} /></div> : null}
      <div className="co-head"><div className="co-wrap"><span className="co-seller"><Avatar name="Ana Sitoe" />{data.seller.name}</span><span className="co-secure"><Icon name="lock" size={15} />Pagamento seguro</span></div></div>
      <form className="co-wrap co-grid" onSubmit={(e) => { e.preventDefault(); if (!preview) onPay?.({ name, email, phone, method, bump,  }); }}>
        <div className="stack-sm" style={{ gap: 16 }}>
          <section className="co-box"><h3><span className="n">1</span>Os seus dados</h3>
            <div className="co-fields">
              <Field label="Nome completo" className="full" htmlFor="co-name"><Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como aparece no BI" autoComplete="name" /></Field>
              <Field label="Email" htmlFor="co-email"><Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Para onde enviamos o acesso" autoComplete="email" /></Field>
              <Field label="Telemóvel" htmlFor="co-phone"><Input id="co-phone" type="tel" prefix="+258" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="84 000 0000" inputMode="tel" autoComplete="tel-national" /></Field>
              {s.askNuit ? <Field label="NUIT (para fatura)" className="full" htmlFor="co-nuit"><Input id="co-nuit" placeholder="Opcional" /></Field> : null}
            </div>
          </section>
          <section className="co-box"><h3><span className="n">2</span>Pagamento</h3>
            <div className="pmethods" role="radiogroup" aria-label="Método de pagamento">
              {methods.map((k) => (
                <button key={k} type="button" className={`pmethod pm-${k} ${method === k ? "on" : ""}`} role="radio" aria-checked={method === k} onClick={() => setMethod(k)}>
                  <PayLogo method={k} /><b className="sr-only">{METHODS[k].label}</b><small>{METHODS[k].caption}</small>
                  <span className="chk">{method === k ? <Icon name="check" size={12} /> : null}</span>
                </button>
              ))}
            </div>
            {wallet ? (<>
              <Field label={`Número ${METHODS[method].label}`} htmlFor="co-wallet" help={<span><OperatorHint phone={phone} method={method} onSwitch={setMethod} /></span>}>
                <Input id="co-wallet" type="tel" prefix="+258" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
              </Field>
              <div className="co-note"><Icon name="phone" size={18} /><span>Depois de carregar em pagar, recebe no telemóvel um pedido de confirmação de <b>{mt(total)}</b>. Introduza o PIN {METHODS[method].label} para concluir. O pedido expira em 60 segundos.</span></div>
            </>) : xpay ? (
              <div className="co-note"><Icon name={METHODS[method].icon} size={18} /><span>Ao carregar em pagar abre a janela do <b>{METHODS[method].label}</b>. Confirme com Face ID, impressão digital ou o código do dispositivo. Não precisa de escrever os dados do cartão.</span></div>
            ) : (<>
              <div className="co-fields">
                <Field label="Número do cartão" className="full" htmlFor="co-cc"><Input id="co-cc" defaultValue="4000 0000 0000 0002" icon="card" inputMode="numeric" autoComplete="cc-number" /></Field>
                <Field label="Validade" htmlFor="co-exp"><Input id="co-exp" defaultValue="08/29" placeholder="MM/AA" autoComplete="cc-exp" /></Field>
                <Field label="CVV" htmlFor="co-cvv"><Input id="co-cvv" defaultValue="123" placeholder="3 dígitos" inputMode="numeric" autoComplete="cc-csc" /></Field>
                <Field label="Nome no cartão" className="full" htmlFor="co-ccname"><Input id="co-ccname" defaultValue="CELSO MATSINHE" autoComplete="cc-name" /></Field>
              </div>
              <div className="co-note"><Icon name="shield" size={18} /><span>Visa e Mastercard, nacionais e internacionais. Pode ser pedida a confirmação 3-D Secure do seu banco.</span></div>
            </>)}
          </section>
          {s.orderBump.enabled ? (
            <div className="co-bump"><div className="co-bump-top">Oferta única nesta página</div>
              <label htmlFor="co-bump"><input type="checkbox" id="co-bump" checked={bump} onChange={(e) => setBump(e.target.checked)} /><p><b>Sim, quero o {s.orderBump.title}</b> por apenas <b>{mt(s.orderBump.price, 0)}</b> <s>{mt(s.orderBump.originalPrice, 0)}</s>. {s.orderBump.description}</p></label>
            </div>
          ) : null}
          <button className="co-pay" type="submit" disabled={paying}>
            {paying ? <span className="ad-spinner" style={{ width: 18, height: 18 }} /> : <Icon name={xpay ? METHODS[method].icon : "lock"} size={18} />}
            {xpay ? `Pagar com ${METHODS[method].label}` : s.ctaLabel} · {mt(total)}
          </button>
          <p className="co-legal">Ao comprar aceita os Termos de uso. Processado pela VendAqui em nome de {data.seller.name}. NUIT do vendedor {data.seller.nuit}.</p>
        </div>
        <aside className="co-summary">
          <section className="co-box">
            <div className="co-prod"><Cover cover={p.cover} icon={coverIcon(p.type)} lg /><div><h4>{p.name}</h4><small>{p.subtitle}</small></div></div>
            <div className="co-lines">
              <div><span>{p.name}</span><b>{mt(p.price)}</b></div>
              {bumpAmount ? <div><span>Ebook 100 Fórmulas</span><b>{mt(bumpAmount)}</b></div> : null}
            </div>
            <div className="co-total"><span className="muted">Total</span><b>{mt(total)}</b></div>
          </section>
          <section className="co-box"><div className="co-guarantee"><span className="co-seal">{data.guaranteeDays}<small>dias</small></span><div><b>Garantia de {data.guaranteeDays} dias</b><p className="muted" style={{ fontSize: 13, marginTop: 2 }}>Se não gostar, pede o reembolso na área do aluno e recebe o valor de volta pelo mesmo meio de pagamento.</p></div></div></section>
          {s.testimonial.enabled ? <div className="co-testi"><span className="stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={14} />)}</span>“{s.testimonial.text}”<b style={{ fontSize: 13 }}>{s.testimonial.author}</b></div> : null}
        </aside>
      </form>
    </div>
  );
}


export { default, ThankYou } from "./Purchase";
