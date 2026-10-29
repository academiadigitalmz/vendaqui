import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { CheckoutSettings, PaymentMethod, ProductDetail, ProductInput, ProductStatus, ProductType, PublicCheckout } from "@/api/types";
import { Icon, PayLogo, type IconName } from "@/lib/icons";
import { int, mt, pct, short } from "@/lib/format";
import { METHODS, METHOD_ORDER } from "@/lib/methods";
import { useApp } from "@/lib/app-state";
import { Alert, Btn, Card, Cover, Field, IconBtn, Input, Kpi, PageHead, Select, Status, Switch, Tabs, Textarea, Tile } from "@/components/ui";
import { Data } from "@/components/Data";
import { CheckoutView } from "@/pages/public/Checkout";

export const TYPE_META: Record<ProductType, [string, IconName, string]> = {
  course: ["Curso online", "cap", "Aulas em vídeo na área de membros"],
  ebook: ["Ebook ou ficheiro", "book", "PDF, planilhas, templates, áudio"],
  mentoring: ["Mentoria ou serviço", "users", "Sessões ao vivo, consultoria"],
  subscription: ["Assinatura", "repeat", "Clube ou comunidade com mensalidade"],
  event: ["Evento ou bilhete", "ticket", "Workshop presencial ou online"],
};
const feeOf = (v: number) => +(v * 0.049 + 10).toFixed(2);

export default function Products() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");
  const [term, setTerm] = useState("");
  const q = useQuery({ queryKey: ["seller", "products"], queryFn: api.seller.products });
  return (<>
    <PageHead title="Produtos" desc="Cursos, ebooks, mentorias e assinaturas à venda." actions={<Btn v="primary" icon="plus" to="/produtor/produtos/novo">Novo produto</Btn>} />
    <Data q={q}>{(ps) => {
      const count = (s: ProductStatus) => ps.filter((p) => p.status === s).length;
      const rows = ps.filter((p) => (filter === "all" || p.status === filter) && p.name.toLowerCase().includes(term.toLowerCase()));
      return (<>
        <div className="ad-filterbar">
          <Input icon="search" s="sm" wrapClass="ad-search" placeholder="Procurar produto" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Procurar produto" />
          <Tabs kind="pill" value={filter} onChange={setFilter} items={[["all", "Todos", ps.length], ["active", "Ativos", count("active")], ["in_review", "Em análise", count("in_review")], ["draft", "Rascunhos", count("draft")]]} />
        </div>
        <div className="pgrid">
          {rows.map((p) => (
            <button key={p.id} className="pcard" onClick={() => nav(`/produtor/produtos/${p.id}`)}>
              <div className={`pcard-head cv-${p.cover}`}><span className="pcard-type"><Icon name={TYPE_META[p.type][1]} size={14} />{TYPE_META[p.type][0]}</span><h4>{p.name}</h4></div>
              <div className="pcard-body">
                <div className="row-between"><b style={{ fontSize: 17 }}>{mt(p.price, 0)}{p.recurring ? <small className="faint" style={{ fontWeight: 500, fontSize: 13 }}> /mês</small> : null}</b><Status s={p.status} /></div>
                <div className="pcard-stats"><div><small>Vendas</small><b>{int(p.sales)}</b></div><div><small>Receita</small><b>{short(p.revenue)}</b></div><div><small>Conversão</small><b>{p.conversion ? pct(p.conversion) : "—"}</b></div></div>
              </div>
            </button>
          ))}
          <button className="pcard" onClick={() => nav("/produtor/produtos/novo")} style={{ borderStyle: "dashed", alignItems: "center", justifyContent: "center", minHeight: 260, gap: 8, color: "var(--text-secondary)" }}>
            <Tile icon="plus" s="lg" /><b style={{ color: "var(--text)" }}>Criar produto</b><span style={{ fontSize: 13 }}>Curso, ebook, mentoria ou assinatura</span>
          </button>
        </div>
      </>);
    }}</Data>
  </>);
}

const WSTEPS = ["Tipo", "Detalhes", "Preço", "Entrega", "Rever"];
export function NewProduct() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast } = useApp();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<ProductInput>({ type: "ebook", name: "Templates de Gestão Financeira", description: "12 planilhas prontas para controlar receitas, despesas, stock e fluxo de caixa de pequenos negócios. Em meticais, com IVA a 16% já configurado.", category: "Finanças e negócios", price: 990, guaranteeDays: 7, delivery: "file", welcomeMessage: "Olá {nome}! Obrigada pela compra. O seu acesso já está disponível: {link}" });
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP({ ...p, [k]: v });
  const create = useMutation({
    mutationFn: () => api.seller.createProduct(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller", "products"] }); toast("Produto enviado para análise", "Recebe um email quando for aprovado."); nav("/produtor/produtos"); },
    onError: (e) => toast("Não foi possível criar o produto", e instanceof Error ? e.message : "", "danger", "alert"),
  });
  const titles = ["Que tipo de produto vai vender?", "Detalhes do produto", "Preço e garantia", "Como o cliente recebe o produto?", "Rever e enviar para análise"];
  return (<>
    <PageHead title="Novo produto" desc={`Passo ${step + 1} de 5 · ${WSTEPS[step]}`} actions={<Btn v="ghost" to="/produtor/produtos">Cancelar</Btn>} />
    <div className="stepper" style={{ maxWidth: 640 }}>{WSTEPS.map((s, i) => <i key={s} className={i <= step ? "on" : ""} />)}</div>
    <Card title={titles[step]} foot={<div className="row-between">{step > 0 ? <Btn icon="arrowl" onClick={() => setStep(step - 1)}>Voltar</Btn> : <span />}{step < 4 ? <Btn v="primary" iconRight="arrow" onClick={() => setStep(step + 1)} disabled={step === 1 && !p.name.trim()}>Continuar</Btn> : <Btn v="primary" icon="send" loading={create.isPending} onClick={() => create.mutate()}>Enviar para análise</Btn>}</div>}>
      <div className="stack-sm" style={{ gap: 18 }}>
        {step === 0 ? <div className="choice-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))" }}>{(Object.keys(TYPE_META) as ProductType[]).map((k) => (
          <button key={k} type="button" className={`choice ${p.type === k ? "on" : ""}`} onClick={() => set("type", k)}><Tile icon={TYPE_META[k][1]} tone={p.type === k ? "primary" : "neutral"} /><b>{TYPE_META[k][0]}</b><small>{TYPE_META[k][2]}</small></button>
        ))}</div> : null}
        {step === 1 ? (<>
          <div className="g2">
            <Field label="Nome do produto" req htmlFor="wz-name" help="Até 60 caracteres. Aparece no checkout e no recibo."><Input id="wz-name" s="lg" maxLength={60} value={p.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Categoria" htmlFor="wz-cat"><Select id="wz-cat" s="lg" value={p.category} onChange={(e) => set("category", e.target.value)} options={["Finanças e negócios", "Tecnologia e programação", "Marketing digital", "Educação e concursos", "Saúde e bem-estar", "Agricultura"]} /></Field>
          </div>
          <Field label="Descrição" htmlFor="wz-desc"><Textarea id="wz-desc" rows={4} value={p.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="ad-dropwrap"><span className="ad-label">Imagem de capa</span><label className="ad-dropzone"><Tile icon="image" /><span className="ad-dropzone-label">Arraste a imagem ou clique para escolher</span><span className="ad-dropzone-hint">PNG ou JPG, 1200 × 630 px, até 2 MB</span><input type="file" accept="image/*" onChange={() => toast("Capa carregada")} /></label></div>
        </>) : null}
        {step === 2 ? (<>
          <div className="g2">
            <Field label="Preço" req htmlFor="wz-price" help={`Recebe ${mt(p.price - feeOf(p.price))} por venda depois da taxa.`}><Input id="wz-price" s="lg" suffix="MT" inputMode="decimal" value={String(p.price)} onChange={(e) => set("price", Number(e.target.value.replace(",", ".")) || 0)} /></Field>
            <Field label="Tipo de cobrança" htmlFor="wz-rec"><Select id="wz-rec" s="lg" value={p.recurring ?? "once"} onChange={(e) => set("recurring", e.target.value === "once" ? undefined : (e.target.value as "monthly" | "yearly"))} options={[["once", "Pagamento único"], ["monthly", "Mensal"], ["yearly", "Anual"]]} /></Field>
          </div>
          <div className="stack-xs"><span className="ad-label">Garantia</span>
            <div className="ad-tabs ad-tabs-segmented" style={{ alignSelf: "flex-start" }}>{([7, 15, 30] as const).map((d) => <button key={d} type="button" className={`ad-tab ${p.guaranteeDays === d ? "is-active" : ""}`} onClick={() => set("guaranteeDays", d)}>{d} dias</button>)}</div>
            <span className="ad-helper">Dentro deste prazo o comprador pede o reembolso sem justificação.</span></div>
          <div className="g2">
            <Field label="Preço em dólares (opcional)" htmlFor="wz-usd" help="Para compradores com cartão internacional."><Input id="wz-usd" s="lg" suffix="USD" placeholder="15,00" onChange={(e) => set("priceUsd", Number(e.target.value.replace(",", ".")) || undefined)} /></Field>
            <Field label="Limite de vendas" htmlFor="wz-lim"><Input id="wz-lim" s="lg" placeholder="Sem limite" /></Field>
          </div>
        </>) : null}
        {step === 3 ? (<>
          <div className="choice-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>{([["members_area", "Área de membros VendAqui", "O comprador entra com o email da compra", "cap"], ["file", "Ficheiro para descarregar", "Enviamos o link por email e SMS", "download"], ["external_link", "Link externo", "Grupo de WhatsApp, Telegram, Zoom", "ext"]] as const).map(([k, t, d, i]) => (
            <button key={k} type="button" className={`choice ${p.delivery === k ? "on" : ""}`} onClick={() => set("delivery", k)}><Icon name={i} size={20} /><b>{t}</b><small>{d}</small></button>
          ))}</div>
          {p.delivery === "file" ? (<><label className="ad-dropzone"><Tile icon="upload" /><span className="ad-dropzone-label">Carregar ficheiros do produto</span><span className="ad-dropzone-hint">Até 500 MB por ficheiro</span><input type="file" multiple /></label>
            <ul className="ad-filelist"><li><Icon name="file" size={16} /><span className="ad-filelist-name">fluxo-de-caixa-2026.xlsx</span><span className="ad-filelist-size">184 KB</span></li><li><Icon name="file" size={16} /><span className="ad-filelist-name">controlo-de-stock.xlsx</span><span className="ad-filelist-size">212 KB</span></li></ul></>)
            : p.delivery === "external_link" ? <Field label="Link de acesso" htmlFor="wz-link" help="Só é mostrado depois do pagamento aprovado."><Input id="wz-link" icon="link" placeholder="https://chat.whatsapp.com/…" onChange={(e) => set("deliveryUrl", e.target.value)} /></Field>
            : <Alert icon="cap" title="Depois de publicar, adicione módulos e aulas em Área de membros" text="Pode libertar aulas por datas (conteúdo gotejado) e emitir certificado no fim." />}
          <Field label="Mensagem de boas-vindas (email e SMS)" htmlFor="wz-msg"><Textarea id="wz-msg" value={p.welcomeMessage} onChange={(e) => set("welcomeMessage", e.target.value)} /></Field>
        </>) : null}
        {step === 4 ? (<>
          <div className="offer-row"><Cover cover="red" icon={TYPE_META[p.type][1]} lg /><div className="grow"><b style={{ fontSize: 16 }}>{p.name}</b><span className="faint" style={{ fontSize: 13 }}>{TYPE_META[p.type][0]} · {p.recurring ? (p.recurring === "monthly" ? "mensal" : "anual") : "pagamento único"} · garantia {p.guaranteeDays} dias</span></div><b style={{ fontSize: 20 }}>{mt(p.price)}</b></div>
          <dl className="dl"><dt>Recebe por venda</dt><dd>{mt(p.price - feeOf(p.price))}</dd><dt>Entrega</dt><dd>{{ members_area: "Área de membros", file: "Ficheiro para descarregar", external_link: "Link externo" }[p.delivery]}</dd><dt>Métodos aceites</dt><dd>Apple Pay, Google Pay, M-Pesa, e-Mola, Cartão</dd></dl>
          <Alert tone="warning" title="A equipa revê o produto antes de ficar visível" text="Normalmente em menos de 2 horas. Recebe um email quando for aprovado. Promessas de ganhos garantidos não são aceites." />
        </>) : null}
      </div>
    </Card>
  </>);
}

function CheckoutEditor({ product }: { product: ProductDetail }) {
  const qc = useQueryClient();
  const { toast } = useApp();
  const [s, setS] = useState<CheckoutSettings>(product.checkout);
  const [mobile, setMobile] = useState(false);
  useEffect(() => setS(product.checkout), [product.checkout]);
  const save = useMutation({ mutationFn: () => api.seller.saveCheckout(product.id, s), onSuccess: () => { qc.invalidateQueries({ queryKey: ["checkout"] }); qc.invalidateQueries({ queryKey: ["seller", "product", product.id] }); toast("Checkout publicado"); } });
  const preview: PublicCheckout = useMemo(() => ({ slug: product.slug, product: { id: product.id, name: product.name, subtitle: "Curso online · 20 aulas · acesso por 1 ano", price: product.price, cover: product.cover, type: product.type }, seller: { name: "Excel com a Ana", nuit: "400 128 765" }, guaranteeDays: product.guaranteeDays, settings: s }), [product, s]);
  const toggleMethod = (m: PaymentMethod) => {
    const on = !s.methods[m];
    if (!on && Object.values(s.methods).filter(Boolean).length === 1) return toast("Mantenha pelo menos um método ativo", "", "warning", "alert");
    setS({ ...s, methods: { ...s.methods, [m]: on } });
  };
  const row = (label: string, sub: string, on: boolean, change: (v: boolean) => void) => <div className="setting"><div><b>{label}</b><small>{sub}</small></div><Switch checked={on} onChange={change} label={label} /></div>;
  return (
    <div className="g-main-r">
      <div className="stack-sm" style={{ gap: 16 }}>
        <Card title="Aparência" icon="image">
          <div className="stack-xs"><span className="ad-label">Cor principal</span><div className="swatches">{(["orange", "blue", "green", "purple", "red", "ink"] as const).map((c) => <button key={c} className={`swatch sw-${c} ${s.accent === c ? "on" : ""}`} aria-label={`Cor ${c}`} onClick={() => setS({ ...s, accent: c })} />)}</div></div>
          <Field label="Texto do botão" htmlFor="co-cta"><Input id="co-cta" value={s.ctaLabel} onChange={(e) => setS({ ...s, ctaLabel: e.target.value || "Comprar agora" })} /></Field>
        </Card>
        <Card title="Elementos de conversão" icon="zap">
          {row("Cronómetro de oferta", `Contagem de ${s.timer.minutes} minutos no topo`, s.timer.enabled, (v) => setS({ ...s, timer: { ...s.timer, enabled: v } }))}
          {row("Order bump", `${s.orderBump.title} por ${mt(s.orderBump.price, 0)}`, s.orderBump.enabled, (v) => setS({ ...s, orderBump: { ...s.orderBump, enabled: v } }))}
          {row("Testemunho", "Mostra uma avaliação de aluno", s.testimonial.enabled, (v) => setS({ ...s, testimonial: { ...s.testimonial, enabled: v } }))}
          {row("Pedir NUIT", "Para compradores que precisam de fatura", s.askNuit, (v) => setS({ ...s, askNuit: v }))}
        </Card>
        <Card title="Métodos de pagamento" icon="wallet">
          {METHOD_ORDER.map((m) => <div key={m} className="setting"><div style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><PayLogo method={m} /><small>{METHODS[m].caption}</small></div><Switch checked={s.methods[m]} onChange={() => toggleMethod(m)} label={METHODS[m].label} /></div>)}
        </Card>
      </div>
      <div className="stack-sm" style={{ gap: 12 }}>
        <div className="row-between"><span className="section-title">Pré-visualização</span>
          <div className="ad-tabs ad-tabs-segmented">{([[false, "Computador", "monitor"], [true, "Telemóvel", "phone"]] as const).map(([k, l, i]) => <button key={l} className={`ad-tab ${mobile === k ? "is-active" : ""}`} onClick={() => setMobile(k)}><Icon name={i} size={15} />{l}</button>)}</div></div>
        <div className={`preview-frame ${mobile ? "is-mobile" : ""}`} aria-hidden="true"><CheckoutView data={preview} preview /></div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}><Btn icon="ext" to={`/checkout/${product.slug}`}>Abrir checkout real</Btn><Btn v="primary" loading={save.isPending} onClick={() => save.mutate()}>Publicar alterações</Btn></div>
      </div>
    </div>
  );
}

type PTab = "geral" | "ofertas" | "checkout" | "upsell" | "afiliacao";
export function ProductPage() {
  const { id = "p1" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as PTab) || "geral";
  const setTab = (t: PTab) => setParams(t === "geral" ? {} : { tab: t }, { replace: true });
  const { toast } = useApp();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["seller", "product", id], queryFn: () => api.seller.product(id) });
  const [commission, setCommission] = useState(40);
  const save = useMutation({ mutationFn: (b: Partial<ProductDetail>) => api.seller.updateProduct(id, b), onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller"] }); toast("Alterações guardadas"); } });
  const copy = (t: string) => { navigator.clipboard?.writeText(t).catch(() => {}); toast("Link copiado", t, "success", "copy"); };
  return (
    <Data q={q}>{(p) => {
      const link = p.checkoutUrl.replace("https://", "");
      return (<>
        <Btn v="ghost" s="sm" icon="arrowl" to="/produtor/produtos" className="self-start">Produtos</Btn>
        <div className="row-between">
          <div className="prod-head"><Cover cover={p.cover} icon={TYPE_META[p.type][1]} lg /><div className="stack-xs"><h1>{p.name}</h1><div className="row" style={{ gap: 8 }}><Status s={p.status} /><span className="faint" style={{ fontSize: 13 }}>{TYPE_META[p.type][0]} · {mt(p.price)}</span></div></div></div>
          <div className="row" style={{ gap: 8 }}><Btn icon="eye" to={`/checkout/${p.slug}`}>Ver checkout</Btn><Btn v="primary" icon="copy" onClick={() => copy(p.checkoutUrl)}>Copiar link</Btn></div>
        </div>
        <Tabs value={tab} onChange={setTab} items={[["geral", "Visão geral"], ["ofertas", "Ofertas", p.offers.length], ["checkout", "Checkout"], ["upsell", "Order bump e upsell"], ["afiliacao", "Afiliação"]]} />
        {tab === "geral" ? (<>
          <div className="g4"><Kpi label="Receita" value={mt(p.revenue, 0)} icon="wallet" /><Kpi label="Vendas" value={int(p.sales)} icon="receipt" tone="success" /><Kpi label="Conversão" value={p.conversion ? pct(p.conversion) : "—"} icon="target" tone="info" /><Kpi label={p.recurring ? "Assinantes" : "Alunos"} value={int(p.students)} icon="users" tone="purple" /></div>
          <div className="g-main">
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); save.mutate({ name: String(f.get("name")), description: String(f.get("description")), price: Number(String(f.get("price")).replace(/\s| /g, "").replace(",", ".")) }); }}>
              <Card title="Informação" foot={<div className="row" style={{ justifyContent: "flex-end" }}><Btn v="primary" type="submit" loading={save.isPending}>Guardar alterações</Btn></div>}>
                <div className="stack-sm" style={{ gap: 16 }}>
                  <Field label="Nome" htmlFor="pd-name"><Input id="pd-name" name="name" defaultValue={p.name} /></Field>
                  <Field label="Descrição" htmlFor="pd-desc"><Textarea id="pd-desc" name="description" rows={4} defaultValue={p.description} /></Field>
                  <div className="g2"><Field label="Preço" htmlFor="pd-price"><Input id="pd-price" name="price" defaultValue={String(p.price)} suffix="MT" /></Field><Field label="Garantia" htmlFor="pd-g"><Select id="pd-g" defaultValue={String(p.guaranteeDays)} options={[["7", "7 dias"], ["15", "15 dias"], ["30", "30 dias"]]} /></Field></div>
                  <Field label="Página de vendas" htmlFor="pd-sales" help="Para onde envia o tráfego. O botão de compra aponta para o checkout."><Input id="pd-sales" icon="globe" defaultValue={p.salesPageUrl} /></Field>
                </div>
              </Card>
            </form>
            <Card title="Links de venda" icon="link">
              <div className="stack-sm">
                <div className="linkbox"><span>{link}</span><Btn s="sm" icon="copy" onClick={() => copy(p.checkoutUrl)}>Copiar</Btn></div>
                <div className="row" style={{ gap: 8 }}><Btn s="sm" icon="ext" to={`/checkout/${p.slug}`}>Abrir checkout</Btn><Btn s="sm" icon="grid" onClick={() => toast("QR code descarregado")}>QR code</Btn></div>
                <hr className="hr" />
                <dl className="dl"><dt>Estado</dt><dd><Status s={p.status} /></dd><dt>Tipo</dt><dd>{TYPE_META[p.type][0]}</dd><dt>Criado</dt><dd>{new Date(p.createdAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}</dd><dt>ID</dt><dd className="mono">{p.id.toUpperCase()}</dd></dl>
              </div>
            </Card>
          </div>
        </>) : null}
        {tab === "ofertas" ? (
          <Card title="Ofertas" icon="tag" aside={<Btn s="sm" v="primary" icon="plus" onClick={() => toast("Oferta criada")}>Nova oferta</Btn>}>
            <p className="muted">Cada oferta tem o seu preço e o seu link. Use-as para campanhas, combos ou preços de lançamento.</p>
            {p.offers.map((o) => { const u = p.checkoutUrl + (o.slug ? "/" + o.slug : ""); return (
              <div key={o.id} className="offer-row"><div className="grow" style={{ minWidth: 180 }}><b>{o.name}</b><span className="faint" style={{ fontSize: 13 }}>{mt(o.price)} · {o.sales} vendas</span></div><div className="linkbox"><span>{u.replace("https://", "")}</span><IconBtn s="sm" icon="copy" label="Copiar link" onClick={() => copy(u)} /></div><Switch defaultChecked={o.active} label="Ativar oferta" /></div>
            ); })}
          </Card>
        ) : null}
        {tab === "checkout" ? <CheckoutEditor product={p} /> : null}
        {tab === "upsell" ? (
          <div className="g2">
            <Card title="Order bump" icon="gift" aside={<Switch defaultChecked={p.checkout.orderBump.enabled} label="Ativar order bump" />}>
              <p className="muted">Um produto extra que o comprador adiciona com um visto, antes de pagar.</p>
              <div className="bump-demo"><Icon name="gift" size={18} /><span><b>{p.checkout.orderBump.title}</b> por {mt(p.checkout.orderBump.price, 0)} (de {mt(p.checkout.orderBump.originalPrice, 0)})</span></div>
              <dl className="dl"><dt>Aceitação</dt><dd>{pct(p.bumpStats.acceptRate)}</dd><dt>Receita extra (30 dias)</dt><dd>{mt(p.bumpStats.extraRevenue30d)}</dd></dl>
            </Card>
            <Card title="Upsell depois da compra" icon="trendup" aside={<Switch defaultChecked={p.upsell.enabled} label="Ativar upsell" />}>
              <p className="muted">Aparece na página de obrigado. O cliente aceita com 1 clique e confirma o novo pagamento.</p>
              <div className="offer-row"><Cover cover="blue" icon="cap" /><div className="grow"><b>{p.upsell.title}</b><span className="faint" style={{ fontSize: 13 }}>{mt(p.upsell.price)} · aceitação {pct(p.upsell.acceptRate)}</span></div></div>
              <Field label="Se recusar, mostrar" htmlFor="ups-down"><Select id="ups-down" options={["Downsell: Ebook Power BI por 490 MT", "Nada"]} /></Field>
            </Card>
          </div>
        ) : null}
        {tab === "afiliacao" ? (
          <Card title="Programa de afiliados deste produto" icon="share" foot={<div className="row" style={{ justifyContent: "flex-end" }}><Btn v="primary" onClick={() => save.mutate({ affiliate: { ...p.affiliate, commissionPercent: commission } })}>Guardar</Btn></div>}>
            <div className="setting"><div><b>Aceitar afiliados</b><small>O produto aparece no mercado de afiliação</small></div><Switch defaultChecked={p.affiliate.enabled} label="Aceitar afiliados" /></div>
            <div className="setting"><div><b>Aprovação automática</b><small>Sem aprovação, analisa cada pedido manualmente</small></div><Switch defaultChecked={p.affiliate.autoApprove} label="Aprovação automática" /></div>
            <div className="range" style={{ padding: "12px 0" }}>
              <div className="range-top"><label className="ad-label" htmlFor="aff-c">Comissão do afiliado</label><b>{commission}%</b></div>
              <input type="range" id="aff-c" min={5} max={80} value={commission} onChange={(e) => setCommission(+e.target.value)} />
              <span className="ad-helper">Afiliado recebe {mt(p.price * commission / 100)} por venda; fica com {mt(p.price * (1 - commission / 100) - feeOf(p.price))}.</span>
            </div>
            <div className="g2"><Field label="Duração do cookie" htmlFor="aff-ck"><Select id="aff-ck" defaultValue="60 dias" options={["30 dias", "60 dias", "90 dias", "Vitalício"]} /></Field><Field label="Atribuição" htmlFor="aff-at"><Select id="aff-at" options={["Último clique", "Primeiro clique"]} /></Field></div>
            <Field label="Materiais para afiliados" htmlFor="aff-mat"><Input id="aff-mat" icon="link" defaultValue={p.affiliate.materialsUrl} /></Field>
          </Card>
        ) : null}
      </>);
    }}</Data>
  );
}
