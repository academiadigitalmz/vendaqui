import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { Course, Purchase } from "@/api/types";
import { Icon, type IconName } from "@/lib/icons";
import { dateLong, mt } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { Alert, Btn, Card, Cover, Field, Method, Meter, PageHead, Select, Status, Table, Tabs, Textarea } from "@/components/ui";
import { Data } from "@/components/Data";
import { Modal } from "@/components/overlay";

const typeIcon: Record<string, IconName> = { course: "cap", ebook: "book", subscription: "repeat", mentoring: "users", event: "ticket" };
const typeLabel: Record<string, string> = { course: "Curso online", ebook: "Ebook", subscription: "Assinatura", mentoring: "Mentoria", event: "Evento" };
const lessons = (c: Course) => c.modules.flatMap((m, mi) => m.lessons.map((l, li) => ({ ...l, module: m, mi, li })));

function Progress({ label, value, color = "var(--primary)", light }: { label: string; value: number; color?: string; light?: boolean }) {
  return (
    <div className="ad-progress ad-progress-sm">
      <div className="ad-progress-top" style={light ? { color: "var(--inv-text-2)" } : undefined}><span>{label}</span><strong style={light ? { color: "var(--inv-text-2)" } : undefined}>{value}%</strong></div>
      <div className="ad-progress-track"><div className="ad-progress-fill" style={{ width: `${value}%`, background: color }} /></div>
    </div>
  );
}

export function Library() {
  const nav = useNavigate();
  const lib = useQuery({ queryKey: ["student", "library"], queryFn: api.student.library });
  const course = useQuery({ queryKey: ["student", "course", "p1"], queryFn: () => api.student.course("p1") });
  return (
    <Data q={lib}>{(d) => {
      const all = course.data ? lessons(course.data) : [];
      const next = all.find((l) => !l.done) ?? all[0];
      const main = d.items[0];
      return (<>
        <div className="stack-xs"><h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Olá, {d.studentName.split(" ")[0]}</h1><p className="muted">Continue de onde parou.{course.data?.progress ? ` Faltam ${course.data.progress.total - course.data.progress.done} aulas para o certificado.` : ""}</p></div>
        {next ? (
          <section className="stu-continue">
            <div className="stu-continue-vid"><div className="video-slide"><small>Módulo {next.mi + 1} · Aula {next.li + 1}</small><b>{next.title}</b></div><button className="playbtn" aria-label="Continuar aula" onClick={() => nav(`/aluno/aulas/${next.id}`)}><Icon name="play" size={26} /></button></div>
            <div className="stu-continue-body"><small>Continuar a ver</small><h2>{main.name}</h2><p style={{ color: "var(--inv-text-2)" }}>Próxima aula: {next.title} · {next.duration}</p>
              <Progress label="Progresso do curso" value={main.progress} color="var(--inv-accent)" light />
              <div><Btn v="primary" icon="play" to={`/aluno/aulas/${next.id}`}>Continuar</Btn></div></div>
          </section>
        ) : null}
        <div className="row-between"><h2 className="section-title">Os meus produtos</h2><span className="faint" style={{ fontSize: 13 }}>{d.items.length} produtos de Excel com a Ana</span></div>
        <div className="pgrid">{d.items.map((p) => (
          <button key={p.productId} className="pcard" onClick={() => p.type === "course" && next ? nav(`/aluno/aulas/${next.id}`) : undefined}>
            <div className={`pcard-head cv-${p.cover}`}><span className="pcard-type"><Icon name={typeIcon[p.type]} size={14} />{typeLabel[p.type]}</span><h4>{p.name}</h4></div>
            <div className="pcard-body"><span className="faint" style={{ fontSize: 13 }}>{p.subtitle}</span><Progress label={p.progress === 100 ? "Concluído" : "Progresso"} value={p.progress} color={p.progress === 100 ? "var(--success)" : "var(--primary)"} /></div>
          </button>
        ))}</div>
        {d.recommended ? (<>
          <h2 className="section-title">Recomendado pela Ana</h2>
          <div className="offer-row"><Cover cover="blue" icon="cap" lg /><div className="grow"><b>{d.recommended.name}</b><span className="faint" style={{ fontSize: 13 }}>{d.recommended.note}</span></div><div className="stack-xs" style={{ alignItems: "flex-end" }}><span className="price-old">{mt(d.recommended.originalPrice)}</span><b style={{ fontSize: 18 }}>{mt(d.recommended.price)}</b></div><Btn v="primary" to={`/checkout/${d.recommended.slug}`}>Ver oferta</Btn></div>
        </>) : null}
      </>);
    }}</Data>
  );
}

export function Lesson() {
  const { lessonId = "m1l1" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast } = useApp();
  const [tab, setTab] = useState<"d" | "m" | "c">("d");
  const q = useQuery({ queryKey: ["student", "course", "p1"], queryFn: () => api.student.course("p1") });
  const mark = useMutation({
    mutationFn: (done: boolean) => api.student.setLessonDone(lessonId, done),
    onSuccess: (c, done) => { qc.setQueryData(["student", "course", "p1"], c); qc.invalidateQueries({ queryKey: ["student", "library"] }); if (done) toast("Aula concluída", `Progresso do curso: ${c.progress?.percent}%`); },
  });
  return (
    <Data q={q}>{(c) => {
      const all = lessons(c);
      const idx = Math.max(0, all.findIndex((l) => l.id === lessonId));
      const cur = all[idx];
      const pr = c.progress!;
      return (<>
        <Btn v="ghost" s="sm" icon="arrowl" to="/aluno" className="self-start">Os meus produtos</Btn>
        <div className="player">
          <div className="stack-sm" style={{ gap: 16 }}>
            <div className="video"><div className="video-slide"><small>Módulo {cur.mi + 1} · {cur.module.title}</small><b>{cur.title}</b></div><button className="playbtn" aria-label="Reproduzir" style={{ position: "relative" }} onClick={() => toast("Reprodução iniciada", "", "info", "play")}><Icon name="play" size={26} /></button><div className="video-bar"><Icon name="play" size={14} /><span>00:00</span><Meter value={0} /><span>{cur.duration}</span></div></div>
            <div className="row-between">
              <div className="stack-xs"><span className="faint" style={{ fontSize: 13 }}>Aula {idx + 1} de {all.length}</span><h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em" }}>{cur.title}</h1></div>
              <div className="row" style={{ gap: 8 }}>
                <Btn v={cur.done ? "soft" : "secondary"} icon={cur.done ? "checkc" : "check"} loading={mark.isPending} onClick={() => mark.mutate(!cur.done)}>{cur.done ? "Concluída" : "Marcar como concluída"}</Btn>
                {idx < all.length - 1 ? <Btn v="primary" iconRight="right" to={`/aluno/aulas/${all[idx + 1].id}`}>Próxima aula</Btn> : null}
              </div>
            </div>
            <Tabs items={[["d", "Descrição"], ["m", "Materiais", 2], ["c", "Comentários", 14]]} value={tab} onChange={setTab} />
            {tab === "d" ? <p className="muted" style={{ maxWidth: "68ch", lineHeight: "22px" }}>Nesta aula vemos {cur.title.toLowerCase()} com uma folha de vendas real de uma loja em Maputo. Descarregue o ficheiro de exercícios nos materiais e acompanhe passo a passo.</p> : null}
            {tab === "m" ? <div className="row" style={{ gap: 8 }}><Btn s="sm" icon="download" onClick={() => toast("Ficheiro de exercícios descarregado")}>exercicios-aula-{idx + 1}.xlsx</Btn><Btn s="sm" icon="file" onClick={() => toast("Resumo descarregado")}>resumo.pdf</Btn></div> : null}
            {tab === "c" ? <div className="stack-sm"><Field label="Pergunta para a Ana" htmlFor="ls-q"><Textarea id="ls-q" placeholder="Escreva a sua dúvida sobre esta aula" /></Field><div><Btn v="primary" icon="send" onClick={() => toast("Pergunta enviada", "Recebe uma notificação quando a Ana responder.", "info", "msg")}>Enviar pergunta</Btn></div></div> : null}
          </div>
          <aside className="stack-sm">
            <Card title="Conteúdo do curso" icon="book">
              <Progress label={`${pr.done} de ${pr.total} aulas`} value={pr.percent} />
              {c.modules.map((m, mi) => (
                <div className="module" key={m.id}>
                  <div className="module-head">{mi + 1}. {m.title}<small>{m.lessons.filter((l) => l.done).length}/{m.lessons.length}</small></div>
                  {m.lessons.map((l) => (
                    <button key={l.id} className={`lesson ${l.id === cur.id ? "on" : ""}`} onClick={() => nav(`/aluno/aulas/${l.id}`)}>
                      <Icon name={l.done ? "checkc" : l.id === cur.id ? "play" : "video"} size={16} className={l.done ? "pl-success" : ""} /><span>{l.title}</span>
                    </button>
                  ))}
                </div>
              ))}
            </Card>
          </aside>
        </div>
      </>);
    }}</Data>
  );
}

export function Purchases() {
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["student", "purchases"], queryFn: api.student.purchases });
  const [refund, setRefund] = useState<Purchase | null>(null);
  const [reason, setReason] = useState("O conteúdo não era o que esperava");
  const [msg, setMsg] = useState("");
  const send = useMutation({ mutationFn: () => api.student.requestRefund(refund!.id, { reason, message: msg }), onSuccess: () => { setRefund(null); toast("Pedido de reembolso enviado", "Recebe uma resposta por email em até 48 horas.", "info", "info"); } });
  return (<>
    <PageHead title="Compras" desc="Recibos, faturas e pedidos de reembolso." />
    <Data q={q}>{(rows) => (<>
      <Card flush>
        <Table rows={rows} rowKey={(r) => r.id} cols={[
          { label: "Pedido", render: (r) => <span className="mono">{r.orderId}</span> },
          { label: "Produto", render: (r) => <b style={{ fontWeight: 500 }}>{r.productName}</b> },
          { label: "Data", render: (r) => dateLong(r.date) },
          { label: "Método", render: (r) => <Method m={r.method} /> },
          { label: "Valor", num: true, render: (r) => mt(r.amount) },
          { label: "Estado", render: (r) => <Status s={r.status} /> },
          { label: "", num: true, render: (r) => <div className="row" style={{ gap: 4, justifyContent: "flex-end", flexWrap: "nowrap" }}><Btn s="sm" v="ghost" icon="download" onClick={() => toast(`Fatura ${r.orderId} descarregada`)}>Fatura</Btn>{r.refundableUntil ? <Btn s="sm" v="ghost" icon="refund" onClick={() => setRefund(r)}>Reembolso</Btn> : null}</div> },
        ]} />
      </Card>
      {rows.some((r) => r.refundableUntil) ? <Alert tone="success" icon="shield" title={`Garantia ativa até ${dateLong(rows.find((r) => r.refundableUntil)!.refundableUntil!)}`} text="Pode pedir o reembolso do curso de Excel sem justificação. O valor volta para o meio de pagamento usado na compra." /> : null}
    </>)}</Data>
    {refund ? (
      <Modal title="Pedir reembolso" desc={refund.productName} onClose={() => setRefund(null)} foot={<><Btn onClick={() => setRefund(null)}>Cancelar</Btn><Btn v="danger" loading={send.isPending} onClick={() => send.mutate()}>Pedir reembolso</Btn></>}>
        <Field label="Motivo" htmlFor="rf-why"><Select id="rf-why" value={reason} onChange={(e) => setReason(e.target.value)} options={["O conteúdo não era o que esperava", "Comprei por engano", "Problemas técnicos no acesso", "Outro motivo"]} /></Field>
        <Field label="Comentário para a Ana (opcional)" htmlFor="rf-msg"><Textarea id="rf-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ajude o produtor a melhorar" /></Field>
        <Alert tone="warning" icon="alert" title="O acesso ao curso termina quando o reembolso for aprovado" />
      </Modal>
    ) : null}
  </>);
}
