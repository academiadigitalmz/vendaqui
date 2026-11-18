import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useMatches,
  useNavigate,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { Role } from "@/api/types";
import { Icon, Mark, type IconName } from "@/lib/icons";
import { useApp, SKINS } from "@/lib/app-state";
import { Avatar, Btn, ErrorState, IconBtn, Loading } from "@/components/ui";
import { NotificationBell } from "@/components/Notifications";

export function Logo({ sub, to = "/" }: { sub?: string; to?: string }) {
  return (
    <Link className="vq-logo" to={to} aria-label="VendAqui — início">
      <span className="vq-mark">
        <Mark size={18} />
      </span>
      <span className="vq-brandtext">
        <span className="vq-brandname">
          Vend<b>Aqui</b>
        </span>
        {sub && <span className="vq-brandsub">{sub}</span>}
      </span>
    </Link>
  );
}

export const usePageTitle = () => {
  const matches = useMatches();
  const match = [...matches]
    .reverse()
    .find((item) => (item.handle as { title?: string } | undefined)?.title);
  return (match?.handle as { title?: string } | undefined)?.title ?? "";
};

function useDocumentTitle() {
  const title = usePageTitle();
  useEffect(() => {
    document.title = `${title ? `${title} · ` : ""}VendAqui`;
  }, [title]);
}

export function RequireUser({ children }: { children: ReactNode }) {
  const { session, authReady } = useApp();
  const location = useLocation();
  if (!authReady)
    return (
      <main className="lp-wrap" style={{ paddingBlock: 40 }}>
        A restaurar a sessão…
      </main>
    );
  if (!session || session.user.role === "admin")
    return <Navigate to={`/entrar?next=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, authReady } = useApp();
  const location = useLocation();
  if (!authReady)
    return (
      <main className="lp-wrap" style={{ paddingBlock: 40 }}>
        A restaurar a sessão…
      </main>
    );
  if (session?.user.role === role) return <>{children}</>;
  const login = role === "admin" ? "/admin/entrar" : "/entrar";
  return <Navigate to={`${login}?next=${encodeURIComponent(location.pathname)}`} replace />;
}

export function RequireSeller({ children }: { children: ReactNode }) {
  const { session, authReady } = useApp();
  const location = useLocation();
  const hasSellerProfile = session?.user.role === "seller";
  const verification = useQuery({
    queryKey: ["seller", "verification"],
    queryFn: api.seller.verification,
    enabled: authReady && hasSellerProfile,
    refetchInterval: (query) =>
      query.state.data?.verification.status === "approved" ? false : 15_000,
  });
  if (!authReady)
    return (
      <main className="lp-wrap" style={{ paddingBlock: 40 }}>
        A restaurar a sessão…
      </main>
    );
  if (!session || session.user.role === "admin")
    return <Navigate to={`/entrar?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!hasSellerProfile) return <Navigate to="/produtor/configurar" replace />;
  if (verification.isPending) return <Loading />;
  if (verification.isError)
    return (
      <main className="lp-wrap" style={{ paddingBlock: 40 }}>
        <ErrorState error={verification.error} retry={() => verification.refetch()} />
      </main>
    );
  if (
    verification.data.verification.status !== "approved" &&
    location.pathname !== "/produtor/verificacao"
  ) {
    return <Navigate to="/produtor/verificacao" replace />;
  }
  return <>{children}</>;
}

type NavItem = [string, string, IconName];
const SELLER_NAV: NavItem[] = [
  ["/produtor", "Painel", "dash"],
  ["/produtor/produtos", "Produtos", "package"],
  ["/produtor/vendas", "Vendas", "receipt"],
  ["/produtor/verificacao", "Verificação", "idcard"],
  ["/produtor/financeiro", "Financeiro", "wallet"],
  ["/produtor/conta", "Perfil comercial", "sliders"],
];
const ADMIN_NAV: NavItem[] = [
  ["/admin", "Visão geral", "dash"],
  ["/admin/encomendas", "Encomendas", "receipt"],
  ["/admin/saques", "Saques", "cash"],
  ["/admin/produtores", "Produtores", "store"],
  ["/admin/kyc", "Verificação KYC", "idcard"],
  ["/admin/produtos", "Produtos em análise", "package"],
];

export function ConsoleLayout({ kind }: { kind: "seller" | "admin" }) {
  useDocumentTitle();
  const { session, isDark, toggleTheme, signOut } = useApp();
  const [side, setSide] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenu = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const admin = kind === "admin";
  const navigation = admin ? ADMIN_NAV : SELLER_NAV;
  useEffect(() => {
    setSide(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!accountMenu.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const logout = async () => {
    await signOut();
    navigate(admin ? "/admin/entrar" : "/entrar", { replace: true });
  };

  return (
    <div className="vq-shell">
      <div className={`vq-scrim ${side ? "is-open" : ""}`} onClick={() => setSide(false)} />
      <aside className={`vq-side ${admin ? "is-admin" : ""} ${side ? "is-open" : ""}`}>
        <nav className="ad-sidebar">
          <div className="ad-sidebar-brand">
            <Logo
              sub={admin ? "Backoffice" : "Área do produtor"}
              to={admin ? "/admin" : "/produtor"}
            />
          </div>
          <div className="ad-sidebar-nav">
            <div className="ad-sidebar-section">
              <div className="ad-sidebar-heading">Navegação</div>
              {navigation.map(([to, label, icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin" || to === "/produtor"}
                  className={({ isActive }) => `ad-sidebar-item ${isActive ? "is-active" : ""}`}
                >
                  <Icon name={icon} size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
          <div className="ad-sidebar-foot">
            <div className="vq-account" ref={accountMenu}>
              {accountOpen && (
                <div className="ad-menu vq-account-menu">
                  <div className="ad-menu-header">
                    <strong>{session?.user.name}</strong>
                    <span>{session?.user.email}</span>
                  </div>
                  {!admin && (
                    <>
                      <Link
                        className="ad-menu-item"
                        to="/aluno"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Icon name="book" size={17} />
                        <span>
                          <b>As minhas compras</b>
                          <small>Produtos e histórico de compras</small>
                        </span>
                      </Link>
                      <Link
                        className="ad-menu-item"
                        to="/produtor/conta"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Icon name="store" size={17} />
                        <span>
                          <b>Perfil comercial</b>
                          <small>Dados públicos do produtor</small>
                        </span>
                      </Link>
                      <div className="ad-menu-sep" />
                    </>
                  )}
                  <button type="button" className="ad-menu-item is-danger" onClick={logout}>
                    <Icon name="logout" size={17} />
                    <span>Terminar sessão</span>
                  </button>
                </div>
              )}
              <button
                type="button"
                className={`ad-userchip vq-account-trigger ${accountOpen ? "is-open" : ""}`}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <Avatar name={session?.user.name ?? "Utilizador"} />
                <span className="ad-userchip-text">
                  <span className="ad-userchip-name">{session?.user.name}</span>
                  <span className="ad-userchip-role">
                    {admin ? "Backoffice" : session?.user.business?.name}
                  </span>
                </span>
                <Icon name="down" size={15} className="ad-userchip-chev" />
              </button>
            </div>
          </div>
        </nav>
      </aside>
      <div className="vq-colmain">
        <header className="ad-topbar vq-top">
          <div className="ad-topbar-left">
            <IconBtn
              icon="menu"
              label="Abrir menu"
              className="vq-menubtn"
              onClick={() => setSide(true)}
            />
            <span className="ad-topbar-title">{usePageTitle()}</span>
          </div>
          <div className="ad-topbar-right">
            <NotificationBell
              audience={admin ? "backoffice" : "user"}
              area={admin ? "admin" : "seller"}
            />
            <IconBtn icon={isDark ? "sun" : "moon"} label="Alternar tema" onClick={toggleTheme} />
          </div>
        </header>
        <main className="vq-main">
          <div className="stack">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function StudentLayout() {
  useDocumentTitle();
  const { session, isDark, toggleTheme, signOut } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const productsActive = pathname === "/aluno" || pathname.startsWith("/aluno/produtos/");
  return (
    <>
      <header className="stu-top">
        <div className="lp-wrap">
          <Logo sub="As minhas compras" to="/aluno" />
          <div className="ad-tabs ad-tabs-segmented">
            <Link to="/aluno" className={`ad-tab ${productsActive ? "is-active" : ""}`}>
              Produtos
            </Link>
            <NavLink
              to="/aluno/compras"
              className={({ isActive }) => `ad-tab ${isActive ? "is-active" : ""}`}
            >
              Compras
            </NavLink>
          </div>
          <div className="row">
            <Btn s="sm" to={session?.user.role === "seller" ? "/produtor" : "/produtor/configurar"}>
              {session?.user.role === "seller" ? "Área do produtor" : "Começar a vender"}
            </Btn>
            <NotificationBell audience="user" area="student" />
            <IconBtn icon={isDark ? "sun" : "moon"} label="Alternar tema" onClick={toggleTheme} />
            <Avatar name={session?.user.name ?? "Utilizador"} />
            <Btn
              s="sm"
              onClick={async () => {
                await signOut();
                navigate("/entrar");
              }}
            >
              Sair
            </Btn>
          </div>
        </div>
      </header>
      <main className="lp-wrap" style={{ paddingBlock: "28px 96px" }}>
        <div className="stack">
          <Outlet />
        </div>
      </main>
    </>
  );
}

export function PublicLayout() {
  useDocumentTitle();
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return <Outlet />;
}

export function AreaSwitcher() {
  const [open, setOpen] = useState(false);
  const { skin, setSkin, isDark, toggleTheme } = useApp();
  if (import.meta.env.VITE_SHOW_SWITCHER !== "true") return null;
  return (
    <div className="proto">
      {open && (
        <div className="ad-menu">
          <div className="ad-menu-header">Ambiente de desenvolvimento</div>
          {SKINS.map((item) => (
            <button
              key={item.id}
              className={`ad-menu-item ${skin === item.id ? "is-current" : ""}`}
              onClick={() => setSkin(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button className="ad-menu-item" onClick={toggleTheme}>
            Tema {isDark ? "claro" : "escuro"}
          </button>
        </div>
      )}
      <button className="proto-btn" onClick={() => setOpen((value) => !value)}>
        <Icon name="grid" size={16} />
        <span>Desenvolvimento</span>
      </button>
    </div>
  );
}
