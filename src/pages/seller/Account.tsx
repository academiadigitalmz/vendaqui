import { Fragment, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import type { Account as AccountT, Finance as FinanceT } from "@/api/types";
import { Icon } from "@/lib/icons";
import { date, mt, num } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { Alert, Avatar, Badge, Btn, Card, CellUser, Field, Input, Kpi, Method, PageHead, Status, Switch, Table, Tabs, Timeline } from "@/components/ui";
import { Data } from "@/components/Data";
import { Modal } from "@/components/overlay";

function WithdrawModal({ f, onClose }: { f: FinanceT; onClose: () => void }) {
  const { toast } = useApp();
  const qc = useQueryClient();
  const [accountId, setAccountId] = useState(f.accounts.find((a) => a.primary)?.id ?? f.accounts[0].id);
  const [amount, setAmount] = useState(num(f.balance.available));
  const acc = f.accounts.find((a) => a.id === accountId)!;
  const value = Number(amount.replace(/[\s ]/g, "").replace(",", ".")) || 0;
  const req = useMutation({
    mutationFn: () => api.seller.requestPayout({ amount: value, accountId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller"] }); onClose(); toast("Saque a caminho", acc.kind === "bank" ? "Chega à conta bancária no próximo dia útil." : `O ${acc.label} confirma por SMS em menos de 1 minuto.`, "success", "cash"); },
  });
  return (
    <Modal title="Solicitar saque" desc={`Disponível: ${mt(f.balance.available)}`} onClose={onClose} foot={<><Btn onClick={onClose}>Cancelar</Btn><Btn v="primary" loading={req.isPending} onClick={() => req.mutate()} disabled={value < 100}>Confirmar saque</Btn></>}>
      {req.isError ? <Alert tone="danger" icon="alert" title="Não foi possível pedir o saque" text={req.error instanceof HttpError ? req.error.message : "Tente outra vez."} /> : null}
      <Field label="Valor" htmlFor="wd-v" help="Mínimo 100 MT."><Input id="wd-v" s="lg" suffix="MT" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <div className="stack-xs"><span className="ad-label">Destino</span>
        <div className="choice-grid">{f.accounts.map((a) => <button key={a.id} type="button" className={`choice ${accountId === a.id ? "on" : ""}`} onClick={() => setAccountId(a.id)}><span className={`pm pm-${a.kind}`}><i />{a.label} · {a.masked}</span><small>{a.fee ? mt(a.fee) : "Grátis"} · {a.eta}</small></button>)}</div></div>
      <dl className="dl"><dt>Custo do saque</dt><dd>{mt(acc.fee)}</dd><dt>Recebe</dt><dd><b>{mt(Math.max(0, value - acc.fee))}</b></dd></dl>
    </Modal>
  );
}

export function Finance() {
  const { toast } = useApp();
  const [params, setParams] = useSearchParams();
  const q = useQuery({ queryKey: ["seller", "finance"], queryFn: api.seller.finance });
  const open = params.get("sacar") === "1";
  const setOpen = (v: boolean) => setParams(v ? { sacar: "1" } : {}, { replace: true });
  return (<>
    <PageHead title="Financeiro" desc="Saldo, saques e extrato." actions={<Btn v="primary" icon="cash" onClick={() => setOpen(true)}>Solicitar saque</Btn>} />
    <Data q={q}>{(f) => (<>
      <div className="g3">
        <section className="balance-card"><small>Disponível para saque</small><span className="big">{mt(f.balance.available)}</span><small>Saque para carteira móvel sem custo</small></section>
        <Kpi label="A libertar" value={mt(f.balance.pending)} icon="clock" tone="warning" hint="Vendas dos últimos 2 dias (carteiras) e 14 dias (cartão, Apple Pay, Google Pay)" />
        <Kpi label="Reserva de segurança" value={mt(f.balance.reserve)} icon="shield" tone="info" hint={`${f.reservePercent}% das vendas, libertado ao fim de ${f.reserveDays} dias`} />
      </div>
      <div className="g-main">
        <Card title="Extrato" icon="receipt" flush aside={<Btn s="sm" v="ghost" icon="download" onClick={() => toast("Extrato de outubro exportado")}>Exportar</Btn>}>
          <Table dense rows={f.statement.items} rowKey={(r) => r.id} total={f.statement.total} per={f.statement.pageSize} cols={[
            { label: "Data", render: (r) => <span className="nowrap">{date(r.at)}</span> },
            { label: "Descrição", render: (r) => r.description },
            { label: "Valor", num: true, render: (r) => <b style={{ fontWeight: 600, color: r.amount < 0 ? "var(--danger)" : "var(--success)" }}>{r.amount < 0 ? "" : "+"}{mt(r.amount)}</b> },
          ]} />
        </Card>
        <div className="stack-sm" style={{ gap: 16 }}>
          <Card title="Contas de recebimento" icon="bank">
            {f.accounts.map((a) => <div key={a.id} className="offer-row"><span className={`pm pm-${a.kind}`}><i />{a.label}</span><div className="grow"><b className="mono" style={{ fontSize: 13 }}>{a.masked}</b><span className="faint" style={{ fontSize: 12 }}>{a.primary ? "Principal · " : ""}{a.fee ? mt(a.fee) : "grátis"} · {a.eta}</span></div></div>)}
            <Btn s="sm" icon="plus" onClick={() => toast("Nova conta adicionada para verificação", "", "info", "bank")}>Adicionar conta</Btn>
          </Card>
          <Card title="Prazos de libertação" icon="calendar" tone="info">
            <dl className="dl">{f.releaseRules.map((r) => <Fragment key={r.method}><dt><Method m={r.method} /></dt><dd>D+{r.days}</dd></Fragment>)}<dt>Reserva</dt><dd>{f.reservePercent}% · {f.reserveDays} dias</dd></dl>
            <p className="faint" style={{ fontSize: 12.5 }}>Taxa: {num(f.fee.percent, 1)}% + {f.fee.fixed} MT por venda aprovada. Antecipação disponível a partir de 500 mil MT/mês.</p>
          </Card>
        </div>
      </div>
      <Card title="Saques" icon="cash" flush>
        <Table dense rows={f.payouts} rowKey={(r) => r.id} cols={[
          { label: "Pedido", render: (r) => <span className="mono">{r.id}</span> },
          { label: "Data", render: (r) => date(r.requestedAt) },
          { label: "Destino", render: (r) => <Method m={r.destination} /> },
          { label: "Valor", num: true, render: (r) => mt(r.amount) },
          { label: "Estado", render: (r) => <Status s={r.status} /> },
        ]} />
      </Card>
      {open ? <WithdrawModal f={f} onClose={() => setOpen(false)} /> : null}
    </>)}</Data>
  </>);
}

export function Integrations() {
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["seller", "integrations"], queryFn: api.seller.integrations });
  return (<>
    <PageHead title="Integrações" desc="Pixels, mensagens e ligação ao seu sistema." />
    <Data q={q}>{(d) => (<>
      <div className="pgrid">{d.integrations.map((i) => (
        <div key={i.id} className="intg"><div className="row-between"><span className="intg-logo" style={{ ["--il" as string]: i.color }}>{i.letter}</span>{i.connected ? <Badge tone="success" dot>Ligado</Badge> : <Badge>Desligado</Badge>}</div>
          <b>{i.name}</b><p>{i.description}</p>
          <Btn s="sm" v={i.connected ? "secondary" : "primary"} onClick={() => toast(i.connected ? `${i.name} · definições abertas` : `${i.name} ligado`, "", i.connected ? "info" : "success", i.connected ? "sliders" : "checkc")}>{i.connected ? "Configurar" : "Ligar"}</Btn></div>
      ))}</div>
      <div className="g2">
        <Card title="Chaves da API" icon="key">
          <p className="muted">Use para criar cobranças, consultar vendas e libertar acessos a partir do seu sistema.</p>
          {d.apiKeys.map((k) => <div key={k.id} className="apikey"><code>{k.masked}</code>{k.mode === "test" ? <Badge tone="info">Teste</Badge> : <><Btn s="sm" icon="copy" onClick={() => toast("Chave copiada", "Guarde-a num local seguro.", "success", "copy")}>Copiar</Btn><Btn s="sm" v="ghost" onClick={() => toast("Nova chave gerada", "A anterior deixa de funcionar em 24 h.", "warning", "key")}>Gerar nova</Btn></>}</div>)}
        </Card>
        <Card title="Webhooks" icon="code" flush aside={<Btn s="sm" icon="plus" onClick={() => toast("Webhook adicionado")}>Adicionar</Btn>}>
          <Table dense rows={d.webhooks} rowKey={(r) => r.id} cols={[
            { label: "URL", render: (r) => <span className="mono">{r.url}</span> },
            { label: "Eventos", render: (r) => r.events.join(", ") },
            { label: "Última entrega", render: (r) => <><Badge tone="success">{r.lastDelivery.status}</Badge> {date(r.lastDelivery.at)}</> },
          ]} />
        </Card>
      </div>
    </>)}</Data>
  </>);
}

type AcTab = "perfil" | "verificacao" | "notificacoes" | "seguranca" | "equipa";
export function Account() {
  const { toast } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as AcTab) || "perfil";
  const q = useQuery({ queryKey: ["seller", "account"], queryFn: api.seller.account });
  const save = useMutation({ mutationFn: (p: AccountT["profile"]) => api.seller.saveProfile(p), onSuccess: () => toast("Perfil guardado") });
  return (<>
    <PageHead title="Definições da conta" desc="Perfil, verificação, notificações e equipa." />
    <Data q={q}>{(a) => (<>
      <Tabs value={tab} onChange={(t) => setParams(t === "perfil" ? {} : { tab: t }, { replace: true })} items={[["perfil", "Perfil"], ["verificacao", "Verificação"], ["notificacoes", "Notificações"], ["seguranca", "Segurança"], ["equipa", "Equipa", a.team.length]]} />
      {tab === "perfil" ? (
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); save.mutate({ businessName: String(f.get("b")), supportEmail: String(f.get("e")), supportWhatsapp: String(f.get("w")), website: String(f.get("s")) }); }}>
          <Card title="Perfil público" foot={<div className="row" style={{ justifyContent: "flex-end" }}><Btn v="primary" type="submit" loading={save.isPending}>Guardar</Btn></div>}>
            <div className="row" style={{ gap: 16 }}><Avatar name="Ana Sitoe" s="xl" /><div className="stack-xs"><label className="ad-btn ad-btn-secondary ad-btn-sm"><Icon name="upload" size={16} /><span>Alterar foto</span><input type="file" accept="image/*" className="sr-only" onChange={() => toast("Foto atualizada")} /></label><span className="faint" style={{ fontSize: 12 }}>Aparece no checkout e na área de membros.</span></div></div>
            <div className="g2">
              <Field label="Nome comercial" htmlFor="ac-b"><Input id="ac-b" name="b" defaultValue={a.profile.businessName} /></Field>
              <Field label="Email de suporte" htmlFor="ac-e"><Input id="ac-e" name="e" type="email" defaultValue={a.profile.supportEmail} /></Field>
              <Field label="WhatsApp de suporte" htmlFor="ac-w"><Input id="ac-w" name="w" prefix="+258" defaultValue={a.profile.supportWhatsapp} /></Field>
              <Field label="Site" htmlFor="ac-s"><Input id="ac-s" name="s" defaultValue={a.profile.website} /></Field>
            </div>
          </Card>
        </form>
      ) : null}
      {tab === "verificacao" ? (<>
        <Alert tone="success" icon="shield" title="Identidade verificada" text={`Nível ${a.verification.level} · sem limite mensal de vendas.`} />
        <Card title="Documentos"><Timeline items={a.verification.documents.map((d) => ({ title: d.label, sub: d.note, tone: d.status === "approved" ? "success" : "neutral", icon: d.status === "approved" ? "check" : "info" }))} /></Card>
        <Card title="Limites"><dl className="dl">{a.verification.limits.map((l) => <Fragment key={l.label}><dt>{l.label}</dt><dd>{l.value}</dd></Fragment>)}</dl></Card>
      </>) : null}
      {tab === "notificacoes" ? <Card title="Notificações">{a.notifications.map((n) => <div key={n.key} className="setting"><div><b>{n.label}</b><small>{n.channel}</small></div><Switch defaultChecked={n.enabled} label={n.label} /></div>)}</Card> : null}
      {tab === "seguranca" ? (
        <Card title="Segurança">
          <div className="setting"><div><b>Verificação em dois passos</b><small>Código por SMS para entrar e para cada saque</small></div><Switch defaultChecked={a.security.twoFactor} label="Verificação em dois passos" /></div>
          <div className="setting"><div><b>Confirmar saques acima de 100 000 MT por email</b><small>Recomendado</small></div><Switch defaultChecked={a.security.confirmLargePayouts} label="Confirmar saques grandes" /></div>
          <Table dense rows={a.security.sessions} rowKey={(r) => r.device} cols={[{ label: "Sessão", render: (r) => r.device }, { label: "Local", render: (r) => r.city }, { label: "Último acesso", render: (r) => r.lastSeen }]} />
        </Card>
      ) : null}
      {tab === "equipa" ? (
        <Card title="Equipa" flush aside={<Btn s="sm" v="primary" icon="plus" onClick={() => toast("Convite enviado", "", "success", "send")}>Convidar</Btn>}>
          <Table rows={a.team} rowKey={(r) => r.id} cols={[{ label: "Membro", render: (r) => <CellUser name={r.name} sub={r.email} /> }, { label: "Função", render: (r) => <Badge tone={r.role === "Dona da conta" ? "primary" : "neutral"}>{r.role}</Badge> }, { label: "Acesso", render: (r) => r.access }]} />
        </Card>
      ) : null}
    </>)}</Data>
  </>);
}
