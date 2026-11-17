import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import { useApp } from "@/lib/app-state";
import { Alert, Btn, Field, Input } from "@/components/ui";
import { Logo } from "@/layouts/Shells";

const home = (role: "seller" | "student" | "admin") => role === "seller" ? "/produtor" : role === "admin" ? "/admin" : "/aluno";
const message = (error: unknown) => error instanceof HttpError ? error.message : "Não foi possível concluir. Verifique a ligação e tente novamente.";
const safeNext = (params: URLSearchParams, fallback: string) => {
  const next = params.get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : fallback;
};
const normalizeMSISDN = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 9 ? `+258${digits}` : `+${digits}`;
};

function AuthFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return <main className="auth"><section className="auth-main"><Logo /><div className="auth-form"><h1>{title}</h1>{children}</div></section></main>;
}

export function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => api.auth.login({ email, password }),
    onSuccess: session => {
      signIn(session);
      navigate(safeNext(params, home(session.user.role)), { replace: true });
    },
  });

  return <AuthFrame title="Entrar">
    <form className="stack-sm" onSubmit={event => { event.preventDefault(); login.mutate(); }}>
      <Field label="Email" htmlFor="login-email"><Input id="login-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></Field>
      <Field label="Palavra-passe" htmlFor="login-password"><Input id="login-password" type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" /></Field>
      {login.isError && <Alert tone="danger" title="Não foi possível entrar" text={message(login.error)} />}
      <Btn type="submit" v="primary" block loading={login.isPending}>Entrar</Btn>
      <p className="muted">Ainda não tem conta? <Link to="/criar-conta">Criar conta</Link></p>
      <p className="muted">É membro da equipa VendAqui? <Link to="/admin/entrar">Entrar no backoffice</Link></p>
    </form>
  </AuthFrame>;
}

export function Register() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", msisdn: "", password: "" });
  const register = useMutation({
    mutationFn: () => api.auth.register({ ...form, msisdn: normalizeMSISDN(form.msisdn) }),
    onSuccess: session => {
      signIn(session);
      navigate(safeNext(params, "/aluno"), { replace: true });
    },
  });
  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [field]: event.target.value }));
  const invalidField = register.error instanceof HttpError ? register.error.body.details?.field : undefined;

  return <AuthFrame title="Criar conta">
    <form className="stack-sm" onSubmit={event => { event.preventDefault(); register.mutate(); }}>
      <Field label="Nome completo" htmlFor="register-name"><Input id="register-name" value={form.name} onChange={set("name")} required autoComplete="name" aria-invalid={invalidField === "name"} /></Field>
      <Field label="Email" htmlFor="register-email"><Input id="register-email" type="email" value={form.email} onChange={set("email")} required autoComplete="email" aria-invalid={invalidField === "email"} /></Field>
      <Field label="Telemóvel" help="Use um número moçambicano. Pode escrever com ou sem +258." htmlFor="register-phone"><Input id="register-phone" type="tel" value={form.msisdn} onChange={set("msisdn")} required autoComplete="tel" aria-invalid={invalidField === "msisdn"} /></Field>
      <Field label="Palavra-passe" help="Entre 12 e 128 caracteres." htmlFor="register-password"><Input id="register-password" type="password" minLength={12} maxLength={128} value={form.password} onChange={set("password")} required autoComplete="new-password" aria-invalid={invalidField === "password"} /></Field>
      {register.isError && <Alert tone="danger" title="Não foi possível criar a conta" text={message(register.error)} />}
      <Btn type="submit" v="primary" block loading={register.isPending}>Criar conta</Btn>
      <p className="muted">Já tem conta? <Link to="/entrar">Entrar</Link></p>
    </form>
  </AuthFrame>;
}

export function AdminLogin() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => api.backofficeAuth.login({ email, password }),
    onSuccess: session => { signIn(session); navigate("/admin", { replace: true }); },
  });

  return <AuthFrame title="Backoffice VendAqui">
    <form className="stack-sm" onSubmit={event => { event.preventDefault(); login.mutate(); }}>
      <Field label="Email profissional" htmlFor="staff-email"><Input id="staff-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="username" /></Field>
      <Field label="Palavra-passe" htmlFor="staff-password"><Input id="staff-password" type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" /></Field>
      {login.isError && <Alert tone="danger" title="Não foi possível entrar no backoffice" text={message(login.error)} />}
      <Btn type="submit" v="primary" block loading={login.isPending}>Entrar no backoffice</Btn>
      <Link to="/entrar">Voltar ao login público</Link>
    </form>
  </AuthFrame>;
}
