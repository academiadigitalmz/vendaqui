import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { CheckoutOrder, Purchase as PurchaseResult, WalletMethod } from "@/api/checkout";
import { HttpError } from "@/api/http";
import {
  canStartOver,
  clearDraft,
  paymentState,
  normalizePhone,
  readDraft,
  releaseDraft,
  saveDraft,
  type CheckoutDraft,
} from "@/lib/checkout-state";
import { useApp } from "@/lib/app-state";
import { mt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { Alert, Avatar, Btn, ErrorState, Field, Input, Loading } from "@/components/ui";

const errorMessage = (e: unknown) =>
  e instanceof Error
    ? e.message
    : "Não foi possível concluir. Verifique a ligação e tente novamente.";
const label = (method: string) => (method === "mpesa" ? "M-Pesa" : "e-Mola");
const CHECKOUT_METHOD: WalletMethod = "mpesa";
const checkoutToken = (draft?: CheckoutDraft | null) => draft?.token ?? draft?.key;
// The server refused the request itself, so the buyer may correct it and send a new one.
const isRejected = (e: unknown) => e instanceof HttpError && [400, 422].includes(e.status);
const isOverdue = (order: CheckoutOrder) => new Date(order.expiresAt).getTime() <= Date.now();

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
  const offerId = params.get("offerId") ?? "";
  const product = useQuery({
    queryKey: ["checkout-product", slug],
    queryFn: () => api.checkout.product(slug),
  });
  const methods = useQuery({ queryKey: ["checkout-methods"], queryFn: api.checkout.methods });
  const mpesaAvailable = (methods.data ?? []).some(
    (m) => m.method === CHECKOUT_METHOD && m.isEnabled && m.ready,
  );
  const offers = (product.data?.offers ?? []).filter(
    (o) => o.isActive && o.currency === "MZN" && !o.billingPeriod && o.priceAmount > 0,
  );
  const offer =
    offers.find((o) => o.id === offerId) ??
    (!offerId ? (offers.find((o) => o.isDefault) ?? offers[0]) : undefined);

  const persist = (d: CheckoutDraft) => {
    saveDraft(slug, d);
    setDraft({ ...d });
  };
  const create = useMutation({
    mutationFn: async () => {
      if (!product.data || !offer) throw new Error("Seleccione uma oferta disponível.");
      if (draft && (draft.ownerId ?? null) !== (session?.user.id ?? null))
        throw new Error("Continue com a mesma conta usada para iniciar a compra.");
      const msisdn = normalizePhone(draft?.input.msisdn ?? phone);
      if (!/^\+2588[45]\d{7}$/.test(msisdn)) throw new Error("Introduza um número M-Pesa válido.");
      const d = draft ?? {
        key: crypto.randomUUID(),
        ownerId: session?.user.id,
        input: {
          productId: product.data.product.id,
          offerId: offer.id,
          method: CHECKOUT_METHOD,
          msisdn,
          ...(!session ? { buyer: { name: name.trim(), email: email.trim(), msisdn } } : {}),
        },
      };
      persist(d);
      try {
        const result = await api.checkout.create(d.input, d.key);
        persist({ ...d, orderId: result.order.id, token: result.checkoutToken });
        return result;
      } catch (error) {
        if (isRejected(error)) {
          clearDraft(slug, d);
          setDraft(null);
        }
        throw error;
      }
    },
  });
  const status = useQuery({
    queryKey: ["checkout-order", draft?.orderId],
    queryFn: () => api.checkout.order(draft!.orderId!, checkoutToken(draft)),
    enabled: !!draft?.orderId,
    refetchInterval: (q) =>
      q.state.error ||
      (q.state.data && ["paid", "closed", "retry"].includes(paymentState(q.state.data)))
        ? false
        : q.state.data && isOverdue(q.state.data.order)
          ? 15000
          : 2000,
    retry: false,
  });
  useEffect(() => {
    if (status.data && paymentState(status.data) === "paid") {
      releaseDraft(slug);
      nav(`/obrigado/${status.data.order.id}`, { replace: true });
    }
  }, [status.data, nav, slug]);
  const retry = useMutation({
    mutationFn: async () => {
      if (!draft?.orderId || !status.data || paymentState(status.data) !== "retry")
        throw new Error("Aguarde a confirmação antes de tentar novamente.");
      const msisdn = normalizePhone(phone || draft.input.msisdn);
      if (!/^\+2588[45]\d{7}$/.test(msisdn)) throw new Error("Introduza um número M-Pesa válido.");
      const operation = draft.retry ?? {
        key: crypto.randomUUID(),
        input: { method: CHECKOUT_METHOD, msisdn },
      };
      persist({ ...draft, retry: operation });
      try {
        const result = await api.checkout.retry(
          draft.orderId,
          operation.input,
          operation.key,
          checkoutToken(draft),
        );
        persist({ ...draft, retry: undefined });
        await status.refetch();
        return result;
      } catch (error) {
        if (isRejected(error)) persist({ ...draft, retry: undefined });
        throw error;
      }
    },
  });
  const startOver = () => {
    clearDraft(slug, draft);
    setDraft(null);
    create.reset();
    retry.reset();
  };
  if (product.isPending || methods.isPending) return <Loading />;
  if (product.isError || methods.isError)
    return (
      <ErrorState
        error={product.error ?? methods.error}
        retry={() => {
          product.refetch();
          methods.refetch();
        }}
      />
    );
  const p = product.data;
  const locked = !!draft;
  return (
    <main className="co acc-green">
      <header className="co-head">
        <div className="co-wrap">
          <Link to="/" className="co-seller" title="Voltar à página inicial">
            <Avatar name={p.sellerDisplayName} s="sm" />
            <span>{p.sellerDisplayName}</span>
          </Link>
          <span className="co-secure">
            <Icon name="lock" size={15} />
            Pagamento seguro
          </span>
        </div>
      </header>
      <div className="co-wrap co-checkout">
        <div className="co-grid co-purchase-grid">
          <form
            className="co-checkout-form"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <section className="co-box co-step-card">
              <div className="co-section-head">
                <span>1</span>
                <div>
                  <h2>Os seus dados</h2>
                  <p>Usaremos estes dados para identificar e entregar a sua compra.</p>
                </div>
              </div>
              {!session ? (
                <div className="co-fields">
                  <Field label="Nome completo">
                    <Input
                      id="co-name"
                      icon="user"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={locked}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      id="co-email"
                      icon="mail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={locked}
                      autoComplete="email"
                    />
                  </Field>
                </div>
              ) : (
                <div className="co-buyer">
                  <Icon name="check" size={17} />
                  <div>
                    <strong>{session.user.name}</strong>
                    <span>{session.user.email}</span>
                  </div>
                </div>
              )}
            </section>
            <section className="co-box co-step-card">
              <div className="co-section-head">
                <span>2</span>
                <div>
                  <h2>Pagamento</h2>
                  <p>Confirme o número que receberá o pedido da M-Pesa.</p>
                </div>
              </div>
              <div
                className="co-methods co-methods-single"
                role="radiogroup"
                aria-label="Método de pagamento"
              >
                <div
                  className={`co-method on ${mpesaAvailable ? "" : "is-disabled"}`}
                  role="radio"
                  aria-checked="true"
                  aria-disabled={!mpesaAvailable}
                >
                  <div className="co-method-brand">
                    <strong>M-Pesa</strong>
                    <small>Vodacom</small>
                  </div>
                </div>
              </div>
              <Field label="Número M-Pesa">
                <Input
                  id="co-wallet"
                  icon="phone"
                  prefix="+258"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="84 123 4567"
                  required
                  disabled={locked && (!draft?.orderId || !!draft.retry)}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </Field>
              <div className="co-note">
                <Icon name="phone" size={17} />
                <span>
                  Depois de avançar, receberá no telemóvel um pedido de confirmação da M-Pesa.
                  Introduza o PIN no telemóvel para concluir.
                </span>
              </div>
            </section>
            {create.isError && (
              <Alert
                tone="danger"
                title="Não foi possível concluir o pedido"
                text={errorMessage(create.error)}
              />
            )}
            {!draft?.orderId && (
              <div className="co-submit">
                <Btn
                  type="submit"
                  v="primary"
                  s="lg"
                  block
                  icon="lock"
                  loading={create.isPending}
                  disabled={!offer || !mpesaAvailable}
                >
                  {draft
                    ? "Retomar pedido"
                    : `Comprar agora · ${offer ? mt(offer.priceAmount) : "—"}`}
                </Btn>
              </div>
            )}
            {!offer && (
              <Alert
                title="Compra indisponível"
                text="Este produto não tem um preço disponível neste momento."
              />
            )}
            {!mpesaAvailable && (
              <Alert
                title="M-Pesa indisponível"
                text="Não é possível iniciar este pagamento neste momento. Tente novamente mais tarde."
              />
            )}
            {draft?.orderId && (
              <>
                {status.isPending && <Loading />}
                {status.isError && (
                  <ErrorState error={status.error} retry={() => status.refetch()} />
                )}
                {status.data && <PaymentStatus purchase={status.data} />}
                {status.data && paymentState(status.data) === "retry" && (
                  <Btn v="primary" loading={retry.isPending} onClick={() => retry.mutate()}>
                    Tentar pagamento novamente
                  </Btn>
                )}
                {status.data && canStartOver(status.data) && (
                  <Btn v="primary" onClick={startOver}>
                    Fazer nova encomenda
                  </Btn>
                )}
                {retry.isError && (
                  <Alert
                    tone="danger"
                    title="Não foi possível confirmar a tentativa"
                    text={errorMessage(retry.error)}
                  />
                )}
              </>
            )}
          </form>
          <div className="co-summary-stack">
            <aside className="co-box co-summary">
              <h2>Resumo da compra</h2>
              <div className="co-product-summary">
                {p.coverUrl ? (
                  <img src={p.coverUrl} alt={`Capa de ${p.product.name}`} />
                ) : (
                  <div className="co-cover-placeholder">
                    <Icon name={p.product.type === "course" ? "cap" : "file"} size={28} />
                  </div>
                )}
                <div>
                  <span>{p.product.type === "course" ? "Curso" : "Ebook"}</span>
                  <h3>{p.product.name}</h3>
                  <p>{p.sellerDisplayName}</p>
                </div>
              </div>
              <p className="co-description">{p.product.description}</p>
              <div className="co-lines">
                <div>
                  <span>Produto</span>
                  <b>{offer ? mt(offer.priceAmount) : "Indisponível"}</b>
                </div>
              </div>
              <div className="co-total">
                <span>Total</span>
                <b>{offer ? mt(offer.priceAmount) : "—"}</b>
              </div>
            </aside>
            {p.product.guaranteeDays ? (
              <section className="co-box co-guarantee">
                <span className="co-seal">
                  <strong>{p.product.guaranteeDays}</strong>
                  <small>dias</small>
                </span>
                <div>
                  <strong>Garantia de {p.product.guaranteeDays} dias</strong>
                  <p>Este produto inclui uma garantia definida pelo produtor.</p>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
function PaymentStatus({ purchase }: { purchase: PurchaseResult }) {
  const state = paymentState(purchase);
  if (state === "waiting") return <PaymentWait order={purchase.order} />;
  if (state === "paid") return null;
  const text =
    state === "retry"
      ? "A cobrança foi recusada. Pode tentar novamente."
      : canStartOver(purchase)
        ? "Esta encomenda já não aceita pagamentos."
        : `Não pague de novo. Contacte o apoio e indique a encomenda ${purchase.order.orderNumber}.`;
  return (
    <Alert title={state === "retry" ? "Pagamento recusado" : "Encomenda encerrada"} text={text} />
  );
}
function PaymentWait({ order }: { order: CheckoutOrder }) {
  const [, setExpired] = useState(false);
  useEffect(() => {
    const remaining = new Date(order.expiresAt).getTime() - Date.now();
    if (!(remaining > 0)) return;
    // Identical poll results do not re-render, so the deadline needs its own timer.
    const timer = setTimeout(() => setExpired(true), Math.min(remaining, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [order.expiresAt]);
  const overdue = isOverdue(order);
  return (
    <div className="co-payment-wait" role="status">
      <span className="ad-spinner" />
      <strong>{overdue ? "Ainda sem confirmação" : "A confirmar o pagamento"}</strong>
      <p>
        {overdue
          ? "Não pague de novo. Contacte o apoio e indique esta encomenda."
          : "Se receber o pedido no telemóvel, introduza o PIN. Não repita o pagamento."}
      </p>
      <small>Encomenda {order.orderNumber}</small>
    </div>
  );
}

export function ThankYou() {
  const { orderId = "" } = useParams();
  const { session, signIn } = useApp();
  const draft = readDraft("order." + orderId);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState(draft?.input.buyer?.email ?? "");
  const [showClaim, setShowClaim] = useState(false);
  const q = useQuery({
    queryKey: ["checkout-order", orderId],
    queryFn: () => api.checkout.order(orderId, checkoutToken(draft)),
    retry: false,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const result = query.state.data;
      if (!result) return 2000;
      if (paymentState(result) === "waiting") return isOverdue(result.order) ? 15000 : 2000;
      if (["closed", "retry"].includes(paymentState(result))) return false;
      return result.claimStatus === "pending_payment" ||
        (result.claimStatus === "pending_identity" && result.claimMode === "existing_account")
        ? 2000
        : false;
    },
  });
  const claim = useMutation({
    mutationFn: async () => {
      const result = await api.checkout.claim(orderId, code, password, checkoutToken(draft));
      if (!result.accessToken && q.data?.claimMode === "unverified_account") {
        const authenticated = await api.checkout.login(loginEmail, password);
        return { ...result, accessToken: authenticated.accessToken, user: authenticated.user };
      }
      return result;
    },
    onSuccess: async (r) => {
      if (r.accessToken && r.user)
        signIn({
          token: r.accessToken,
          user: { ...r.user, role: "student", phone: r.user.msisdn },
        });
      setPassword("");
      await q.refetch();
    },
  });
  const autoAssociate =
    q.data &&
    paymentState(q.data) === "paid" &&
    q.data.claimStatus === "pending_identity" &&
    q.data.claimMode === "existing_account";
  useEffect(() => {
    if (autoAssociate && claim.isIdle) claim.mutate();
  }, [autoAssociate, claim.isIdle]);
  if (q.isPending) return <Loading />;
  if (q.isError)
    return (
      <div className="co-wrap">
        <ErrorState error={q.error} retry={() => q.refetch()} />
        <p>
          Para uma compra como convidado, abra esta página no mesmo separador onde iniciou a compra.
        </p>
      </div>
    );
  const p = q.data;
  const state = paymentState(p);
  const paid = state === "paid";
  const linking = p.claimStatus === "pending_identity" && p.claimMode === "existing_account";
  const hasAccess = !p.claimStatus || p.claimStatus === "claimed" || (linking && claim.isSuccess);
  if (state === "waiting")
    return (
      <main className="co-wrap" style={{ paddingBlock: 32 }}>
        <PaymentWait order={p.order} />
      </main>
    );
  if (!paid)
    return (
      <main className="co-wrap stack-sm purchase-result">
        <h1>Encomenda encerrada</h1>
        <PaymentStatus purchase={p} />
      </main>
    );
  return (
    <main className="co-wrap purchase-complete">
      <header className="purchase-complete-head">
        <div>
          <span>Compra concluída</span>
          <h1>Pagamento aprovado</h1>
          <p>A sua compra foi confirmada com sucesso.</p>
        </div>
      </header>
      <section className="co-box purchase-receipt">
        <div className="purchase-receipt-head">
          <span>Encomenda</span>
          <strong>{p.order.orderNumber}</strong>
        </div>
        <div className="purchase-receipt-body">
          <div>
            <span>Produto</span>
            {p.order.items?.map((i) => (
              <strong key={i.productId}>{i.productName}</strong>
            ))}
          </div>
          <div>
            <span>Pagamento</span>
            <strong>{label(p.attempt.method)}</strong>
          </div>
          <div>
            <span>Total pago</span>
            <strong>{mt(p.order.totalAmount)}</strong>
          </div>
        </div>
      </section>
      {p.claimStatus === "pending_identity" && p.claimMode !== "existing_account" && (
        <section className="co-box purchase-identity">
          <div className="purchase-email-icon">
            <Icon name="mail" size={24} />
          </div>
          <div className="purchase-identity-copy">
            <span>Próximo passo</span>
            <h2>
              {p.claimMode === "unverified_account"
                ? "Confirme o email da sua conta"
                : "Verifique o seu email"}
            </h2>
            <p>
              {p.claimMode === "unverified_account" ? (
                <>
                  Enviámos um código para <strong>{draft?.input.buyer?.email ?? loginEmail}</strong>
                  . Confirme o email para concluir a sua conta e aceder à compra.
                </>
              ) : (
                <>
                  Enviámos um código para{" "}
                  <strong>{draft?.input.buyer?.email ?? "o email usado na compra"}</strong>.
                  Introduza-o para criar a conta e aceder ao conteúdo.
                </>
              )}
            </p>
          </div>
          {p.claimMode === "unverified_account" &&
            (!showClaim ? (
              <Btn v="primary" onClick={() => setShowClaim(true)}>
                Introduzir código
              </Btn>
            ) : (
              <div className="purchase-claim">
                <form
                  className="stack-sm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    claim.mutate();
                  }}
                >
                  <Field label="Código de confirmação" htmlFor="claim-code">
                    <Input
                      id="claim-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoComplete="one-time-code"
                    />
                  </Field>
                  <Field label="Palavra-passe da conta" htmlFor="claim-password">
                    <Input
                      id="claim-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </Field>
                  <Btn type="submit" v="primary" loading={claim.isPending}>
                    Confirmar e aceder
                  </Btn>
                  {claim.isError && (
                    <Alert
                      tone="danger"
                      title="Não foi possível confirmar a conta"
                      text={errorMessage(claim.error)}
                    />
                  )}
                </form>
              </div>
            ))}
          {p.claimMode === "create_account" &&
            (!showClaim ? (
              <Btn v="primary" onClick={() => setShowClaim(true)}>
                Introduzir código
              </Btn>
            ) : (
              <div className="purchase-claim">
                <form
                  className="stack-sm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    claim.mutate();
                  }}
                >
                  <div>
                    <h3>Crie a sua palavra-passe</h3>
                    <p className="muted">O email será confirmado quando validar o código.</p>
                  </div>
                  <Field label="Código de confirmação" htmlFor="claim-code">
                    <Input
                      id="claim-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoComplete="one-time-code"
                    />
                  </Field>
                  <Field label="Palavra-passe" htmlFor="claim-password">
                    <Input
                      id="claim-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={12}
                      maxLength={128}
                      required
                      autoComplete="new-password"
                    />
                  </Field>
                  <Btn type="submit" v="primary" loading={claim.isPending}>
                    Criar conta e aceder
                  </Btn>
                  {claim.isError && (
                    <Alert
                      tone="danger"
                      title="Não foi possível criar a conta"
                      text={errorMessage(claim.error)}
                    />
                  )}
                </form>
              </div>
            ))}
          {!p.claimMode && (
            <div className="co-payment-wait" role="status" aria-label="A preparar confirmação">
              <span className="ad-spinner" />
            </div>
          )}
        </section>
      )}
      {linking && claim.isError && (
        <Alert
          tone="danger"
          title="Não foi possível associar a compra à sua conta"
          text={errorMessage(claim.error)}
          action={
            <>
              <Btn s="sm" onClick={() => claim.mutate()}>
                Tentar novamente
              </Btn>
              {!session && (
                <Btn s="sm" to={`/entrar?next=${encodeURIComponent(`/obrigado/${orderId}`)}`}>
                  Iniciar sessão
                </Btn>
              )}
            </>
          }
        />
      )}
      {linking && !claim.isError && !claim.isSuccess && (
        <div className="co-payment-wait" role="status">
          <span className="ad-spinner" />
          <p>A associar a compra à sua conta…</p>
        </div>
      )}
      {p.claimStatus === "manual_review" && (
        <Alert
          tone="danger"
          title="Precisamos de rever esta compra"
          text={`Contacte o apoio e indique a encomenda ${p.order.orderNumber}.`}
        />
      )}
      {p.claimStatus === "pending_payment" && (
        <div className="co-payment-wait" role="status" aria-label="A preparar acesso">
          <span className="ad-spinner" />
        </div>
      )}
      {hasAccess && (
        <div className="purchase-access">
          {p.order.items?.map((i) => (
            <div className="purchase-access-item" key={i.productId}>
              <span className="purchase-access-icon">
                <Icon name="book" size={22} />
              </span>
              <div>
                <small>Disponível na sua conta</small>
                <strong>{i.productName}</strong>
              </div>
              <Btn to={`/compras/${i.productId}/conteudo`} v="primary" s="lg" icon="arrow">
                Aceder ao conteúdo
              </Btn>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
