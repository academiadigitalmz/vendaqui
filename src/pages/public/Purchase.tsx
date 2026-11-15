import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { Purchase as PurchaseResult, WalletMethod } from "@/api/checkout";
import { HttpError } from "@/api/http";
import { paymentState, normalizePhone, readDraft, saveDraft, type CheckoutDraft } from "@/lib/checkout-state";
import { useApp } from "@/lib/app-state";
import { mt } from "@/lib/format";
import { Alert, Btn, ErrorState, Field, Input, Loading } from "@/components/ui";

const errorMessage = (e: unknown) => e instanceof Error ? e.message : "Não foi possível comunicar com o servidor.";
const label = (method: string) => method === "mpesa" ? "M-Pesa" : "e-Mola";

export default function Purchase() {
  const { slug = "" } = useParams();
  return <PurchaseForm key={slug} slug={slug} />;
}
function PurchaseForm({ slug }: { slug: string }) {
  const nav = useNavigate();
  const { session } = useApp();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState<CheckoutDraft | null>(() => readDraft(slug));
  const [name, setName] = useState(session?.user.name ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [phone, setPhone] = useState(session?.user.phone ?? "");
  const [method, setMethod] = useState<WalletMethod>("mpesa");
  const [offerId, setOfferId] = useState(params.get("offerId") ?? "");
  const product = useQuery({ queryKey: ["checkout-product", slug], queryFn: () => api.checkout.product(slug) });
  const methods = useQuery({ queryKey: ["checkout-methods"], queryFn: api.checkout.methods });
  const available = (methods.data ?? []).filter(m => m.isEnabled && m.ready && ["mpesa", "emola"].includes(m.method));
  const offers = (product.data?.offers ?? []).filter(o => o.isActive && o.currency === "MZN" && !o.billingPeriod && o.priceAmount > 0);
  const offer = offers.find(o => o.id === offerId) ?? (!offerId ? offers.find(o => o.isDefault) ?? offers[0] : undefined);
  useEffect(() => { if (available.length && !available.some(m => m.method === method)) setMethod(available[0].method as WalletMethod); }, [methods.data, method]);

  const persist = (d: CheckoutDraft) => { saveDraft(slug, d); setDraft({ ...d }); };
  const create = useMutation({
    mutationFn: async () => {
      if (!product.data || !offer) throw new Error("Seleccione uma oferta disponível.");
      if (draft && (draft.ownerId ?? null) !== (session?.user.id ?? null)) throw new Error("Retome o pedido com a mesma sessão em que iniciou a compra.");
      const msisdn = draft?.input.msisdn ?? normalizePhone(phone);
      if (!/^2588[4-7]\d{7}$/.test(msisdn)) throw new Error("Introduza um número de carteira válido.");
      if (!draft && ((method === "mpesa" && !/^2588[45]/.test(msisdn)) || (method === "emola" && !/^2588[67]/.test(msisdn)))) throw new Error(`Use um número ${label(method)}.`);
      const d = draft ?? { key: crypto.randomUUID(), ownerId: session?.user.id, input: { productId: product.data.product.id, offerId: offer.id, method, msisdn,
        ...(!session ? { buyer: { name: name.trim(), email: email.trim(), msisdn } } : {}) } };
      persist(d);
      const result = await api.checkout.create(d.input, d.key);
      persist({ ...d, orderId: result.order.id, token: result.checkoutToken });
      return result;
    },
  });
  const status = useQuery({
    queryKey: ["checkout-order", draft?.orderId],
    queryFn: () => api.checkout.order(draft!.orderId!, draft?.token), enabled: !!draft?.orderId,
    refetchInterval: q => q.state.data && ["paid", "closed", "retry"].includes(paymentState(q.state.data)) ? false : 2000,
    retry: false,
  });
  useEffect(() => { if (status.data && paymentState(status.data) === "paid") nav(`/obrigado/${status.data.order.id}`, { replace: true }); }, [status.data, nav]);
  const retry = useMutation({
    mutationFn: async () => {
      if (!draft?.orderId || !status.data || paymentState(status.data) !== "retry") throw new Error("Aguarde a confirmação antes de tentar novamente.");
      const msisdn = normalizePhone(phone || draft.input.msisdn);
      if (!/^2588[4-7]\d{7}$/.test(msisdn)) throw new Error("Introduza um número válido.");
      const operation = draft.retry ?? { key: crypto.randomUUID(), input: { method, msisdn } };
      persist({ ...draft, retry: operation });
      const result = await api.checkout.retry(draft.orderId, operation.input, operation.key, draft.token);
      persist({ ...draft, retry: undefined });
      await status.refetch();
      return result;
    },
  });
  if (product.isPending || methods.isPending) return <Loading />;
  if (product.isError || methods.isError) return <ErrorState error={product.error ?? methods.error} retry={() => { product.refetch(); methods.refetch(); }} />;
  const p = product.data;
  const locked = !!draft;
  return <main className="co acc-orange"><div className="co-wrap" style={{ paddingBlock: 32 }}>
    <h1>{p.product.name}</h1><p className="muted">{p.sellerDisplayName}</p>
    <div className="co-grid">
      <form className="co-box stack-sm" onSubmit={e => { e.preventDefault(); create.mutate(); }}>
        <h2>Concluir compra</h2>
        {!session && <><Field label="Nome completo"><Input id="co-name" value={name} onChange={e => setName(e.target.value)} required disabled={locked} autoComplete="name" /></Field>
          <Field label="Email"><Input id="co-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={locked} autoComplete="email" /></Field></>}
        {session && <p>A comprar como {session.user.name} · {session.user.email}</p>}
        <Field label="Oferta"><select aria-label="Oferta" value={offer?.id ?? ""} onChange={e => setOfferId(e.target.value)} disabled={locked}>{offers.map(o => <option key={o.id} value={o.id}>{o.name} · {mt(o.priceAmount)}</option>)}</select></Field>
        <div className="pmethods" role="radiogroup" aria-label="Método de pagamento">{available.map(m => <button className={`pmethod ${method === m.method ? "on" : ""}`} type="button" role="radio" aria-checked={method === m.method} key={m.method} disabled={locked && !draft?.orderId} onClick={() => setMethod(m.method as WalletMethod)}>{label(m.method)}</button>)}</div>
        <Field label="Número da carteira"><Input id="co-wallet" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="258840000000" required disabled={locked && !draft?.orderId} autoComplete="tel" /></Field>
        {create.isError && <Alert tone="danger" title="Não foi possível concluir o pedido" text={errorMessage(create.error)} />}
        {draft && !draft.orderId && <Alert title="Pedido por confirmar" text="Retome o mesmo pedido para recuperar o resultado. Os dados e a referência serão reutilizados." />}
        {!draft?.orderId && <Btn type="submit" v="primary" loading={create.isPending} disabled={!offer || !available.length}>{draft ? "Retomar pedido" : `Pagar ${offer ? mt(offer.priceAmount) : ""}`}</Btn>}
        {(!offer || !available.length) && <Alert title="Compra indisponível" text="Não há uma oferta ou método de pagamento disponível neste momento." />}
        {draft?.orderId && <>
          {status.isPending && <Loading />}
          {status.isError && <ErrorState error={status.error} retry={() => status.refetch()} />}
          {status.data && <PaymentStatus purchase={status.data} />}
          {status.data && paymentState(status.data) === "retry" && <Btn v="primary" loading={retry.isPending} onClick={() => retry.mutate()}>Tentar pagamento novamente</Btn>}
          {retry.isError && <Alert tone="danger" title="Não foi possível confirmar a tentativa" text={errorMessage(retry.error)} />}
          <Btn to={`/obrigado/${draft.orderId}`}>Ver encomenda</Btn>
        </>}
      </form>
      <aside className="co-box stack-sm">{p.coverUrl && <img src={p.coverUrl} alt="" style={{ maxWidth: "100%" }} />}<h2>Resumo</h2><p>{p.product.description}</p><strong>{offer ? mt(offer.priceAmount) : "Oferta indisponível"}</strong>{p.product.guaranteeDays != null && <p>Garantia do produto: {p.product.guaranteeDays} dias.</p>}<p>Confirme o pedido na sua carteira. O estado será actualizado quando o pagamento for confirmado.</p></aside>
    </div>
  </div></main>;
}
function PaymentStatus({ purchase }: { purchase: PurchaseResult }) {
  const state = paymentState(purchase);
  const text = state === "paid" ? "Pagamento confirmado." : state === "retry" ? "A cobrança foi recusada. Pode tentar novamente nesta encomenda." : state === "closed" ? "Esta encomenda já não aceita pagamentos." : "Estamos a confirmar o resultado. Não repita a cobrança enquanto aguarda.";
  return <Alert title={state === "paid" ? "Pagamento aprovado" : state === "retry" ? "Pagamento recusado" : "Estado da compra"} text={text} />;
}

export function ThankYou() {
  const { orderId = "" } = useParams();
  const { session, signIn } = useApp();
  const draft = readDraft("order." + orderId);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState(draft?.input.buyer?.email ?? "");
  const [loginPassword, setLoginPassword] = useState("");
  const q = useQuery({ queryKey: ["checkout-order", orderId], queryFn: () => api.checkout.order(orderId, draft?.token), retry: false,
    refetchInterval: query => query.state.data && ["closed", "retry"].includes(paymentState(query.state.data)) ? false : query.state.data && paymentState(query.state.data) === "paid" && query.state.data.claimStatus !== "pending_payment" ? false : 2000 });
  const claim = useMutation({ mutationFn: () => api.checkout.claim(orderId, code, password, draft?.token), onSuccess: async r => {
    if (r.accessToken && r.user) signIn({ token: r.accessToken, user: { ...r.user, role: "student", phone: r.user.msisdn } });
    setPassword(""); await q.refetch();
  } });
  const login = useMutation({ mutationFn: () => api.checkout.login(loginEmail, loginPassword), onSuccess: r => { signIn({ token: r.accessToken, user: { ...r.user, phone: r.user.msisdn, role: "student" } }); setLoginPassword(""); } });
  if (q.isPending) return <Loading />;
  if (q.isError) return <div className="co-wrap"><ErrorState error={q.error} retry={() => q.refetch()} /><p>Para uma compra como convidado, abra esta página no mesmo separador onde iniciou a compra.</p></div>;
  const p = q.data;
  const paid = paymentState(p) === "paid";
  return <main className="co-wrap stack-sm" style={{ paddingBlock: 32 }}><h1>{paid ? "Pagamento aprovado" : "Acompanhar encomenda"}</h1><PaymentStatus purchase={p} />
    <section className="co-box"><dl className="dl"><dt>Encomenda</dt><dd>{p.order.orderNumber}</dd><dt>Total</dt><dd>{mt(p.order.totalAmount)}</dd><dt>Pagamento</dt><dd>{label(p.attempt.method)}</dd></dl>{p.order.items?.map(i => <p key={i.productId}>{i.productName} · {i.offerName}</p>)}</section>
    {paid && p.claimStatus === "pending_identity" && <section className="co-box stack-sm"><h2>Associar a compra à sua conta</h2><p>Introduza o código enviado para o email da compra. Se já tem conta, inicie sessão abaixo; caso contrário, escolha uma palavra-passe.</p>
      {!session && <form className="stack-sm" onSubmit={e => { e.preventDefault(); login.mutate(); }}><h3>Já tenho conta</h3><Field label="Email"><Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required /></Field><Field label="Palavra-passe da conta"><Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required autoComplete="current-password" /></Field><Btn type="submit" loading={login.isPending}>Iniciar sessão</Btn>{login.isError && <Alert title="Não foi possível entrar" text={errorMessage(login.error)} tone="danger" />}</form>}
      <form className="stack-sm" onSubmit={e => { e.preventDefault(); claim.mutate(); }}><Field label="Código de confirmação" htmlFor="claim-code"><Input id="claim-code" value={code} onChange={e => setCode(e.target.value)} required autoComplete="one-time-code" /></Field>{!session && <Field label="Nova palavra-passe (para criar conta)" htmlFor="claim-password"><Input id="claim-password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={12} maxLength={128} required autoComplete="new-password" /></Field>}<Btn type="submit" v="primary" loading={claim.isPending}>Confirmar acesso</Btn>{claim.isError && <Alert tone="danger" title="Não foi possível associar a compra" text={errorMessage(claim.error)} />}</form>
    </section>}
    {paid && p.claimStatus === "manual_review" && <p>A compra precisa de revisão. Contacte o apoio com o número da encomenda.</p>}
    {paid && p.claimStatus === "pending_payment" && <p>A preparar a confirmação de identidade. Aguarde ou actualize o estado.</p>}
    {paid && (!p.claimStatus || p.claimStatus === "claimed") && p.order.items?.map(i => <Link className="ad-btn ad-btn-primary" key={i.productId} to={`/compras/${i.productId}/conteudo`}>Aceder a {i.productName}</Link>)}
    <Btn onClick={() => q.refetch()}>Actualizar estado</Btn>
  </main>;
}
