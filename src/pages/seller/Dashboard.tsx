import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { Period, Sale } from "@/api/types";
import { Icon, type IconName } from "@/lib/icons";
import { date, int, maskPhone, mt, pct } from "@/lib/format";
import { METHODS } from "@/lib/methods";
import { useApp } from "@/lib/app-state";
import { Badge, Btn, Card, CellUser, Cover, Kpi, Method, Meter, Status, Table, Timeline, type Tone } from "@/components/ui";
import { AreaChart } from "@/components/chart";
import { Data } from "@/components/Data";
import { Drawer, Modal } from "@/components/overlay";

const PERIODS: [Period, string][] = [["today", "Hoje"], ["7d", "7 dias"], ["30d", "30 dias"], ["12m", "12 meses"]];
const typeIcon = (t: string): IconName => (t === "ebook" ? "book" : t === "subscription" ? "repeat" : t === "mentoring" ? "users" : "cap");

export function SalesTable({ rows, compact, total, per, onOpen }: { rows: Sale[]; compact?: boolean; total?: number; per?: number; onOpen: (s: Sale) => void }) {
  return (
    <Table rows={rows} rowKey={(s) => s.id} onRow={onOpen} total={total} per={per} cols={[
      { label: "Venda", render: (s) => <><span className="mono">{s.id}</span><br /><small className="faint">{date(s.createdAt)}</small></> },
      { label: "Cliente", render: (s) => <CellUser name={s.buyer.name} sub={compact ? s.buyer.city : maskPhone(s.buyer.phone)} /> },
      { label: "Produto", render: (s) => <><span style={{ fontWeight: 500 }}>{s.product.name}</span>{s.orderBump ? <><br /><small className="faint">+ order bump</small></> : null}{s.affiliate ? <><br /><small className="faint">Afiliado: {s.affiliate.name}</small></> : null}</> },
      { label: "Método", render: (s) => <Method m={s.method} /> },
      { label: "Valor", num: true, render: (s) => <><b style={{ fontWeight: 600 }}>{mt(s.amount)}</b>{compact ? null : <><br /><small className="faint">Líquido {mt(s.net)}</small></>}</> },
      { label: "Estado", render: (s) => <Status s={s.status} /> },
    ]} />
  );
}

const toneIcon: Record<string, IconName> = { neutral: "cart", info: "phone", success: "checkc", warning: "clock", danger: "xc" };
/** Detalhe de uma venda: cliente, divisão do valor, histórico e ações. */
export function SaleDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const q = useQuery({ queryKey: ["seller", "sale", id], queryFn: () => api.seller.sale(id) });
  const refund = useMutation({
    mutationFn: () => api.seller.refundSale(id),
    onSuccess: (s) => { setConfirm(false); qc.invalidateQueries({ queryKey: ["seller"] }); toast("Reembolso enviado", `${mt(s.amount)} a caminho de ${s.buyer.name}`, "info", "refund"); onClose(); },
    onError: (e) => toast("Não foi possível reembolsar", e instanceof Error ? e.message : "", "danger", "alert"),
  });
  const resend = useMutation({ mutationFn: () => api.seller.resendAccess(id), onSuccess: () => toast("Acesso reenviado", q.data?.buyer.email) });
  const s = q.data;
  return (
    <Drawer over={id} title={s ? mt(s.amount) : "A carregar…"} sub={s ? <div className="row" style={{ gap: 8 }}><Status s={s.status} /><Method m={s.method} /></div> : null} onClose={onClose}
      foot={!s ? null : s.status === "approved" ? <><Btn icon="send" loading={resend.isPending} onClick={() => resend.mutate()}>Reenviar acesso</Btn><Btn v="danger" icon="refund" onClick={() => setConfirm(true)}>Reembolsar</Btn></>
        : s.status === "pending" ? <Btn v="primary" icon="send" onClick={() => toast("Link de pagamento enviado", `SMS para ${maskPhone(s.buyer.phone)}`)}>Enviar link de pagamento por SMS</Btn> : <Btn onClick={onClose}>Fechar</Btn>}>
      <Data q={q}>{(s) => (<>
        <section className="stack-sm"><h3 className="section-title">Cliente</h3><CellUser name={s.buyer.name} sub={s.buyer.email} />
          <dl className="dl"><dt>Telemóvel</dt><dd>{s.buyer.phone}</dd><dt>Cidade</dt><dd>{s.buyer.city}</dd><dt>IP · dispositivo</dt><dd>{s.device}</dd></dl></section>
        <hr className="hr" />
        <section className="stack-sm"><h3 className="section-title">Divisão do valor</h3>
          <dl className="dl">
            <dt>{s.product.name}</dt><dd>{mt(s.amount - (s.orderBump ? 190 : 0))}</dd>
            {s.orderBump ? <><dt>Order bump · Ebook</dt><dd>{mt(190)}</dd></> : null}
            <dt>Taxa VendAqui (4,9% + 10 MT)</dt><dd>−{mt(s.fee)}</dd>
            {s.affiliate ? <><dt>Comissão {s.affiliate.name} (40%)</dt><dd>−{mt(s.affiliate.commission)}</dd></> : null}
            <dt><b style={{ color: "var(--text)" }}>Recebe</b></dt><dd><b>{mt(s.net)}</b></dd>
          </dl></section>
        <hr className="hr" />
        <section className="stack-sm"><h3 className="section-title">Histórico</h3>
          <Timeline items={[...s.timeline, ...(s.status === "approved" ? [{ at: "", label: `Libertação do saldo prevista ${s.method === "mpesa" || s.method === "emola" ? "em 2 dias" : "em 14 dias"}`, tone: "warning" as const }] : [])].map((e) => ({ title: e.label, sub: e.at ? date(e.at) : undefined, tone: e.tone as Tone, icon: toneIcon[e.tone] }))} /></section>
        <section className="stack-sm"><h3 className="section-title">Rastreio</h3><dl className="dl"><dt>Origem</dt><dd>{s.tracking.source}</dd><dt>utm_campaign</dt><dd className="mono">{s.tracking.utmCampaign}</dd><dt>Pixel Meta</dt><dd>{s.tracking.pixel}</dd></dl></section>
        {confirm ? (
          <Modal title="Reembolsar esta venda?" size="sm" desc={`${s.id} · ${s.buyer.name}`} onClose={() => setConfirm(false)} foot={<><Btn onClick={() => setConfirm(false)}>Cancelar</Btn><Btn v="danger" loading={refund.isPending} onClick={() => refund.mutate()}>Reembolsar {mt(s.amount)}</Btn></>}>
            <p className="muted">Devolvemos {mt(s.amount)} ao cliente pelo {METHODS[s.method].label} e retiramos {mt(s.net)} do seu saldo. O acesso ao produto é cancelado.</p>
          </Modal>
        ) : null}
      </>)}</Data>
    </Drawer>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [period, setPeriod] = useState<Period>("30d");
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["seller", "dashboard", period], queryFn: () => api.seller.dashboard(period), placeholderData: (p) => p });
  const sales = useQuery({ queryKey: ["seller", "sales", {}], queryFn: () => api.seller.sales({}) });
  return (
    <Data q={q} rows={4}>{(d) => {
      const pl = PERIODS.find((p) => p[0] === period)![1];
      const left = Math.max(0, d.plaque.goal - d.plaque.total);
      const plPct = Math.min(100, (d.plaque.total / d.plaque.goal) * 100);
      return (<>
        <div className="welcome">
          <div className="stack-xs"><span className="faint" style={{ fontSize: 13 }}>Quinta-feira, 22 de outubro</span><h1>Olá, Ana</h1><p className="muted">Vendeu {d.salesToday} vezes hoje. O Excel do Zero continua a puxar as vendas.</p></div>
          <div className="ad-tabs ad-tabs-segmented">{PERIODS.map(([k, l]) => <button key={k} className={`ad-tab ${period === k ? "is-active" : ""}`} onClick={() => setPeriod(k)}>{l}</button>)}</div>
        </div>
        <div className="g4">
          <Kpi label="Faturamento líquido" value={mt(d.revenueNet, 0)} icon="wallet" delta={d.deltas.revenue} hint={`${pl} · já sem taxas`} spark={d.series.slice(-14).map((x) => x.value)} />
          <Kpi label="Vendas aprovadas" value={int(d.approvedSales)} icon="receipt" tone="success" delta={d.deltas.sales} hint={`${int(d.affiliateSales)} vieram de afiliados`} spark={d.salesSpark} sparkColor="var(--success)" />
          <Kpi label="Ticket médio" value={mt(d.avgTicket, 0)} icon="tag" tone="info" delta={d.deltas.ticket} hint="Order bump em 28% das vendas" />
          <Kpi label="Conversão do checkout" value={pct(d.conversion)} icon="target" tone="purple" delta={d.deltas.conversion} hint={`Reembolsos: ${pct(d.refundRate)}`} />
        </div>
        <div className="g-main">
          <Card title="Faturamento" icon="trendup" aside={<div className="legend"><span><i />Líquido em MT</span></div>}>
            <AreaChart data={d.series.map((x) => x.value)} labels={d.series.map((x) => x.label)} aria="Faturamento por dia" h={250} />
          </Card>
          <div className="stack-sm" style={{ gap: 16 }}>
            <section className="balance-card">
              <div className="row-between"><small>Saldo disponível</small><Badge tone="success">Saque grátis</Badge></div>
              <span className="big">{mt(d.balance.available)}</span>
              <div className="balance-split"><div><small>A libertar</small><b>{mt(d.balance.pending)}</b></div><div><small>Reserva 5%</small><b>{mt(d.balance.reserve)}</b></div></div>
              <div className="row" style={{ gap: 8 }}><Btn v="primary" icon="cash" className="grow" onClick={() => nav("/produtor/financeiro?sacar=1")}>Sacar</Btn><Btn to="/produtor/financeiro">Extrato</Btn></div>
              {d.balance.nextRelease ? <small>Próxima libertação: 24 out · {mt(d.balance.nextRelease.amount)}</small> : null}
            </section>
            <Card>
              <div className="plaque"><span className="plaque-medal"><Icon name="award" size={26} /></span><div className="grow stack-xs"><b>Rumo à placa de {d.plaque.goal >= 1e6 ? `${d.plaque.goal / 1e6} milhões` : mt(d.plaque.goal, 0)}</b><span className="faint" style={{ fontSize: 13 }}>{mt(d.plaque.total, 0)} faturados desde jan 2025</span></div></div>
              <div className="ad-progress"><div className="ad-progress-top"><span>Faltam {mt(left, 0)}</span><strong>{Math.round(plPct)}%</strong></div><div className="ad-progress-track"><div className="ad-progress-fill" style={{ width: `${plPct}%`, background: "var(--primary)" }} /></div></div>
            </Card>
          </div>
        </div>
        <div className="g3">
          <Card title="Métodos de pagamento" icon="wallet" tone="info">
            <div className="stack-sm">{d.methods.map((m) => <div key={m.method} className="hbar"><Method m={m.method} /><Meter value={m.share} color={`var(--m-${m.method})`} /><b>{pct(m.share)}</b></div>)}</div>
            <p className="faint" style={{ fontSize: 12.5 }}>Aprovação: {d.methods.map((m) => `${METHODS[m.method].label} ${pct(m.approvalRate)}`).join(" · ")}</p>
          </Card>
          <Card title="Mais vendidos" icon="package" aside={<Link className="ad-link" to="/produtor/produtos">Ver todos</Link>}>
            <div className="stack-sm">{d.topProducts.map((p) => (
              <Link key={p.productId} className="ad-item is-interactive ad-item-plain" to={`/produtor/produtos/${p.productId}`} style={{ padding: "4px 0" }}>
                <Cover cover={p.cover} icon={typeIcon(p.type)} /><div className="ad-item-main"><span className="ad-item-title" style={{ fontSize: 14 }}>{p.name}</span><span className="ad-item-meta"><span>{mt(p.revenue, 0)}</span></span></div><span className="faint" style={{ fontSize: 13 }}>{pct(p.share * 100, 0)}</span>
              </Link>
            ))}</div>
          </Card>
          <Card title="Configure a sua conta" icon="checkc" tone="success">
            <div className="checklist">{d.onboarding.map((o) => <Link key={o.key} to={o.href} className={o.done ? "done" : ""}><span className="c">{o.done ? <Icon name="check" size={12} /> : null}</span><span>{o.label}</span><Icon name="right" size={16} className="chev" /></Link>)}</div>
            <div className="ad-progress ad-progress-sm"><div className="ad-progress-top"><span>{d.onboarding.filter((o) => o.done).length} de {d.onboarding.length} concluídos</span><strong>{Math.round((d.onboarding.filter((o) => o.done).length / d.onboarding.length) * 100)}%</strong></div><div className="ad-progress-track"><div className="ad-progress-fill" style={{ width: `${(d.onboarding.filter((o) => o.done).length / d.onboarding.length) * 100}%`, background: "var(--success)" }} /></div></div>
          </Card>
        </div>
        <Card title="Últimas vendas" icon="receipt" flush aside={<Link className="ad-link" to="/produtor/vendas">Ver todas as vendas</Link>}>
          {sales.data ? <SalesTable rows={sales.data.items.slice(0, 6)} compact onOpen={(s) => setOpen(s.id)} /> : <div className="empty-pad" />}
        </Card>
        {open ? <SaleDrawer id={open} onClose={() => setOpen(null)} /> : null}
      </>);
    }}</Data>
  );
}
