import { useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import { useApp } from "@/lib/app-state";
import { Alert, Btn, Field, Input } from "@/components/ui";
import { Logo } from "@/layouts/Shells";

const home = (role: "seller" | "student" | "admin") =>
  role === "seller" ? "/produtor" : role === "admin" ? "/admin" : "/aluno";
const message = (error: unknown) =>
  error instanceof HttpError
    ? error.message
    : "Não foi possível concluir. Verifique a ligação e tente novamente.";
// Only same-origin paths: URL parsing also catches backslash and dot-segment spellings of "//host".
const safeNext = (params: URLSearchParams, fallback: string) => {
  const next = params.get("next");
  if (!next?.startsWith("/")) return fallback;
  const url = new URL(next, window.location.origin);
  if (url.origin !== window.location.origin || url.pathname.startsWith("//")) return fallback;
  return url.pathname + url.search + url.hash;
};
const normalizeMSISDN = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 9 ? `+258${digits}` : `+${digits}`;
};

const benefits = [
  [
    "01",
    "Checkout preparado para Moçambique",
    "Receba pagamentos por M-Pesa e e-Mola num fluxo pensado para telemóvel.",
  ],
  [
    "02",
    "Conteúdo entregue automaticamente",
    "Depois da confirmação, o comprador encontra o curso ou ebook na sua conta.",
  ],
  [
    "03",
    "Vendas e saldo no mesmo lugar",
    "Acompanhe encomendas, valores disponíveis e pedidos de saque no painel.",
  ],
] as const;

function AuthSide() {
  return (
    <aside className="auth-side" aria-label="Sobre o VendAqui">
      <div className="auth-side-content">
        <div className="auth-side-intro">
          <span className="auth-side-kicker">Venda digital em Moçambique</span>
          <h2>Da primeira venda à entrega do conteúdo, numa só plataforma.</h2>
          <p>
            Crie o produto, partilhe o checkout e acompanhe cada pagamento sem depender de processos
            manuais.
          </p>
        </div>
        <div className="auth-benefits">
          {benefits.map(([number, title, description]) => (
            <div className="auth-benefit" key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function AuthFrame({
  children,
  title,
  desc,
}: {
  children: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <main className="auth">
      <section className="auth-main">
        <header className="auth-head">
          <Logo />
        </header>
        <div className="auth-form">
          <div className="auth-form-intro">
            <h1>{title}</h1>
            <p>{desc}</p>
          </div>
          {children}
        </div>
      </section>
      <AuthSide />
    </main>
  );
}

export function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => api.auth.login({ email, password }),
    onSuccess: (session) => {
      signIn(session);
      navigate(safeNext(params, home(session.user.role)), { replace: true });
    },
  });

  return (
    <AuthFrame
      title="Bem-vindo de volta"
      desc="Entre para acompanhar as suas compras, produtos e vendas."
    >
      <form
        className="auth-fields"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate();
        }}
      >
        <Field label="Email" htmlFor="login-email">
          <Input
            id="login-email"
            s="lg"
            icon="mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Palavra-passe" htmlFor="login-password">
          <Input
            id="login-password"
            s="lg"
            icon="lock"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        {login.isError && (
          <Alert tone="danger" title="Não foi possível entrar" text={message(login.error)} />
        )}
        <Btn type="submit" v="primary" s="lg" block loading={login.isPending}>
          Entrar
        </Btn>
        <div className="auth-links">
          <p>
            Ainda não tem conta? <Link to="/criar-conta">Criar conta</Link>
          </p>
          <p>
            É membro da equipa VendAqui? <Link to="/admin/entrar">Entrar no backoffice</Link>
          </p>
        </div>
      </form>
    </AuthFrame>
  );
}

export function Register() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", msisdn: "", password: "" });
  const register = useMutation({
    mutationFn: () => api.auth.register({ ...form, msisdn: normalizeMSISDN(form.msisdn) }),
    onSuccess: (session) => {
      signIn(session);
      navigate(safeNext(params, "/aluno"), { replace: true });
    },
  });
  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));
  const invalidField =
    register.error instanceof HttpError ? register.error.body.details?.field : undefined;

  return (
    <AuthFrame
      title="Crie a sua conta"
      desc="Comece gratuitamente e configure o seu perfil quando estiver pronto para vender."
    >
      <form
        className="auth-fields"
        onSubmit={(event) => {
          event.preventDefault();
          register.mutate();
        }}
      >
        <Field label="Nome completo" htmlFor="register-name">
          <Input
            id="register-name"
            s="lg"
            icon="user"
            value={form.name}
            onChange={set("name")}
            required
            autoComplete="name"
            aria-invalid={invalidField === "name"}
          />
        </Field>
        <Field label="Email" htmlFor="register-email">
          <Input
            id="register-email"
            s="lg"
            icon="mail"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            autoComplete="email"
            aria-invalid={invalidField === "email"}
          />
        </Field>
        <Field label="Telemóvel" htmlFor="register-phone">
          <Input
            id="register-phone"
            s="lg"
            icon="phone"
            type="tel"
            value={form.msisdn}
            onChange={set("msisdn")}
            required
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={invalidField === "msisdn"}
          />
        </Field>
        <Field label="Palavra-passe" help="Entre 12 e 128 caracteres." htmlFor="register-password">
          <Input
            id="register-password"
            s="lg"
            icon="lock"
            type="password"
            minLength={12}
            maxLength={128}
            value={form.password}
            onChange={set("password")}
            required
            autoComplete="new-password"
            aria-invalid={invalidField === "password"}
          />
        </Field>
        {register.isError && (
          <Alert
            tone="danger"
            title="Não foi possível criar a conta"
            text={message(register.error)}
          />
        )}
        <Btn type="submit" v="primary" s="lg" block loading={register.isPending}>
          Criar conta
        </Btn>
        <div className="auth-links">
          <p>
            Já tem conta? <Link to="/entrar">Entrar</Link>
          </p>
        </div>
      </form>
    </AuthFrame>
  );
}

export function AdminLogin() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => api.backofficeAuth.login({ email, password }),
    onSuccess: (session) => {
      signIn(session);
      navigate("/admin", { replace: true });
    },
  });

  return (
    <AuthFrame
      title="Backoffice VendAqui"
      desc="Acesso reservado à equipa de operação da plataforma."
    >
      <form
        className="auth-fields"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate();
        }}
      >
        <Field label="Email profissional" htmlFor="staff-email">
          <Input
            id="staff-email"
            s="lg"
            icon="mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
          />
        </Field>
        <Field label="Palavra-passe" htmlFor="staff-password">
          <Input
            id="staff-password"
            s="lg"
            icon="lock"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        {login.isError && (
          <Alert
            tone="danger"
            title="Não foi possível entrar no backoffice"
            text={message(login.error)}
          />
        )}
        <Btn type="submit" v="primary" s="lg" block loading={login.isPending}>
          Entrar no backoffice
        </Btn>
        <div className="auth-links">
          <p>
            <Link to="/entrar">Voltar ao login público</Link>
          </p>
        </div>
      </form>
    </AuthFrame>
  );
}
