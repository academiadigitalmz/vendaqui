import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { PaymentMethod, SaleStatus } from "@/api/types";
import { dateLong, int, mt, pct } from "@/lib/format";
import { METHODS, METHOD_ORDER } from "@/lib/methods";
import { useApp } from "@/lib/app-state";
import { Alert, Btn, Card, CellUser, Empty, IconBtn, Input, Kpi, Method, PageHead, Select, Status, Table } from "@/components/ui";
import { Data } from "@/components/Data";
import { SaleDrawer, SalesTable } from "./Dashboard";

export default function Sales() {
  const { toast } = useApp();
  const [params, setParams] = useSearchParams();
  const f = { q: params.get("q") ?? "", status: (params.get("status") ?? "") as SaleStatus | "", method: (params.get("method") ?? "") as PaymentMethod | "", productId: params.get("produto") ?? "" };
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n, { replace: true }); };
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["seller", "sales", f], queryFn: () => api.seller.sales(f), placeholderData: (p) => p });
  const products = useQuery({ queryKey: ["seller", "products"], queryFn: api.seller.products });
  return (<>
    <PageHead title="Vendas" desc="Todas as transações dos seus produtos." actions={<Btn icon="download" onClick={() => toast("Exportação enviada", "Recebe o ficheiro CSV por email.", "info", "mail")}>Exportar CSV</Btn>} />
    <Data q={q}>{(d) => (<>
      <div className="g4">
        <Kpi label="Aprovadas" value={int(d.counts.approved)} icon="checkc" tone="success" hint={mt(d.approvedAmount)} />
        <Kpi label="Pendentes" value={int(d.counts.pending)} icon="clock" tone="warning" hint="A aguardar a confirmação do cliente" />
        <Kpi label="Recusadas e expiradas" value={int(d.counts.declined + d.counts.expired)} icon="xc" tone="danger" hint="Recupere em Recuperação de vendas" />
        <Kpi label="Reembolsadas" value={int(d.counts.refunded)} icon="refund" tone="neutral" hint="Taxa de reembolso 0,9%" />
      </div>
      <div className="ad-filterbar">
        <Input icon="search" wrapClass="ad-search" placeholder="Nome, email ou nº da venda" value={f.q} onChange={(e) => set("q", e.target.value)} aria-label="Procurar vendas" />
        <Select aria-label="Estado" value={f.status} onChange={(e) => set("status", e.target.value)} options={[["", "Todos os estados"], ["approved", "Aprovada"], ["pending", "Pendente"], ["declined", "Recusada"], ["refunded", "Reembolsada"], ["expired", "Expirada"]]} />
        <Select aria-label="Método" value={f.method} onChange={(e) => set("method", e.target.value)} options={[["", "Todos os métodos"], ...METHOD_ORDER.map((m) => [m, METHODS[m].label] as [string, string])]} />
        <Select aria-label="Produto" value={f.productId} onChange={(e) => set("produto", e.target.value)} options={[["", "Todos os produtos"], ...(products.data ?? []).map((p) => [p.id, p.name] as [string, string])]} />
        <span className="ad-filterbar-count">{d.total} vendas</span>
      </div>
      <Card flush>{d.items.length ? <SalesTable rows={d.items} total={d.total} per={d.pageSize} onOpen={(s) => setOpen(s.id)} /> : <Empty icon="search" title="Nenhuma venda encontrada" desc="Experimente limpar os filtros ou procurar por outro nome." action={<Btn onClick={() => setParams({}, { replace: true })}>Limpar filtros</Btn>} />}</Card>
    </>)}</Data>
    {open ? <SaleDrawer id={open} onClose={() => setOpen(null)} /> : null}
  </>);
}

export function Subscriptions() {
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["seller", "subscriptions"], queryFn: api.seller.subscriptions });
  return (<>
    <PageHead title="Assinaturas" desc="Clube Excel Pro · cobrança mensal de 790 MT." actions={<Btn icon="sliders" onClick={() => toast("Definições de cobrança abertas", "", "info", "sliders")}>Configurar cobrança</Btn>} />
    <Data q={q}>{(d) => (<>
      <div className="g4">
        <Kpi label="Receita recorrente mensal" value={mt(d.summary.mrr, 0)} icon="repeat" tone="purple" delta={d.summary.mrrDelta} />
        <Kpi label="Assinantes ativos" value={int(d.summary.active)} icon="users" tone="success" hint={`+${d.summary.newThisMonth} este mês`} />
        <Kpi label="Cancelamentos" value={pct(d.summary.churn)} icon="trenddown" tone="danger" hint={`${d.summary.churned30d} nos últimos 30 dias`} />
        <Kpi label="Renovações por confirmar" value={int(d.summary.pendingRenewals)} icon="clock" tone="warning" hint="Lembrete enviado por SMS" />
      </div>
      <Alert title="Como funciona a renovação" text="No dia da renovação, cartões, Apple Pay e Google Pay são cobrados automaticamente. Em M-Pesa e e-Mola o assinante recebe o pedido de confirmação no telemóvel; se não confirmar, tentamos de novo em 1, 3 e 5 dias e enviamos um link por SMS. O acesso fica suspenso ao 7.º dia." />
      <Card flush>
        <Table rows={d.items} rowKey={(r) => r.id} total={d.total} cols={[
          { label: "Assinante", render: (r) => <CellUser name={r.subscriber.name} sub={r.subscriber.email} /> },
          { label: "Método", render: (r) => <Method m={r.method} /> },
          { label: "Desde", render: (r) => dateLong(r.since) },
          { label: "Próxima cobrança", render: (r) => (r.nextCharge ? dateLong(r.nextCharge) : "—") },
          { label: "Total pago", num: true, render: (r) => mt(r.totalPaid, 0) },
          { label: "Estado", render: (r) => <Status s={r.status} label={r.status === "active" ? "Ativa" : undefined} /> },
        ]} />
      </Card>
    </>)}</Data>
  </>);
}

export function Customers() {
  const { toast } = useApp();
  const [term, setTerm] = useState("");
  const q = useQuery({ queryKey: ["seller", "customers", term], queryFn: () => api.seller.customers(term), placeholderData: (p) => p });
  return (<>
    <PageHead title="Clientes" desc="Quem comprou os seus produtos." actions={<Btn icon="download" onClick={() => toast("Lista de clientes exportada")}>Exportar</Btn>} />
    <Data q={q}>{(d) => (<>
      <div className="g4">
        <Kpi label="Clientes" value={int(d.summary.total)} icon="users" />
        <Kpi label="Compraram mais de uma vez" value={pct(d.summary.repeatRate)} icon="repeat" tone="success" />
        <Kpi label="Valor médio por cliente" value={mt(d.summary.avgValue, 0)} icon="wallet" tone="info" />
        <Kpi label="Cidade com mais compras" value={d.summary.topCity} icon="globe" tone="purple" hint={`${d.summary.topCityShare}% dos clientes`} />
      </div>
      <div className="ad-filterbar"><Input icon="search" wrapClass="ad-search" placeholder="Procurar cliente" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Procurar cliente" /></div>
      <Card flush>
        {d.items.length ? <Table rows={d.items} rowKey={(r) => r.id} total={d.total} per={d.pageSize} cols={[
          { label: "Cliente", render: (r) => <CellUser name={r.name} sub={r.email} /> },
          { label: "Cidade", render: (r) => r.city },
          { label: "Compras", num: true, render: (r) => r.purchases },
          { label: "Total gasto", num: true, render: (r) => mt(r.totalSpent, 0) },
          { label: "Última compra", render: (r) => dateLong(r.lastPurchaseAt) },
          { label: "", num: true, render: (r) => <IconBtn s="sm" icon="msg" label="Enviar mensagem" onClick={() => toast("Mensagem enviada por SMS", r.name)} /> },
        ]} /> : <Empty icon="search" title="Nenhum cliente encontrado" desc="Procure por outro nome ou email." />}
      </Card>
    </>)}</Data>
  </>);
}
