import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { Dispute, KycDecision, SellerRow } from "@/api/types";
import { Icon, PayLogo, type IconName } from "@/lib/icons";
import { date, initials, int, maskPhone, mt, num, pct, short } from "@/lib/format";
import { METHODS } from "@/lib/methods";
import { useApp } from "@/lib/app-state";
import { Alert, Avatar, Badge, Btn, Card, CellUser, Cover, Field, IconBtn, Input, Kpi, Meter, Method, PageHead, Select, Status, Switch, Table, Tabs, Textarea, Tile, type Tone } from "@/components/ui";
import { AreaChart } from "@/components/chart";
import { Data } from "@/components/Data";
import { Drawer, Modal } from "@/components/overlay";
import { SaleDrawer } from "@/pages/seller/Dashboard";
import { TYPE_META } from "@/pages/seller/Products";

const riskColor = (r: number) => (r >= 70 ? "var(--danger)" : r >= 40 ? "var(--warning)" : "var(--success)");
const Risk = ({ r }: { r: number }) => <span className="risk"><Meter value={r} color={riskColor(r)} />{r}</span>;
const SELLER_STATUS: Record<SellerRow["status"], string> = { verified: "verified", in_review: "in_review", blocked: "blocked" };

export function Overview() {
  const q = useQuery({ queryKey: ["admin", "overview"], queryFn: api.admin.overview });
  const [seller, setSeller] = useState<SellerRow | null>(null);
  const QUEUE: Record<string, [IconName, Tone, string, string]> = { kyc: ["idcard", "warning", "Verificações KYC", "/admin/kyc"], payouts: ["cash", "info", "Saques para aprovar", "/admin/saques"], moderation: ["package", "purple", "Produtos em análise", "/admin/produtos"], disputes: ["scale", "danger", "Disputas abertas", "/admin/disputas"] };
  return (
    <Data q={q} rows={4}>{(d) => (<>
      <div className="live"><div className="live-head"><span className="pulse" /><b>Agora</b><small>atualizado há 4 s</small></div><div className="live-grid">
        <div><small>Volume hoje (GMV)</small><strong>{mt(d.live.gmvToday, 0)}</strong><span>+{num(d.live.gmvDelta, 1)}% vs. semana passada</span></div>
        <div><small>Transações hoje</small><strong>{int(d.live.txToday)}</strong><span>{d.live.txLastHour} na última hora</span></div>
        <div><small>Taxa de aprovação</small><strong>{pct(d.live.approval)}</strong><span>M-Pesa 98,1% · Cartão 86,3%</span></div>
        <div><small>Receita da plataforma</small><strong>{mt(d.live.platformRevenueToday, 0)}</strong><span>Taxas líquidas de custos</span></div>
        <div><small>Produtores a vender</small><strong>{int(d.live.sellersSelling)}</strong><span>de {int(d.live.sellersActive)} ativos</span></div>
      </div></div>
      <div className="g4">
        <Kpi label="GMV · 30 dias" value={`${short(d.kpis.gmv30d)} MT`} icon="trendup" delta={d.kpis.gmvDelta} />
        <Kpi label="Receita líquida · 30 dias" value={mt(d.kpis.revenue30d, 0)} icon="wallet" tone="success" delta={d.kpis.revenueDelta} />
        <Kpi label="Chargebacks" value={pct(d.kpis.chargebackRate, 2)} icon="scale" tone="danger" hint="Limite das bandeiras: 0,90%" />
        <Kpi label="Saldo a pagar a produtores" value={`${short(d.kpis.owedToSellers)} MT`} icon="cash" tone="info" hint="Inclui reservas de 5%" />
      </div>
      <div className="g-main">
        <Card title="Volume e receita" icon="activity" aside={<div className="legend"><span><i />GMV</span><span><i className="is-2" />Receita × 10</span></div>}>
          <AreaChart data={d.series.map((s) => s.gmv)} data2={d.series.map((s) => s.revenue * 10)} labels={d.series.map((s) => s.label)} name1="GMV" name2="Receita × 10" aria="Volume diário e receita da plataforma" h={250} />
        </Card>
        <Card title="Fila de trabalho" icon="checkc" tone="neutral"><div className="stack-sm">{d.queue.map((x) => { const [i, t, l, to] = QUEUE[x.key]; return (
          <Link key={x.key} className="queue-item" to={to} style={{ textDecoration: "none" }}><Tile icon={i} tone={t} /><span className="stack-xs" style={{ gap: 0 }}><b>{l}</b><small className="faint">{x.note}</small></span><span className="n">{x.count}</span></Link>
        ); })}</div></Card>
      </div>
      <div className="g2">
        <Card title="Saúde dos métodos de pagamento" icon="route" tone="info" aside={<Link className="ad-link" to="/admin/pagamentos">Configurar</Link>}>
          {d.gateways.map((g) => <div key={g.id} className="gw"><span className={`status-dot ${g.status === "operational" ? "" : "warn"}`} /><div className="grow stack-xs" style={{ gap: 0 }}><b style={{ fontSize: 14 }}>{g.name}</b><small className="faint">{g.note ?? "Operacional"}</small></div><div className="gw-stat"><b>{pct(g.approval)}</b>aprovação</div><div className="gw-stat" style={{ minWidth: 64 }}><b>{g.latencyMs >= 1000 ? `${num(g.latencyMs / 1000, 1)} s` : `${g.latencyMs} ms`}</b>latência</div></div>)}
        </Card>
        <Card title="Maiores produtores · 30 dias" icon="store" flush aside={<Link className="ad-link" to="/admin/produtores">Ver todos</Link>}>
          <Table dense rows={d.topSellers} rowKey={(r) => r.id} onRow={setSeller} cols={[
            { label: "Produtor", render: (r) => <CellUser name={r.business} sub={r.owner} /> },
            { label: "GMV", num: true, render: (r) => mt(r.gmv30d, 0) },
            { label: "Chargeback", num: true, render: (r) => <span style={{ color: r.chargebackRate > 1 ? "var(--danger)" : "inherit" }}>{pct(r.chargebackRate)}</span> },
          ]} />
        </Card>
      </div>
      {seller ? <SellerDrawer s={seller} onClose={() => setSeller(null)} /> : null}
    </>)}</Data>
  );
}

function SellerDrawer({ s, onClose }: { s: SellerRow; onClose: () => void }) {
  const { toast } = useApp();
  const qc = useQueryClient();
  const [fee, setFee] = useState(num(s.feePercent, 1));
  const [fixed, setFixed] = useState(String(s.feeFixed));
  const upd = useMutation({ mutationFn: (b: Partial<SellerRow>) => api.admin.updateSeller(s.id, b), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin"] }); toast("Produtor atualizado", r.business); onClose(); } });
  return (
    <Drawer over={s.id} title={s.business} sub={<div className="row" style={{ gap: 8 }}><Status s={SELLER_STATUS[s.status]} /><Badge v="outline">Plano {s.plan}</Badge></div>} onClose={onClose}
      foot={<><Btn icon="eye" to="/produtor">Ver como produtor</Btn>{s.status === "blocked" ? <Btn v="primary" onClick={() => upd.mutate({ status: "verified" })}>Desbloquear</Btn> : <Btn v="danger" icon="ban" onClick={() => upd.mutate({ status: "blocked" })}>Suspender vendas</Btn>}<Btn v="primary" loading={upd.isPending} onClick={() => upd.mutate({ feePercent: Number(fee.replace(",", ".")), feeFixed: Number(fixed) })}>Guardar</Btn></>}>
      <div className="g2" style={{ gap: 10 }}>{[["GMV 30 dias", mt(s.gmv30d, 0)], ["Saldo retido", mt(s.gmv30d * 0.11, 0)], ["Chargeback", pct(s.chargebackRate)], ["Reembolsos", pct(s.chargebackRate * 1.6 + 0.4)]].map(([a, b]) => <div key={a} className="kpi" style={{ padding: "12px 14px", boxShadow: "none" }}><span className="kpi-label">{a}</span><b style={{ fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{b}</b></div>)}</div>
      <section className="stack-sm"><h3 className="section-title">Titular</h3><dl className="dl"><dt>Nome</dt><dd>{s.owner}</dd><dt>NUIT</dt><dd className="mono">{s.nuit}</dd><dt>Categoria</dt><dd>{s.category}</dd><dt>Cliente desde</dt><dd>{s.since}</dd></dl></section>
      <section className="stack-sm"><h3 className="section-title">Taxa aplicada</h3><div className="g2"><Field label="Percentagem" htmlFor="sl-p"><Input id="sl-p" value={fee} onChange={(e) => setFee(e.target.value)} suffix="%" /></Field><Field label="Fixo por venda" htmlFor="sl-f"><Input id="sl-f" value={fixed} onChange={(e) => setFixed(e.target.value)} suffix="MT" /></Field></div>
        <Field label="Prazo de libertação para cartão" htmlFor="sl-d"><Select id="sl-d" options={["D+14 (padrão)", "D+7", "D+30"]} /></Field></section>
      {s.chargebackRate > 1 ? <Alert tone="danger" icon="alert" title="Chargeback acima do limite" text={`${pct(s.chargebackRate)} nos últimos 30 dias. Recomendado aumentar a reserva para 20% e rever os produtos.`} /> : null}
    </Drawer>
  );
}

export function Sellers() {
  const { toast } = useApp();
  const [term, setTerm] = useState("");
  const [sel, setSel] = useState<SellerRow | null>(null);
  const q = useQuery({ queryKey: ["admin", "sellers", term], queryFn: () => api.admin.sellers(term), placeholderData: (p) => p });
  return (<>
    <PageHead title="Produtores" desc="3 412 contas ativas · 611 venderam hoje." actions={<Btn icon="download" onClick={() => toast("Exportação enviada", "rita@vendaqui.co.mz", "info", "mail")}>Exportar</Btn>} />
    <div className="ad-filterbar"><Input icon="search" wrapClass="ad-search" placeholder="Nome, NUIT ou ID" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Procurar produtor" /><Select aria-label="Estado" options={["Todos os estados", "Verificado", "Em revisão", "Bloqueado"]} /><Select aria-label="Plano" options={["Todos os planos", "Padrão", "Escala", "Personalizado"]} /><span className="ad-filterbar-count">{q.data ? `${q.data.items.length} de ${int(q.data.total)}` : ""}</span></div>
    <Data q={q}>{(d) => <Card flush><Table rows={d.items} rowKey={(r) => r.id} onRow={setSel} total={d.total} per={12} cols={[
      { label: "Produtor", render: (r) => <CellUser name={r.business} sub={`${r.owner} · ${r.id}`} /> },
      { label: "Categoria", render: (r) => r.category },
      { label: "GMV 30 dias", num: true, render: (r) => mt(r.gmv30d, 0) },
      { label: "Compradores", num: true, render: (r) => int(r.buyers) },
      { label: "Chargeback", num: true, render: (r) => <span style={{ color: r.chargebackRate > 1 ? "var(--danger)" : "inherit", fontWeight: r.chargebackRate > 1 ? 600 : 400 }}>{pct(r.chargebackRate)}</span> },
      { label: "Plano", render: (r) => <Badge tone={r.plan === "Escala" ? "primary" : "neutral"} v="outline">{r.plan}</Badge> },
      { label: "Estado", render: (r) => <Status s={SELLER_STATUS[r.status]} /> },
    ]} /></Card>}</Data>
    {sel ? <SellerDrawer s={sel} onClose={() => setSel(null)} /> : null}
  </>);
}

export function Kyc() {
  const { toast } = useApp();
  const qc = useQueryClient();
  const [idx, setIdx] = useState(0);
  const q = useQuery({ queryKey: ["admin", "kyc"], queryFn: api.admin.kyc });
  const decide = useMutation({
    mutationFn: ({ id, d }: { id: string; d: KycDecision }) => api.admin.decideKyc(id, d),
    onSuccess: (_, v) => { const k = q.data?.find((x) => x.id === v.id); qc.invalidateQueries({ queryKey: ["admin"] }); setIdx(0); const m: Record<KycDecision, [string, string, "success" | "info" | "neutral", IconName]> = { approve: ["Conta aprovada", `${k?.business} já pode receber pagamentos`, "success", "checkc"], request_changes: ["Pedido de correção enviado", `Email e SMS para ${k?.name}`, "info", "send"], reject: ["Verificação rejeitada", `${k?.business} foi notificado`, "neutral", "x"] }; toast(...m[v.d]); },
  });
  return (
    <Data q={q}>{(list) => {
      if (!list.length) return (<><PageHead title="Verificação KYC" desc="Não há contas à espera de análise." /><Card><p className="muted">Tudo em dia. As novas contas aparecem aqui.</p></Card></>);
      const k = list[Math.min(idx, list.length - 1)];
      const ok = k.nameMatch === "yes";
      return (<>
        <PageHead title="Verificação KYC" desc={`${list.length} contas à espera de análise. Objetivo: responder em menos de 24 horas.`} />
        <div className="kyc-layout">
          <div className="kyc-list">{list.map((x, i) => (
            <button key={x.id} className={`queue-item ${x.id === k.id ? "on" : ""}`} onClick={() => setIdx(i)}><Avatar name={x.name} s="md" /><span className="stack-xs grow" style={{ gap: 0 }}><b>{x.name}</b><small className="faint">{x.business} · há {x.waitingHours} h</small></span><span className="risk" style={{ color: x.faceMatch > 85 ? "var(--success)" : x.faceMatch > 60 ? "var(--warning)" : "var(--danger)" }}>{x.faceMatch}</span></button>
          ))}</div>
          <Card title={`${k.name} · ${k.business}`} foot={<div className="row" style={{ justifyContent: "flex-end", gap: 8 }}><Btn v="ghost" onClick={() => decide.mutate({ id: k.id, d: "reject" })}>Rejeitar</Btn><Btn onClick={() => decide.mutate({ id: k.id, d: "request_changes" })}>Pedir correção</Btn><Btn v="primary" icon="check" loading={decide.isPending} onClick={() => decide.mutate({ id: k.id, d: "approve" })}>Aprovar</Btn></div>}>
            <div className="row" style={{ gap: 8 }}><Badge v="outline">{k.kind === "company" ? "Empresa" : "Pessoa singular"}</Badge><Badge tone="info">{k.category}</Badge><span className="faint" style={{ fontSize: 13 }}>Pedido há {k.waitingHours} h</span></div>
            <div className="docs">{k.documents.map((d, i) => (
              <div key={d} className="doc"><div className="doc-img">{i === 2 ? <span className="ad-avatar ad-avatar-xl">{initials(k.name)}</span> : <div className="idcard"><i /><span><em style={{ width: "80%" }} /><em /><em style={{ width: "60%" }} /><em style={{ width: "70%" }} /></span></div>}</div><div className="doc-cap"><span>{d}</span><IconBtn s="sm" icon="eye" label={`Ampliar ${d}`} onClick={() => toast(`${d} ampliado`, "", "info", "eye")} /></div></div>
            ))}</div>
            <div className="g2">
              <div className="stack-sm"><h4 className="section-title" style={{ fontSize: 14 }}>Verificações automáticas</h4><div className="checks">
                <div className={k.faceMatch > 60 ? "ok" : "bad"}><Icon name={k.faceMatch > 60 ? "checkc" : "xc"} size={18} /><span style={{ color: "var(--text)" }}>Rosto corresponde ao BI</span><b>{k.faceMatch}%</b></div>
                <div className="ok"><Icon name="checkc" size={18} /><span style={{ color: "var(--text)" }}>NUIT válido na AT</span><b>{k.nuitValid ? "Sim" : "Não"}</b></div>
                <div className={ok ? "ok" : "warn"}><Icon name={ok ? "checkc" : "alert"} size={18} /><span style={{ color: "var(--text)" }}>Nome igual no BI e na carteira</span><b>{ok ? "Sim" : k.nameMatch === "partial" ? "Parcial" : "Não"}</b></div>
                <div className={k.riskCategory === "high" ? "bad" : "ok"}><Icon name={k.riskCategory === "high" ? "alert" : "checkc"} size={18} /><span style={{ color: "var(--text)" }}>Categoria de risco</span><b>{k.riskCategory === "high" ? "Alta" : "Baixa"}</b></div>
              </div></div>
              <div className="stack-sm"><h4 className="section-title" style={{ fontSize: 14 }}>Dados declarados</h4><dl className="dl"><dt>BI</dt><dd className="mono">{k.declared.bi}</dd><dt>NUIT</dt><dd className="mono">{k.declared.nuit}</dd><dt>Morada</dt><dd>{k.declared.city}</dd><dt>Carteira</dt><dd>{k.declared.wallet}</dd></dl></div>
            </div>
            {k.riskCategory === "high" ? <Alert tone="danger" icon="shieldalert" title="Atenção à categoria Investimentos" text="Produtos sobre cripto e trading exigem aviso de risco e não podem prometer retornos. Verifique a página de vendas antes de aprovar." /> : null}
          </Card>
        </div>
      </>);
    }}</Data>
  );
}

export function Moderation() {
  const { toast } = useApp();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "moderation"], queryFn: api.admin.moderation });
  const decide = useMutation({ mutationFn: ({ id, ok }: { id: string; ok: boolean }) => api.admin.decideModeration(id, ok), onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["admin"] }); v.ok ? toast("Produto aprovado e publicado", "O produtor foi notificado") : toast("Produto recusado", "Motivo enviado ao produtor", "neutral", "x"); } });
  return (<>
    <PageHead title="Produtos em análise" desc="Revisão antes de os produtos ficarem à venda. SLA: 2 horas." />
    <Data q={q}>{(items) => <div className="stack-sm">{items.length ? items.map((m) => (
      <div key={m.id} className="offer-row" style={{ alignItems: "flex-start" }}><Cover cover={m.cover} icon={TYPE_META[m.type][1]} lg />
        <div className="grow stack-xs" style={{ minWidth: 220 }}><b style={{ fontSize: 15 }}>{m.productName}</b><span className="faint" style={{ fontSize: 13 }}>{m.seller} · {TYPE_META[m.type][0]} · {mt(m.price, 0)}</span>{m.flags.map((f) => <span key={f} className="flag"><Icon name="flag" size={14} />{f}</span>)}</div>
        <div className="row" style={{ gap: 8 }}><Btn s="sm" v="ghost" icon="ext" onClick={() => toast("Página de vendas aberta", "", "info", "ext")}>Ver página</Btn><Btn s="sm" onClick={() => decide.mutate({ id: m.id, ok: false })}>Recusar</Btn><Btn s="sm" v={m.flags.length ? "secondary" : "primary"} icon="check" onClick={() => decide.mutate({ id: m.id, ok: true })}>Aprovar</Btn></div></div>
    )) : <Card><p className="muted">Nenhum produto à espera de análise.</p></Card>}</div>}</Data>
  </>);
}

export function Transactions() {
  const { toast } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["admin", "transactions"], queryFn: api.admin.transactions });
  return (<>
    <PageHead title="Transações" desc="Todas as cobranças da plataforma, em tempo real." actions={<Btn icon="download" onClick={() => toast("Exportação em preparação", "", "info", "download")}>Exportar</Btn>} />
    <div className="ad-filterbar"><Input icon="search" wrapClass="ad-search" placeholder="ID, telemóvel, email ou últimos 4 dígitos" aria-label="Procurar transação" /><Select aria-label="Estado" options={["Todos os estados", "Aprovada", "Pendente", "Recusada", "Reembolsada", "Chargeback"]} /><Select aria-label="Método" options={["Todos os métodos", "Apple Pay", "Google Pay", "M-Pesa", "e-Mola", "Cartão"]} /><Select aria-label="Risco" options={["Qualquer risco", "Risco alto (≥ 70)", "Risco médio (40–69)"]} /><span className="ad-filterbar-count">{q.data ? `${int(q.data.total)} hoje` : ""}</span></div>
    <Data q={q}>{(d) => <Card flush><Table rows={d.items} rowKey={(r) => r.id} onRow={(r) => setOpen(r.id)} total={d.total} per={d.pageSize} cols={[
      { label: "Transação", render: (s) => <><span className="mono">{s.id}</span><br /><small className="faint">{date(s.createdAt)}</small></> },
      { label: "Produtor", render: (s) => s.seller },
      { label: "Comprador", render: (s) => <CellUser name={s.buyer.name} sub={maskPhone(s.buyer.phone)} avatar={false} /> },
      { label: "Método · rota", render: (s) => <><Method m={s.method} /><br /><small className="faint">{s.route}</small></> },
      { label: "Valor", num: true, render: (s) => mt(s.amount) },
      { label: "Taxa", num: true, render: (s) => mt(s.fee) },
      { label: "Risco", render: (s) => <Risk r={s.risk} /> },
      { label: "Estado", render: (s) => <Status s={s.status} /> },
    ]} /></Card>}</Data>
    {open ? <SaleDrawer id={open} onClose={() => setOpen(null)} /> : null}
  </>);
}

const RULE_ICON: Record<string, IconName> = { phone: "phone", card: "card", monitor: "monitor", store: "store", refund: "refund" };
export function Risk_() {
  const { toast } = useApp();
  const [list, setList] = useState<"phone" | "bin" | "email">("phone");
  const q = useQuery({ queryKey: ["admin", "risk"], queryFn: api.admin.risk });
  const toggle = useMutation({ mutationFn: ({ id, on }: { id: string; on: boolean }) => api.admin.toggleRule(id, on), onSuccess: (_, v) => toast(v.on ? "Regra ativada" : "Regra desativada", "", v.on ? "success" : "neutral", v.on ? "checkc" : "x") });
  return (<>
    <PageHead title="Antifraude" desc="Regras automáticas, listas de bloqueio e transações suspeitas." actions={<Btn v="primary" icon="plus" onClick={() => toast("Editor de regras aberto", "", "info", "sliders")}>Nova regra</Btn>} />
    <Data q={q}>{(d) => (<>
      <div className="g4">
        <Kpi label="Bloqueadas hoje" value={int(d.summary.blockedToday)} icon="ban" tone="danger" hint={`${mt(d.summary.blockedAmount, 0)} evitados`} />
        <Kpi label="Em revisão manual" value={int(d.summary.manualReview)} icon="eye" tone="warning" />
        <Kpi label="Falsos positivos · 30 dias" value={pct(d.summary.falsePositiveRate)} icon="target" tone="info" />
        <Kpi label="Chargebacks evitados" value={int(d.summary.chargebacksAvoided)} icon="shield" tone="success" hint="Estimativa · 30 dias" />
      </div>
      <div className="g-main">
        <Card title="Regras" icon="shieldalert" tone="danger">{d.rules.map((r) => (
          <div key={r.id} className="setting"><div style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}><Tile icon={RULE_ICON[r.icon] ?? "shield"} tone={r.enabled ? "danger" : "neutral"} s="sm" /><div className="stack-xs"><b>{r.description}</b><small>Ação: {r.action}</small></div></div><Switch defaultChecked={r.enabled} onChange={(v) => toggle.mutate({ id: r.id, on: v })} label={r.description} /></div>
        ))}</Card>
        <Card title="Listas de bloqueio" icon="ban">
          <Tabs kind="segmented" value={list} onChange={setList} items={[["phone", "Números", 214], ["bin", "Cartões (BIN)", 37], ["email", "Emails", 89]]} />
          <Table dense rows={d.blocklist.filter((b) => b.kind === list)} rowKey={(r) => r.value} cols={[{ label: "Valor", render: (r) => <span className="mono">{r.value}</span> }, { label: "Motivo", render: (r) => r.reason }]} />
          <Btn s="sm" icon="plus" onClick={() => toast("Adicionado à lista de bloqueio", "", "success", "ban")}>Adicionar à lista</Btn>
        </Card>
      </div>
      <Card title="Transações suspeitas" icon="alert" tone="warning" flush>
        <Table dense rows={d.flagged} rowKey={(r) => r.id} cols={[
          { label: "Transação", render: (s) => <span className="mono">{s.id}</span> }, { label: "Produtor", render: (s) => s.seller }, { label: "Método", render: (s) => <Method m={s.method} /> },
          { label: "Valor", num: true, render: (s) => mt(s.amount) }, { label: "Risco", render: (s) => <Risk r={s.risk} /> },
          { label: "", num: true, render: () => <div className="row" style={{ gap: 4, justifyContent: "flex-end", flexWrap: "nowrap" }}><Btn s="sm" v="ghost" onClick={() => toast("Transação libertada")}>Libertar</Btn><Btn s="sm" v="danger" onClick={() => toast("Transação bloqueada e reembolsada", "", "danger", "ban")}>Bloquear</Btn></div> },
        ]} />
      </Card>
    </>)}</Data>
  </>);
}

export function Payouts() {
  const { toast } = useApp();
  const qc = useQueryClient();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const q = useQuery({ queryKey: ["admin", "payouts"], queryFn: api.admin.payouts });
  const decide = useMutation({ mutationFn: (ok: boolean) => api.admin.decidePayouts([...sel], ok), onSuccess: (_, ok) => { const n = sel.size; setSel(new Set()); qc.invalidateQueries({ queryKey: ["admin"] }); ok ? toast(`${n} saques enviados para pagamento`, "Os produtores recebem SMS quando o dinheiro chegar", "success", "cash") : toast(`${n} saques rejeitados`, "Saldo devolvido aos produtores", "neutral", "x"); } });
  return (<>
    <PageHead title="Saques" desc="Saques até 100 000 MT são automáticos. Os restantes passam por aqui." />
    <Data q={q}>{(d) => {
      const pend = d.items.filter((p) => p.status === "pending");
      const total = d.items.filter((p) => sel.has(p.id)).reduce((a, p) => a + p.amount, 0);
      const toggle = (id: string) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
      return (<>
        <div className="g4">
          <Kpi label="Pagos hoje" value={`${short(d.summary.paidToday)} MT`} icon="checkc" tone="success" hint={`${d.summary.paidCount} saques · ${d.summary.autoShare}% automáticos`} />
          <Kpi label="À espera de aprovação" value={mt(d.summary.awaiting, 0)} icon="clock" tone="warning" hint={`${d.summary.awaitingCount} saques`} />
          <Kpi label="Tempo médio M-Pesa" value={`${d.summary.avgMpesaSeconds} s`} icon="zap" tone="info" />
          <Kpi label="Saldo em conta de liquidação" value={`${short(d.summary.settlement)} MT`} icon="bank" tone="purple" hint="BCI · Millennium bim · M-Pesa B2C" />
        </div>
        {sel.size ? <div className="bulkbar"><b>{sel.size} selecionados · {mt(total)}</b><span className="grow" /><Btn s="sm" onClick={() => decide.mutate(false)}>Rejeitar</Btn><Btn s="sm" v="primary" icon="check" loading={decide.isPending} onClick={() => decide.mutate(true)}>Aprovar e pagar</Btn></div> : null}
        <Card flush><Table rows={d.items} rowKey={(r) => r.id} cols={[
          { label: <input type="checkbox" aria-label="Selecionar todos" checked={sel.size === pend.length && pend.length > 0} onChange={() => setSel(sel.size === pend.length ? new Set() : new Set(pend.map((p) => p.id)))} />, render: (p) => (p.status === "pending" ? <input type="checkbox" aria-label={`Selecionar ${p.id}`} checked={sel.has(p.id)} onChange={() => toggle(p.id)} /> : null) },
          { label: "Pedido", render: (p) => <span className="mono">{p.id}</span> },
          { label: "Produtor", render: (p) => p.seller },
          { label: "Destino", render: (p) => <Method m={p.destination} /> },
          { label: "Valor", num: true, render: (p) => <b style={{ fontWeight: 600 }}>{mt(p.amount)}</b> },
          { label: "Motivo da revisão", render: (p) => <span className={p.reason === "Produtor bloqueado" || p.status === "failed" ? "flag" : "muted"} style={p.status === "failed" ? { color: "var(--danger)" } : undefined}>{p.reason}</span> },
          { label: "Estado", render: (p) => <Status s={p.status} /> },
        ]} /></Card>
      </>);
    }}</Data>
  </>);
}

const DISPUTE_KIND: Record<Dispute["kind"], string> = { chargeback: "Chargeback", late_refund: "Reembolso fora de prazo", complaint: "Reclamação" };
export function Disputes() {
  const { toast } = useApp();
  const [open, setOpen] = useState<Dispute | null>(null);
  const [note, setNote] = useState("O comprador acedeu ao produto 14 vezes entre 2 e 19 de outubro, a partir do mesmo dispositivo usado na compra. Anexamos o registo de acessos.");
  const q = useQuery({ queryKey: ["admin", "disputes"], queryFn: api.admin.disputes });
  const send = useMutation({ mutationFn: () => api.admin.sendEvidence(open!.id, note), onSuccess: () => { setOpen(null); toast("Provas enviadas ao adquirente", "Resposta do banco esperada em até 30 dias.", "info", "send"); } });
  return (<>
    <PageHead title="Reembolsos e disputas" desc="Chargebacks dos bancos e reclamações de compradores." />
    <Data q={q}>{(rows) => (<>
      <div className="g4">
        <Kpi label="Abertas" value={rows.filter((r) => r.status === "open").length} icon="scale" tone="warning" />
        <Kpi label="Taxa de chargeback" value={pct(0.31, 2)} icon="card" tone="danger" hint="Limite: 0,90%" />
        <Kpi label="Ganhas · 90 dias" value={pct(64, 0)} icon="checkc" tone="success" />
        <Kpi label="Reembolsos automáticos" value="1 204" icon="refund" tone="info" hint="Dentro da garantia · 30 dias" />
      </div>
      <Card flush><Table rows={rows} rowKey={(r) => r.id} cols={[
        { label: "Disputa", render: (r) => <><span className="mono">{r.id}</span><br /><small className="faint">{DISPUTE_KIND[r.kind]}</small></> },
        { label: "Transação", render: (r) => <span className="mono">{r.saleId}</span> },
        { label: "Produtor", render: (r) => r.seller },
        { label: "Motivo", render: (r) => r.reason },
        { label: "Valor", num: true, render: (r) => <><Method m={r.method} /><br /><b style={{ fontWeight: 600 }}>{mt(r.amount)}</b></> },
        { label: "Prazo", render: (r) => (r.deadline ? <span style={r.urgent ? { color: "var(--danger)", fontWeight: 600 } : undefined}>{r.deadline}</span> : "—") },
        { label: "Estado", render: (r) => <Status s={r.status} /> },
        { label: "", num: true, render: (r) => (r.status === "open" ? <Btn s="sm" v="primary" onClick={() => setOpen(r)}>Responder</Btn> : null) },
      ]} /></Card>
    </>)}</Data>
    {open ? (
      <Modal title={`Responder à disputa ${open.id}`} size="lg" desc="As provas são enviadas ao banco emissor através do adquirente." onClose={() => setOpen(null)} foot={<><Btn v="ghost" onClick={() => setOpen(null)}>Aceitar a perda</Btn><Btn v="primary" icon="send" loading={send.isPending} onClick={() => send.mutate()}>Enviar provas</Btn></>}>
        <div className="g2">
          <div className="stack-sm"><h4 className="section-title" style={{ fontSize: 14 }}>Provas recolhidas automaticamente</h4><div className="checks">{["Registo de acesso à área de membros (14 sessões)", "IP e dispositivo da compra", "Email de confirmação entregue", "Aceitação dos termos no checkout"].map((t) => <div key={t} className="ok"><Icon name="checkc" size={18} /><span style={{ color: "var(--text)" }}>{t}</span></div>)}</div></div>
          <Field label="Nota para o banco" htmlFor="dp-n"><Textarea id="dp-n" rows={5} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
      </Modal>
    ) : null}
  </>);
}

export function Gateways() {
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["admin", "gateways"], queryFn: api.admin.gateways });
  return (<>
    <PageHead title="Métodos de pagamento" desc="Fornecedores, custos e regras de encaminhamento." />
    <Data q={q}>{(d) => (<>
      {d.incident ? <Alert tone="warning" icon="alert" title={d.incident.title} text={d.incident.text} action={<Btn s="sm" onClick={() => toast("Incidente INC-0412 aberto", "", "info", "alert")}>Ver incidente</Btn>} /> : null}
      <div className="pgrid">{d.gateways.map((g) => (
        <div key={g.id} className="intg"><div className="row-between"><PayLogo method={g.method} /><Switch defaultChecked={g.enabled} label={g.name} /></div><b>{g.name}</b><p>{g.description}</p>
          <dl className="dl"><dt>Estado</dt><dd><span className="row" style={{ gap: 6, justifyContent: "flex-end" }}><span className={`status-dot ${g.status === "operational" ? "" : "warn"}`} />{g.status === "operational" ? "Operacional" : "Degradado"}</span></dd><dt>Aprovação 24 h</dt><dd>{pct(g.approval)}</dd><dt>Custo para a plataforma</dt><dd>{g.costPercent ? pct(g.costPercent) : "—"}</dd></dl></div>
      ))}</div>
      <Card title="Encaminhamento de cartões, Apple Pay e Google Pay" icon="route"><div className="stack-sm">{d.routing.map((r) => (
        <div key={r.id} className="offer-row"><b className="grow" style={{ minWidth: 200 }}>{r.condition}</b><div className="route">{r.route.map((p, i) => <Fragment key={p}>{i ? <><Icon name="arrow" size={14} className="faint" /><span className="faint" style={{ fontSize: 12 }}>se falhar</span><Icon name="arrow" size={14} className="faint" /></> : null}<span className="kbd-chip">{p}</span></Fragment>)}</div><IconBtn s="sm" icon="edit" label="Editar regra" onClick={() => toast("Editor de encaminhamento", "", "info", "edit")} /></div>
      ))}</div></Card>
    </>)}</Data>
  </>);
}

export function Fees() {
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["admin", "fees"], queryFn: api.admin.fees });
  return (<>
    <PageHead title="Taxas e planos" desc="O que cada produtor paga por venda e quando recebe." actions={<Btn v="primary" onClick={() => toast("Tabela de taxas publicada", "Aplica-se a novas vendas.")}>Guardar alterações</Btn>} />
    <Data q={q}>{(d) => (<>
      <div className="g3">{d.plans.map((p) => (
        <div key={p.id} className={`plan ${p.isDefault ? "on" : ""}`}><div className="row-between"><b style={{ fontSize: 16 }}>{p.name}</b>{p.isDefault ? <Badge tone="primary">Predefinido</Badge> : null}</div>
          <span className="plan-fee">{p.percent != null ? pct(p.percent) : "Negociado"} {p.percent != null ? <small>+ {p.fixed} MT</small> : null}</span><span className="faint" style={{ fontSize: 13 }}>{int(p.sellers)} produtores</span>
          <ul>{p.perks.map((x) => <li key={x}><Icon name="check" size={14} />{x}</li>)}</ul></div>
      ))}</div>
      <div className="g2">
        <Card title="Prazos de libertação" icon="calendar" flush><Table dense rows={d.release} rowKey={(r) => r.method} cols={[
          { label: "Método", render: (r) => <Method m={r.method} /> },
          { label: "Libertação", render: (r) => <div className="ad-input ad-input-sm inline-input"><span className="faint" style={{ fontSize: 13 }}>D+</span><input defaultValue={r.days} aria-label={`Dias para ${METHODS[r.method].label}`} /></div> },
          { label: "Reserva", render: (r) => <div className="ad-input ad-input-sm inline-input"><input defaultValue={r.reservePercent} aria-label={`Reserva para ${METHODS[r.method].label}`} /><span className="faint" style={{ fontSize: 13 }}>%</span></div> },
        ]} /></Card>
        <Card title="Saques" icon="cash"><dl className="dl">{d.payouts.map((p) => <Fragment key={p.label}><dt>{p.label}</dt><dd>{p.value}</dd></Fragment>)}</dl></Card>
      </div>
    </>)}</Data>
  </>);
}

export function Team() {
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["admin", "team"], queryFn: api.admin.team });
  return (<>
    <PageHead title="Equipa e acessos" desc="Quem trabalha no backoffice e o que pode fazer." actions={<Btn v="primary" icon="plus" onClick={() => toast("Convite enviado", "", "success", "send")}>Convidar membro</Btn>} />
    <Data q={q}>{(d) => {
      const perms = Object.keys(d.roles[0]?.permissions ?? {});
      return (<>
        <Card flush><Table rows={d.members} rowKey={(r) => r.id} cols={[
          { label: "Membro", render: (r) => <CellUser name={r.name} sub={r.email} /> },
          { label: "Função", render: (r) => <Badge tone={r.role === "Administrador" ? "primary" : "neutral"}>{r.role}</Badge> },
          { label: "2 passos", render: (r) => (r.twoFactor ? <span style={{ color: "var(--success)" }}><Icon name="checkc" size={16} /></span> : <Badge tone="danger">Desativado</Badge>) },
          { label: "Último acesso", render: (r) => r.lastSeen },
        ]} /></Card>
        <Card title="Permissões por função" icon="lock" flush><Table dense className="perm-table" rows={d.roles} rowKey={(r) => r.role} cols={[
          { label: "Função", render: (r) => <b style={{ fontWeight: 600 }}>{r.role}</b> },
          ...perms.map((p) => ({ label: p, render: (r: (typeof d.roles)[number]) => <input type="checkbox" defaultChecked={r.permissions[p]} disabled={r.role === "Administrador"} aria-label={`${p} para ${r.role}`} /> })),
        ]} /></Card>
      </>);
    }}</Data>
  </>);
}

export function Audit() {
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["admin", "audit"], queryFn: api.admin.auditLogs });
  return (<>
    <PageHead title="Registo de auditoria" desc="Todas as ações da equipa ficam registadas e não podem ser apagadas." actions={<Btn icon="download" onClick={() => toast("Registo exportado")}>Exportar</Btn>} />
    <div className="ad-filterbar"><Input icon="search" wrapClass="ad-search" placeholder="Procurar por pessoa, ação ou ID" aria-label="Procurar no registo" /><Select aria-label="Ação" options={["Todas as ações", "KYC", "Saques", "Taxas", "Reembolsos", "Acessos"]} /><Select aria-label="Período" options={["Últimas 24 horas", "Últimos 7 dias", "Últimos 30 dias"]} /></div>
    <Data q={q}>{(d) => <Card flush><Table dense rows={d.items} rowKey={(r) => r.id} total={d.total} per={d.pageSize} cols={[
      { label: "Quando", render: (r) => <span className="mono">{r.at}</span> },
      { label: "Quem", render: (r) => <CellUser name={r.actor} sub={r.actorRole} /> },
      { label: "Ação", render: (r) => r.action },
      { label: "Objeto", render: (r) => <span className="mono">{r.target}</span> },
      { label: "IP", render: (r) => <span className="mono faint">{r.ip}</span> },
    ]} /></Card>}</Data>
  </>);
}
