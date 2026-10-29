import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import type { PayoutDestinationKind, Role } from "@/api/types";
import { Icon } from "@/lib/icons";
import { useApp, demoSession } from "@/lib/app-state";
import { DEMO_USERS } from "@/lib/demo-users";
import { Alert, Btn, Checkbox, Field, Input, Select } from "@/components/ui";
import { Logo } from "@/layouts/Shells";

const HOME: Record<Role, string> = { seller: "/produtor", admin: "/admin", student: "/aluno" };

function AuthSide() {
  return (
    <aside className="auth-side">
      <h2>A plataforma de quem vende conhecimento em Moçambique.</h2>
      <div className="stack-sm">
        {([["cart", "Checkout com M-Pesa, e-Mola, cartão, Apple Pay e Google Pay", "O comprador paga em segundos, sem sair do telemóvel."], ["cap", "Área de membros incluída", "Aulas, materiais e certificados no mesmo lugar."], ["cash", "Saque para M-Pesa em menos de 1 minuto", "Sem custo, a qualquer hora."]] as const).map(([i, t, d]) => (
          <div key={t} className="ad-feature"><span className="ad-feature-icon"><Icon name={i} size={16} /></span><div><div className="ad-feature-title">{t}</div><div className="ad-feature-desc">{d}</div></div></div>
        ))}
      </div>
      <div className="row" style={{ gap: 28 }}>
        {[["3 400+", "produtores ativos"], ["412 mil", "compras em 2026"], ["98,1%", "aprovação M-Pesa"]].map(([a, b]) => <div key={b}><b style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{a}</b><div style={{ fontSize: 13, color: "var(--inv-text-2)" }}>{b}</div></div>)}
      </div>
    </aside>
  );
}

export function Login() {
  const { signIn, toast } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("ana@excelcomaana.co.mz");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => api.auth.login({ email, password }),
    onSuccess: (s) => { signIn(s); nav(params.get("next") || HOME[s.user.role]); },
  });
  const demo = (r: Role) => { signIn(demoSession(r, DEMO_USERS)); nav(HOME[r]); };
  return (
    <div className="auth"><div className="auth-main"><div><Logo /></div>
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); login.mutate(); }}>
        <div className="stack-xs"><h1>Bem-vindo de volta</h1><p className="muted">Entre na sua conta para ver as vendas de hoje.</p></div>
        {login.isError ? <Alert tone="danger" icon="alert" title="Não foi possível entrar" text={login.error instanceof HttpError ? login.error.message : "Verifique o email e a palavra-passe."} /> : null}
        <Field label="Email" htmlFor="li-email"><Input id="li-email" type="email" s="lg" icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
        <Field label="Palavra-passe" htmlFor="li-pass" aside={<button type="button" className="ad-link ad-btn-link" onClick={() => toast("Enviámos um link de recuperação para o seu email", "", "info", "mail")}>Esqueceu-se?</button>}>
          <Input id="li-pass" type="password" s="lg" icon="lock" placeholder="A sua palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <Checkbox label="Manter sessão iniciada neste dispositivo" defaultChecked />
        <Btn v="primary" s="lg" type="submit" block loading={login.isPending}>Entrar</Btn>
        <div className="or">ou entrar como demonstração</div>
        <div className="row" style={{ gap: 8 }}><Btn s="sm" icon="store" onClick={() => demo("seller")}>Produtor</Btn><Btn s="sm" icon="cap" onClick={() => demo("student")}>Aluno</Btn><Btn s="sm" icon="shield" onClick={() => demo("admin")}>Administrador</Btn></div>
        <p className="muted" style={{ textAlign: "center" }}>Ainda não vende no VendAqui? <Link className="ad-btn-link" to="/criar-conta">Criar conta grátis</Link></p>
      </form>
    </div><AuthSide /></div>
  );
}

const STEPS = ["Conta", "Negócio", "Identidade", "Recebimentos"];
export function Register() {
  const { signIn, toast } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "Ana Sitoe", email: "ana@excelcomaana.co.mz", phone: "84 312 4471", password: "", kind: "individual" as "individual" | "company", businessName: "Excel com a Ana", nuit: "400 128 765", category: "Cursos e formações", payoutMethod: "mpesa" as PayoutDestinationKind, payoutPhone: "84 312 4471" });
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const reg = useMutation({
    mutationFn: () => api.auth.register({ ...f, nuit: f.nuit.replace(/\s/g, "") }),
    onSuccess: (s) => { signIn(s); nav("/produtor"); toast("Conta criada", "Os seus documentos estão em análise. Já pode criar produtos.", "info", "info"); },
    onError: (e) => toast("Não foi possível criar a conta", e instanceof HttpError ? e.message : "Tente outra vez.", "danger", "alert"),
  });
  const docsOk = Object.values(docs).filter(Boolean).length >= 3;

  return (
    <div className="auth"><div className="auth-main">
      <div className="row-between"><Logo /><span className="faint" style={{ fontSize: 13 }}>Passo {step + 1} de 4 · {STEPS[step]}</span></div>
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); step < 3 ? setStep(step + 1) : reg.mutate(); }}>
        <div className="stepper">{STEPS.map((s, i) => <i key={s} className={i <= step ? "on" : ""} />)}</div>
        {step === 0 ? (<>
          <div className="stack-xs"><h1>Crie a sua conta</h1><p className="muted">Grátis. Só paga quando vende.</p></div>
          <Field label="Nome completo" htmlFor="ob-name"><Input id="ob-name" s="lg" value={f.name} onChange={set("name")} required autoComplete="name" /></Field>
          <Field label="Email" htmlFor="ob-email"><Input id="ob-email" s="lg" type="email" value={f.email} onChange={set("email")} required autoComplete="email" /></Field>
          <Field label="Telemóvel" htmlFor="ob-phone" help="Enviamos um código por SMS para confirmar."><Input id="ob-phone" s="lg" type="tel" prefix="+258" value={f.phone} onChange={set("phone")} required /></Field>
          <Field label="Palavra-passe" htmlFor="ob-pass"><Input id="ob-pass" s="lg" type="password" placeholder="Mínimo 8 caracteres" value={f.password} onChange={set("password")} autoComplete="new-password" /></Field>
        </>) : null}
        {step === 1 ? (<>
          <div className="stack-xs"><h1>Sobre o seu negócio</h1><p className="muted">Usamos estes dados na fatura que o comprador recebe.</p></div>
          <div className="choice-grid">{([["individual", "Pessoa singular", "Vende com o seu BI e NUIT pessoal", "user"], ["company", "Empresa", "Tem NUIT de empresa e certidão comercial", "store"]] as const).map(([k, t, d, i]) => (
            <button key={k} type="button" className={`choice ${f.kind === k ? "on" : ""}`} onClick={() => setF({ ...f, kind: k })}><Icon name={i} size={20} /><b>{t}</b><small>{d}</small></button>
          ))}</div>
          <Field label="Nome comercial" htmlFor="ob-brand" help="Aparece no checkout e no extrato do comprador."><Input id="ob-brand" s="lg" value={f.businessName} onChange={set("businessName")} required /></Field>
          <Field label="NUIT" htmlFor="ob-nuit" help="9 dígitos. Está no cartão de contribuinte."><Input id="ob-nuit" s="lg" value={f.nuit} onChange={set("nuit")} inputMode="numeric" required /></Field>
          <Field label="O que vai vender?" htmlFor="ob-cat"><Select id="ob-cat" s="lg" value={f.category} onChange={set("category")} options={["Cursos e formações", "Ebooks e ficheiros", "Mentorias e consultoria", "Comunidades e assinaturas", "Eventos e bilhetes"]} /></Field>
        </>) : null}
        {step === 2 ? (<>
          <div className="stack-xs"><h1>Verifique a sua identidade</h1><p className="muted">Exigido pelo Banco de Moçambique para receber pagamentos. A análise demora até 24 horas.</p></div>
          <div className="docslots">{[["bi1", "BI · frente"], ["bi2", "BI · verso"], ["selfie", "Selfie com o BI"], ["nuit", "Cartão NUIT"]].map(([k, l]) => (
            <label key={k} className={`docslot ${docs[k] ? "ok" : ""}`}>
              <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setDocs({ ...docs, [k]: !!e.target.files?.length })} />
              <Icon name={docs[k] ? "checkc" : "upload"} size={22} /><span>{docs[k] ? `${l} enviado` : l}</span>
            </label>
          ))}</div>
          <Alert title="Dicas para aprovar à primeira" text="Fotografe com boa luz, sem reflexos, e com os quatro cantos do documento visíveis." />
          {!docsOk ? <Btn v="link" onClick={() => setDocs({ bi1: true, bi2: true, selfie: true, nuit: true })}>Usar documentos de exemplo (demonstração)</Btn> : null}
        </>) : null}
        {step === 3 ? (<>
          <div className="stack-xs"><h1>Onde quer receber?</h1><p className="muted">Pode mudar quando quiser em Financeiro.</p></div>
          <div className="choice-grid">{([["mpesa", "M-Pesa", "Saque em segundos, sem custo"], ["emola", "e-Mola", "Saque em segundos, sem custo"], ["bank", "Conta bancária", "1 dia útil · 25 MT por saque"]] as const).map(([k, t, d]) => (
            <button key={k} type="button" className={`choice ${f.payoutMethod === k ? "on" : ""}`} onClick={() => setF({ ...f, payoutMethod: k })}><span className={`pm pm-${k}`}><i />{t}</span><small>{d}</small></button>
          ))}</div>
          {f.payoutMethod === "bank" ? <Field label="NIB" htmlFor="ob-nib"><Input id="ob-nib" s="lg" placeholder="0000 0000 0000 0000 0000 0" /></Field>
            : <Field label={`Número ${f.payoutMethod === "mpesa" ? "M-Pesa" : "e-Mola"}`} htmlFor="ob-wallet" help={`Tem de estar em nome de ${f.name}.`}><Input id="ob-wallet" s="lg" type="tel" prefix="+258" value={f.payoutPhone} onChange={set("payoutPhone")} /></Field>}
        </>) : null}
        <div className="row" style={{ gap: 8 }}>
          {step > 0 ? <Btn icon="arrowl" onClick={() => setStep(step - 1)}>Voltar</Btn> : null}
          <Btn v="primary" s="lg" type="submit" className="grow" disabled={step === 2 && !docsOk} loading={reg.isPending}>{step < 3 ? "Continuar" : "Concluir e ir para o painel"}</Btn>
        </div>
        {step === 0 ? <p className="muted" style={{ textAlign: "center" }}>Já tem conta? <Link className="ad-btn-link" to="/entrar">Entrar</Link></p> : null}
      </form>
    </div><AuthSide /></div>
  );
}
