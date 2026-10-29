import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import type { Order, PaymentMethod, PublicCheckout } from "@/api/types";
import { Icon, PayLogo } from "@/lib/icons";
import { METHODS, METHOD_ORDER, operatorOf } from "@/lib/methods";
import { mt, dateLong } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { Avatar, Btn, Cover, ErrorState, Field, Input, Loading } from "@/components/ui";
import { Modal } from "@/components/overlay";

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
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const { toast } = useApp();
  useEffect(() => { if (!methods.includes(method) && methods[0]) setMethod(methods[0]); }, [methods.join(), method]);

  const check = useMutation({
    mutationFn: () => api.checkout.checkCoupon(data.slug, code),
    onSuccess: (r) => r.valid ? (setCoupon({ code: code.toUpperCase(), percent: r.percent ?? 0 }), toast("Cupão aplicado", `${r.percent}% de desconto no curso`)) : toast(r.message ?? "Cupão inválido", "Experimente ANA10", "danger", "xc"),
  });

  const p = data.product;
  const bumpAmount = s.orderBump.enabled && bump ? s.orderBump.price : 0;
  const disc = coupon ? Math.round(p.price * coupon.percent / 100) : 0;
  const total = p.price + bumpAmount - disc;
  const wallet = METHODS[method].wallet, xpay = method === "applepay" || method === "googlepay";

  return (
    <div className={`co acc-${s.accent}`}>
      {s.timer.enabled ? <div className="co-timer"><Icon name="clock" size={16} />Preço de lançamento termina em <Timer minutes={s.timer.minutes} /></div> : null}
      <div className="co-head"><div className="co-wrap"><span className="co-seller"><Avatar name="Ana Sitoe" />{data.seller.name}</span><span className="co-secure"><Icon name="lock" size={15} />Pagamento seguro</span></div></div>
      <form className="co-wrap co-grid" onSubmit={(e) => { e.preventDefault(); if (!preview) onPay?.({ name, email, phone, method, bump, coupon: coupon?.code }); }}>
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
              {disc ? <div><span>Cupão {coupon!.code}</span><b style={{ color: "var(--success)" }}>−{mt(disc)}</b></div> : null}
            </div>
            {coupon ? null : <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}><Input icon="tag" placeholder="Tem um cupão?" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Cupão" /><Btn onClick={() => code && !preview && check.mutate()} loading={check.isPending}>Aplicar</Btn></div>}
            <div className="co-total"><span className="muted">Total</span><b>{mt(total)}</b></div>
          </section>
          <section className="co-box"><div className="co-guarantee"><span className="co-seal">{data.guaranteeDays}<small>dias</small></span><div><b>Garantia de {data.guaranteeDays} dias</b><p className="muted" style={{ fontSize: 13, marginTop: 2 }}>Se não gostar, pede o reembolso na área do aluno e recebe o valor de volta pelo mesmo meio de pagamento.</p></div></div></section>
          {s.testimonial.enabled ? <div className="co-testi"><span className="stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={14} />)}</span>“{s.testimonial.text}”<b style={{ fontSize: 13 }}>{s.testimonial.author}</b></div> : null}
        </aside>
      </form>
    </div>
  );
}

function PaymentWait({ order, phone }: { order: Order; phone: string }) {
  const card = order.method === "card", xpay = order.method === "applepay" || order.method === "googlepay";
  const done = order.status === "approved";
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setTimeout(() => setStep(1), 900); return () => clearTimeout(t); }, []);
  const s = done ? 2 : step;
  const label = METHODS[order.method].label;
  const steps = card ? ["A validar o cartão", "Autenticação 3-D Secure", "Pagamento aprovado"] : xpay ? [`A abrir ${label}`, "Confirmação no dispositivo", "Pagamento aprovado"] : [`Pedido enviado para +258 ${phone}`, `A aguardar o PIN ${label}`, "Pagamento confirmado"];
  return (
    <Modal title={card ? "A processar o pagamento" : xpay ? `A pagar com ${label}` : "Confirme no seu telemóvel"} size="sm" noClose onClose={() => {}}>
      <div className="co-wait">
        {card || xpay ? <span className={`ad-tile ad-tile-lg ad-tile-soft ad-tone-${card ? "info" : "neutral"}`}><Icon name={METHODS[order.method].icon} size={24} /></span>
          : <div className="co-phone"><div className="co-ussd"><b>{label}</b><br />Confirma pagamento de {mt(order.total)} a VENDAQUI*EXCEL?<i>PIN: ••••</i></div></div>}
        <span className="co-countdown">{card ? "Não feche esta janela" : xpay ? `${mt(order.total)} para Excel com a Ana` : "O pedido expira em 60 s"}</span>
        <div className="co-wait-steps">{steps.map((t, i) => (
          <div key={t} className={i < s || s === 2 ? "done" : ""}>{i < s || s === 2 ? <Icon name="checkc" size={18} /> : i === s ? <span className="ad-spinner" style={{ width: 16, height: 16 }} /> : <Icon name="clock" size={18} className="faint" />}{t}</div>
        ))}</div>
      </div>
    </Modal>
  );
}

export default function Checkout() {
  const { slug = "excel-zero-avancado" } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["checkout", slug], queryFn: () => api.checkout.get(slug) });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [walletPhone, setWalletPhone] = useState("");
  const create = useMutation({
    mutationFn: (p: Parameters<NonNullable<Parameters<typeof CheckoutView>[0]["onPay"]>>[0]) => {
      setWalletPhone(p.phone);
      return api.checkout.createOrder(slug, { buyer: { name: p.name, email: p.email, phone: p.phone }, method: p.method, walletPhone: METHODS[p.method].wallet ? p.phone : undefined, cardToken: p.method === "card" ? "tok_demo_visa" : undefined, orderBump: p.bump, coupon: p.coupon });
    },
    onSuccess: (o) => setOrderId(o.id),
    onError: (e) => toast("Não foi possível iniciar o pagamento", e instanceof HttpError ? e.message : "Tente outra vez.", "danger", "alert"),
  });
  const status = useQuery({ queryKey: ["order", orderId], queryFn: () => api.checkout.order(orderId!), enabled: !!orderId, refetchInterval: (qq) => (qq.state.data?.status === "awaiting_confirmation" || !qq.state.data ? 1000 : false) });
  useEffect(() => {
    const o = status.data;
    if (!o) return;
    if (o.status === "approved") { const t = setTimeout(() => nav(`/obrigado/${o.id}`), 900); return () => clearTimeout(t); }
    if (o.status === "declined" || o.status === "expired") { setOrderId(null); toast(o.status === "declined" ? "Pagamento recusado" : "O pedido expirou", "Tente outra vez ou escolha outro meio de pagamento.", "danger", "xc"); }
  }, [status.data, nav, toast]);

  if (q.isPending) return <div className="co-wrap" style={{ paddingBlock: 32 }}><Loading /></div>;
  if (q.isError) return <div className="co-wrap" style={{ paddingBlock: 32 }}><ErrorState error={q.error} retry={() => q.refetch()} /></div>;
  return (
    <>
      <CheckoutView data={q.data} onPay={(p) => create.mutate(p)} paying={create.isPending} />
      {orderId && status.data ? <PaymentWait order={status.data} phone={walletPhone} /> : null}
    </>
  );
}

export function ThankYou() {
  const { orderId = "" } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["order", orderId], queryFn: () => api.checkout.order(orderId) });
  const upsell = useMutation({ mutationFn: () => api.checkout.acceptUpsell(orderId), onSuccess: () => { toast("Power BI adicionado", `Novo pedido de ${mt(2390)} enviado para confirmar`); setTimeout(() => nav("/aluno"), 900); } });
  if (q.isPending) return <div className="co-wrap" style={{ paddingBlock: 32 }}><Loading /></div>;
  if (q.isError) return <div className="co-wrap" style={{ paddingBlock: 32 }}><ErrorState error={q.error} /></div>;
  const o = q.data;
  return (
    <div className="co acc-orange">
      <div className="co-head"><div className="co-wrap"><span className="co-seller"><Avatar name="Ana Sitoe" />Excel com a Ana</span><span className="co-secure"><Icon name="lock" size={15} />Pagamento seguro</span></div></div>
      <div className="co-wrap"><div className="ty">
        <div className="ty-hero"><span className="ty-check"><Icon name="check" size={36} /></span><h1>Pagamento aprovado</h1><p>Enviámos o acesso para <b>{o.buyerEmail}</b> e um SMS para +258 {o.buyerPhone}.</p></div>
        <section className="co-box">
          <dl className="dl"><dt>Pedido</dt><dd className="mono">{o.id}</dd><dt>Produto</dt><dd>{o.items.filter((i) => i.amount > 0).map((i) => i.name).join(" + ")}</dd><dt>Pago com</dt><dd><PayLogo method={o.method} /></dd><dt>Total</dt><dd>{mt(o.total)}</dd><dt>Garantia até</dt><dd>{dateLong(o.guaranteeUntil)}</dd></dl>
          <Btn v="primary" s="lg" to="/aluno/aulas/m2l3" iconRight="arrow" block>Aceder ao curso</Btn>
        </section>
        {o.upsell ? (
          <div className="upsell"><div className="upsell-top"><span>Espere, esta oferta só aparece agora</span><span>Adicione com 1 clique</span></div>
            <div className="upsell-body"><Cover cover="blue" icon="cap" lg /><div className="grow"><b style={{ fontSize: 16 }}>{o.upsell.title}</b><p className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{o.upsell.description}</p></div><div className="stack-xs" style={{ alignItems: "flex-end" }}><span className="price-old">{mt(o.upsell.originalPrice)}</span><span className="price-new">{mt(o.upsell.price)}</span></div></div>
            <div style={{ padding: "0 20px 20px" }} className="row"><Btn v="primary" className="grow" loading={upsell.isPending} onClick={() => upsell.mutate()}>Sim, adicionar ao meu pedido</Btn><Btn v="ghost" to="/aluno">Não, obrigado</Btn></div>
          </div>
        ) : null}
      </div></div>
    </div>
  );
}
