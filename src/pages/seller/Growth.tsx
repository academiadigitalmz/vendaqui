import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { CouponInput, RecoveryAutomation } from "@/api/types";
import { Icon, type IconName } from "@/lib/icons";
import { dateLong, int, maskPhone, mt, pct } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { Avatar, Btn, Card, CellUser, Field, IconBtn, Input, Kpi, Meter, PageHead, Select, Status, Switch, Table, Tabs, Textarea, Tile } from "@/components/ui";
import { Data } from "@/components/Data";
import { Modal } from "@/components/overlay";
import { TYPE_META } from "./Products";

type ATab = "lista" | "pedidos" | "mercado";
export function Affiliates() {
  const { toast } = useApp();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as ATab) || "lista";
  const q = useQuery({ queryKey: ["seller", "affiliates"], queryFn: api.seller.affiliates });
  const decide = useMutation({ mutationFn: ({ id, ok }: { id: string; ok: boolean }) => api.seller.decideAffiliate(id, ok), onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["seller", "affiliates"] }); v.ok ? toast("Afiliado aprovado", "Enviámos o link de afiliado por email") : toast("Pedido recusado", "", "neutral", "x"); } });
  return (<>
    <PageHead title="Afiliados" desc="Quem vende os seus produtos e quanto ganha." actions={<Btn v="primary" icon="plus" onClick={() => { navigator.clipboard?.writeText("https://pay.vendaqui.co.mz/afiliar/excel-com-a-ana").catch(() => {}); toast("Link de convite copiado", "", "success", "copy"); }}>Convidar afiliado</Btn>} />
    <Data q={q}>{(d) => (<>
      <div className="g4">
        <Kpi label="Vendas por afiliados" value={int(d.summary.sales)} icon="share" hint={`${d.summary.salesShare}% do total`} />
        <Kpi label="Comissões pagas" value={mt(d.summary.commissionsPaid, 0)} icon="cash" tone="success" />
        <Kpi label="Afiliados ativos" value={int(d.summary.active)} icon="users" tone="info" />
        <Kpi label="Comissão padrão" value={`${d.summary.defaultCommission}%`} icon="percent" tone="purple" hint={`Cookie de ${d.summary.cookieDays} dias`} />
      </div>
      <Tabs value={tab} onChange={(t) => setParams(t === "lista" ? {} : { tab: t }, { replace: true })} items={[["lista", "Os meus afiliados", d.summary.active], ["pedidos", "Pedidos", d.requests.length], ["mercado", "Mercado de afiliação"]]} />
      {tab === "lista" ? <Card flush><Table rows={d.affiliates} rowKey={(r) => r.id} cols={[
        { label: "Afiliado", render: (r) => <CellUser name={r.name} sub={r.email} /> },
        { label: "Vendas", num: true, render: (r) => r.sales },
        { label: "Comissões", num: true, render: (r) => mt(r.commissions, 0) },
        { label: "Conversão", num: true, render: (r) => pct(r.conversion) },
        { label: "Estado", render: (r) => <Status s={r.status} /> },
        { label: "", num: true, render: (r) => <IconBtn s="sm" icon="more" label={`Ações para ${r.name}`} onClick={() => toast("Ações do afiliado", r.name, "info", "more")} /> },
      ]} /></Card> : null}
      {tab === "pedidos" ? <div className="stack-sm">{d.requests.length ? d.requests.map((r) => (
        <div key={r.id} className="offer-row"><Avatar name={r.name} s="md" /><div className="grow"><b>{r.name}</b><span className="faint" style={{ fontSize: 13 }}>{r.audience} · quer promover {r.productName}</span></div>
          <div className="row" style={{ gap: 8 }}><Btn s="sm" v="ghost" onClick={() => decide.mutate({ id: r.id, ok: false })}>Recusar</Btn><Btn s="sm" v="primary" icon="check" onClick={() => decide.mutate({ id: r.id, ok: true })}>Aprovar</Btn></div></div>
      )) : <Card><p className="muted">Não há pedidos por analisar.</p></Card>}</div> : null}
      {tab === "mercado" ? (<>
        <p className="muted">Promova produtos de outros produtores e ganhe comissão em cada venda.</p>
        <div className="pgrid">{d.marketplace.map((m) => (
          <div key={m.id} className="pcard" style={{ cursor: "default" }}>
            <div className={`pcard-head cv-${m.cover}`}><span className="pcard-type"><Icon name={TYPE_META[m.type][1]} size={14} />{TYPE_META[m.type][0]}</span><h4>{m.name}</h4></div>
            <div className="pcard-body"><span className="faint" style={{ fontSize: 13 }}>por {m.producer} · ★ {String(m.rating).replace(".", ",")}</span>
              <div className="pcard-stats"><div><small>Preço</small><b>{mt(m.price, 0)}</b></div><div><small>Comissão</small><b>{m.commissionPercent}%</b></div><div><small>Ganha</small><b>{mt(m.price * m.commissionPercent / 100, 0)}</b></div></div>
              <Btn s="sm" v="soft" block onClick={() => toast("Pedido enviado", m.producer)}>Pedir afiliação</Btn></div>
          </div>
        ))}</div>
      </>) : null}
    </>)}</Data>
  </>);
}

export function Coupons() {
  const { toast } = useApp();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [c, setC] = useState<CouponInput>({ code: "NATAL25", kind: "percent", value: 25, expiresAt: "2026-12-26" });
  const q = useQuery({ queryKey: ["seller", "coupons"], queryFn: api.seller.coupons });
  const products = useQuery({ queryKey: ["seller", "products"], queryFn: api.seller.products });
  const create = useMutation({ mutationFn: () => api.seller.createCoupon(c), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["seller", "coupons"] }); setOpen(false); toast("Cupão criado", `${r.code} já funciona no checkout`); }, onError: (e) => toast("Não foi possível criar o cupão", e instanceof Error ? e.message : "", "danger", "alert") });
  const copy = (t: string) => { navigator.clipboard?.writeText(t).catch(() => {}); toast("Código copiado", t, "success", "copy"); };
  return (<>
    <PageHead title="Cupões" desc="Descontos que os clientes escrevem no checkout." actions={<Btn v="primary" icon="plus" onClick={() => setOpen(true)}>Criar cupão</Btn>} />
    <Data q={q}>{(rows) => <Card flush><Table rows={rows} rowKey={(r) => r.id} cols={[
      { label: "Código", render: (r) => <span className="kbd-chip">{r.code}</span> },
      { label: "Desconto", render: (r) => <b style={{ fontWeight: 600 }}>{r.discount.kind === "percent" ? `${r.discount.value}%` : mt(r.discount.value, 0)}</b> },
      { label: "Utilizações", render: (r) => <div className="stack-xs" style={{ minWidth: 110 }}><span>{r.uses}{r.limit ? ` de ${r.limit}` : ""}</span>{r.limit ? <Meter value={(r.uses / r.limit) * 100} /> : null}</div> },
      { label: "Validade", render: (r) => (r.expiresAt ? dateLong(r.expiresAt) : "Sem fim") },
      { label: "Produtos", render: (r) => r.productsLabel },
      { label: "Estado", render: (r) => <Status s={r.status === "expired" ? "expired_coupon" : r.status} /> },
      { label: "", num: true, render: (r) => <IconBtn s="sm" icon="copy" label="Copiar código" onClick={() => copy(r.code)} /> },
    ]} /></Card>}</Data>
    {open ? (
      <Modal title="Criar cupão" onClose={() => setOpen(false)} foot={<><Btn onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="primary" loading={create.isPending} onClick={() => create.mutate()}>Criar cupão</Btn></>}>
        <Field label="Código" htmlFor="cp-code" help="Letras e números, sem espaços."><Input id="cp-code" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase().replace(/\s/g, "") })} /></Field>
        <div className="g2">
          <Field label="Tipo" htmlFor="cp-type"><Select id="cp-type" value={c.kind} onChange={(e) => setC({ ...c, kind: e.target.value as "percent" | "fixed" })} options={[["percent", "Percentagem"], ["fixed", "Valor fixo"]]} /></Field>
          <Field label="Desconto" htmlFor="cp-val"><Input id="cp-val" inputMode="decimal" value={String(c.value)} suffix={c.kind === "percent" ? "%" : "MT"} onChange={(e) => setC({ ...c, value: Number(e.target.value.replace(",", ".")) || 0 })} /></Field>
        </div>
        <div className="g2">
          <Field label="Limite de utilizações" htmlFor="cp-lim"><Input id="cp-lim" inputMode="numeric" placeholder="Sem limite" onChange={(e) => setC({ ...c, limit: Number(e.target.value) || undefined })} /></Field>
          <Field label="Válido até" htmlFor="cp-end"><Input id="cp-end" type="date" value={c.expiresAt?.slice(0, 10)} onChange={(e) => setC({ ...c, expiresAt: e.target.value })} /></Field>
        </div>
        <Field label="Produtos" htmlFor="cp-p"><Select id="cp-p" onChange={(e) => setC({ ...c, productId: e.target.value || undefined })} options={[["", "Todos os produtos"], ...(products.data ?? []).map((p) => [p.id, p.name] as [string, string])]} /></Field>
      </Modal>
    ) : null}
  </>);
}

const CH_ICON: Record<RecoveryAutomation["channel"], IconName> = { sms: "phone", whatsapp: "msg", email: "mail" };
export function Recovery() {
  const { toast } = useApp();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["seller", "recovery"], queryFn: api.seller.recovery });
  const toggle = useMutation({ mutationFn: ({ id, on }: { id: string; on: boolean }) => api.seller.toggleAutomation(id, on), onSuccess: (a) => { qc.invalidateQueries({ queryKey: ["seller", "recovery"] }); toast(a.enabled ? "Automação ativada" : "Automação desativada", a.title, a.enabled ? "success" : "neutral", a.enabled ? "checkc" : "x"); } });
  const contact = useMutation({ mutationFn: (id: string) => api.seller.contactCart(id), onSuccess: (_, id) => { const c = q.data?.carts.find((x) => x.id === id); toast("Link de pagamento enviado", c ? maskPhone(c.buyer.phone) : ""); } });
  return (<>
    <PageHead title="Recuperação de vendas" desc="Mensagens automáticas para quem começou a comprar e não terminou." />
    <Data q={q}>{(d) => (<>
      <div className="g4">
        <Kpi label="Carrinhos abandonados" value={int(d.summary.abandoned)} icon="cart" tone="warning" hint="Últimos 30 dias" />
        <Kpi label="Recuperados" value={int(d.summary.recovered)} icon="checkc" tone="success" />
        <Kpi label="Valor recuperado" value={mt(d.summary.recoveredAmount, 0)} icon="wallet" />
        <Kpi label="Taxa de recuperação" value={pct(d.summary.rate)} icon="target" tone="info" delta={d.summary.rateDelta} />
      </div>
      <div className="g-main-r">
        <Card title="Automações" icon="zap">{d.automations.map((a) => (
          <div key={a.id} className="setting"><div style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}><Tile icon={CH_ICON[a.channel]} tone={a.enabled ? "primary" : "neutral"} s="sm" /><div className="stack-xs"><b>{a.title} · {a.delay}</b><small>{a.message}</small></div></div><Switch checked={a.enabled} onChange={(v) => toggle.mutate({ id: a.id, on: v })} label={a.title} /></div>
        ))}</Card>
        <Card title="Por recuperar" icon="cart" flush><Table dense rows={d.carts} rowKey={(r) => r.id} cols={[
          { label: "Cliente", render: (r) => <CellUser name={r.buyer.name} sub={maskPhone(r.buyer.phone)} /> },
          { label: "Produto", render: (r) => r.productName },
          { label: "Valor", num: true, render: (r) => mt(r.amount) },
          { label: "Motivo", render: (r) => r.reason },
          { label: "", num: true, render: (r) => <Btn s="sm" icon="send" onClick={() => contact.mutate(r.id)}>Contactar</Btn> },
        ]} /></Card>
      </div>
    </>)}</Data>
  </>);
}

export function Members() {
  const { toast } = useApp();
  const [sel, setSel] = useState("m2l3");
  const q = useQuery({ queryKey: ["seller", "course", "p1"], queryFn: () => api.seller.course("p1") });
  return (
    <Data q={q}>{(c) => {
      const all = c.modules.flatMap((m, mi) => m.lessons.map((l, li) => ({ ...l, mi, li })));
      const cur = all.find((l) => l.id === sel) ?? all[0];
      const total = all.length;
      return (<>
        <PageHead title="Área de membros" desc={`${c.title} · ${c.modules.length} módulos, ${total} aulas.`} actions={<><Btn icon="eye" to={`/aluno/aulas/${cur.id}`}>Ver como aluno</Btn><Btn v="primary" icon="plus" onClick={() => toast("Aula criada", `Módulo ${cur.mi + 1}`)}>Nova aula</Btn></>} />
        <div className="g4">
          <Kpi label="Alunos ativos" value={int(c.stats!.activeStudents)} icon="users" />
          <Kpi label="Conclusão média" value={pct(c.stats!.completion, 0)} icon="checkc" tone="success" />
          <Kpi label="Certificados emitidos" value={int(c.stats!.certificates)} icon="award" tone="purple" />
          <Kpi label="Perguntas por responder" value={int(c.stats!.openQuestions)} icon="msg" tone="warning" />
        </div>
        <div className="g-main-r">
          <div className="stack-sm">
            {c.modules.map((m, mi) => (
              <div className="module" key={m.id}>
                <div className="module-head"><Icon name="grip" size={16} className="faint" />{mi + 1}. {m.title}<small>{m.lessons.length} aulas</small></div>
                {m.lessons.map((l) => <button key={l.id} className={`lesson ${l.id === cur.id ? "on" : ""}`} onClick={() => setSel(l.id)}><Icon name="grip" size={14} className="grip" /><Icon name="video" size={16} /><span>{l.title}</span><small>{l.duration}</small></button>)}
              </div>
            ))}
            <Btn icon="plus" onClick={() => toast("Módulo criado", `Módulo ${c.modules.length + 1}`)}>Adicionar módulo</Btn>
          </div>
          <Card title="Editar aula" icon="edit" foot={<div className="row" style={{ justifyContent: "flex-end", gap: 8 }}><Btn v="ghost" icon="trash" onClick={() => toast("Aula movida para o lixo", cur.title, "neutral", "trash")}>Eliminar</Btn><Btn v="primary" onClick={() => toast("Aula guardada")}>Guardar aula</Btn></div>}>
            <div className="stack-sm" style={{ gap: 16 }} key={cur.id}>
              <Field label="Título" htmlFor="ls-t"><Input id="ls-t" defaultValue={cur.title} /></Field>
              <div className="video" style={{ aspectRatio: "16/7" }}><div className="video-slide"><small>Módulo {cur.mi + 1}</small><b>{cur.title}</b></div><div className="video-bar"><Icon name="video" size={14} /><span>aula-{cur.mi + 1}-{cur.li + 1}.mp4 · 1080p · {cur.duration}</span></div></div>
              <div className="row" style={{ gap: 8 }}><Btn s="sm" icon="upload" onClick={() => toast("Carregamento iniciado", "", "info", "upload")}>Substituir vídeo</Btn><Btn s="sm" icon="file" onClick={() => toast("Legendas geradas automaticamente")}>Legendas</Btn></div>
              <Field label="Descrição" htmlFor="ls-d"><Textarea id="ls-d" defaultValue={`Nesta aula vemos ${cur.title.toLowerCase()} com uma folha de vendas real.`} /></Field>
              <div className="g2">
                <Field label="Disponível" htmlFor="ls-drip"><Select id="ls-drip" options={["Logo após a compra", "7 dias após a compra", "14 dias após a compra", "Numa data fixa"]} /></Field>
                <Field label="Materiais"><ul className="ad-filelist"><li><Icon name="file" size={16} /><span className="ad-filelist-name">exercicios.xlsx</span><span className="ad-filelist-size">96 KB</span></li></ul></Field>
              </div>
              <div className="setting"><div><b>Aula de amostra grátis</b><small>Visível na página de vendas sem comprar</small></div><Switch defaultChecked={!!cur.freePreview} label="Aula de amostra grátis" /></div>
            </div>
          </Card>
        </div>
      </>);
    }}</Data>
  );
}
