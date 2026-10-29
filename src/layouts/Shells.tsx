import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useMatches, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { Role } from "@/api/types";
import { Icon, Mark, type IconName } from "@/lib/icons";
import { useApp, SKINS, USE_MOCKS, demoSession } from "@/lib/app-state";
import { DEMO_USERS } from "@/lib/demo-users";
import { METHODS } from "@/lib/methods";
import { mt } from "@/lib/format";
import { Avatar, Btn, IconBtn, Tile } from "@/components/ui";

export function Logo({ sub, to = "/" }: { sub?: string; to?: string }) {
  return (
    <Link className="vq-logo" to={to} aria-label="VendAqui — início">
      <span className="vq-mark"><Mark size={18} /></span>
      <span className="vq-brandtext"><span className="vq-brandname">Vend<b>Aqui</b></span>{sub ? <span className="vq-brandsub">{sub}</span> : null}</span>
    </Link>
  );
}

export const usePageTitle = () => {
  const m = useMatches();
  const h = [...m].reverse().find((x) => (x.handle as { title?: string } | undefined)?.title);
  return (h?.handle as { title?: string } | undefined)?.title ?? "";
};
function useDocTitle() {
  const t = usePageTitle();
  useEffect(() => { document.title = (t ? t + " · " : "") + "VendAqui"; }, [t]);
}

/** Exige sessão com o papel certo. Em modo simulado cria uma sessão de demonstração. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, signIn } = useApp();
  const loc = useLocation();
  const ok = session?.user.role === role;
  useEffect(() => { if (!ok && USE_MOCKS) signIn(demoSession(role, DEMO_USERS)); }, [ok, role, signIn]);
  if (ok) return <>{children}</>;
  if (USE_MOCKS) return null;
  return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname)}`} replace />;
}

type NavItem = [string, string, IconName, number?];
const SELLER_NAV: [string, NavItem[]][] = [
  ["Principal", [["/produtor", "Painel", "dash"], ["/produtor/produtos", "Produtos", "package"], ["/produtor/vendas", "Vendas", "receipt", 3], ["/produtor/assinaturas", "Assinaturas", "repeat"], ["/produtor/clientes", "Clientes", "users"]]],
  ["Crescimento", [["/produtor/afiliados", "Afiliados", "share", 4], ["/produtor/cupoes", "Cupões", "tag"], ["/produtor/recuperacao", "Recuperação de vendas", "target"], ["/produtor/membros", "Área de membros", "cap"]]],
  ["Conta", [["/produtor/financeiro", "Financeiro", "wallet"], ["/produtor/integracoes", "Integrações", "plug"], ["/produtor/conta", "Definições da conta", "sliders"]]],
];
const ADMIN_NAV: [string, NavItem[]][] = [
  ["Operação", [["/admin", "Visão geral", "dash"], ["/admin/transacoes", "Transações", "receipt"], ["/admin/saques", "Saques", "cash", 4], ["/admin/disputas", "Reembolsos e disputas", "scale", 3]]],
  ["Conformidade", [["/admin/produtores", "Produtores", "store"], ["/admin/kyc", "Verificação KYC", "idcard", 6], ["/admin/produtos", "Produtos em análise", "package", 5], ["/admin/antifraude", "Antifraude", "shieldalert"]]],
  ["Plataforma", [["/admin/pagamentos", "Métodos de pagamento", "route"], ["/admin/taxas", "Taxas e planos", "percent"], ["/admin/equipa", "Equipa e acessos", "usercheck"], ["/admin/auditoria", "Registo de auditoria", "history"]]],
];

function Notifications({ admin, onClose }: { admin: boolean; onClose: () => void }) {
  const sales = useQuery({ queryKey: ["seller", "sales", {}], queryFn: () => api.seller.sales({}), enabled: !admin });
  const items: [IconName, string, string, string][] = admin
    ? [["idcard", "6 verificações KYC pendentes", "A mais antiga espera há 26 h", "/admin/kyc"], ["cash", "4 saques acima do limite automático", "Total 412 600,00 MT", "/admin/saques"], ["alert", "e-Mola com latência elevada", "Aprovação caiu para 91,2% na última hora", "/admin/pagamentos"], ["scale", "Chargeback recebido", "VQ-47702 · Cartão · 3 990,00 MT", "/admin/disputas"]]
    : (sales.data?.items ?? []).slice(0, 4).map((s) => [s.status === "approved" ? "zap" : "clock", s.status === "approved" ? `Venda aprovada · +${mt(s.net)}` : "Pagamento por confirmar", `${s.product.name} · ${METHODS[s.method].label}`, "/produtor/vendas"]);
  return (
    <div className="ad-menu ad-menu-end" style={{ width: 340, maxWidth: "calc(100vw - 24px)" }}>
      <div className="ad-menu-header row-between"><b style={{ color: "var(--text)", fontSize: 14 }}>Notificações</b><button className="ad-btn-link" onClick={onClose} style={{ fontSize: 12 }}>Marcar como lidas</button></div>
      {items.map(([i, t, s, to], k) => (
        <Link key={k} className="ad-menu-item" to={to} onClick={onClose} style={{ alignItems: "flex-start", textDecoration: "none" }}>
          <Tile icon={i} tone={k === 0 ? "success" : "neutral"} s="sm" />
          <span className="stack-xs" style={{ gap: 1 }}><b style={{ fontWeight: 600, fontSize: 13.5 }}>{t}</b><small className="faint" style={{ fontSize: 12 }}>{s}</small></span>
        </Link>
      ))}
    </div>
  );
}

export function ConsoleLayout({ kind }: { kind: "seller" | "admin" }) {
  useDocTitle();
  const admin = kind === "admin";
  const title = usePageTitle();
  const { isDark, toggleTheme, toast, session } = useApp();
  const [side, setSide] = useState(false);
  const [notif, setNotif] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setSide(false); setNotif(false); window.scrollTo(0, 0); }, [loc.pathname]);
  // simula vendas a chegar enquanto o produtor trabalha (só em modo simulado)
  useEffect(() => {
    if (admin || !USE_MOCKS) return;
    const names = ["Excel do Zero ao Avançado · M-Pesa", "Ebook: 100 Fórmulas de Excel · e-Mola", "Clube Excel Pro · Apple Pay"];
    const amounts = [2367.99, 418.05, 741.29];
    let i = 0;
    const tick = () => { if (document.visibilityState === "visible") { toast(<>Venda aprovada · <b className="amt">+{mt(amounts[i % 3])}</b></>, names[i % 3], "success", "zap", "sale-toast"); i++; } };
    const first = setTimeout(tick, 7000);
    const every = setInterval(tick, 45000);
    return () => { clearTimeout(first); clearInterval(every); };
  }, [admin, toast]);

  const groups = admin ? ADMIN_NAV : SELLER_NAV;
  const user = session?.user ?? DEMO_USERS[admin ? "admin" : "seller"];
  return (
    <div className="vq-shell">
      <div className={`vq-scrim ${side ? "is-open" : ""}`} onClick={() => setSide(false)} />
      <aside className={`vq-side ${admin ? "is-admin" : ""} ${side ? "is-open" : ""}`} aria-label="Navegação">
        <nav className="ad-sidebar">
          <div className="ad-sidebar-brand"><Logo sub={admin ? "Backoffice" : "Área do produtor"} to={admin ? "/admin" : "/produtor"} /></div>
          <div className="ad-sidebar-nav">
            {groups.map(([h, items]) => (
              <div className="ad-sidebar-section" key={h}>
                <div className="ad-sidebar-heading">{h}</div>
                {items.map(([to, l, i, c]) => (
                  <NavLink key={to} to={to} end={to === "/produtor" || to === "/admin"} className={({ isActive }) => `ad-sidebar-item ${isActive ? "is-active" : ""}`}>
                    <Icon name={i} size={18} /><span>{l}</span>{c ? <span className="ad-tab-count">{c}</span> : null}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
          <div className="ad-sidebar-foot">
            {admin ? null : (
              <div className="vq-balance"><small>Saldo disponível</small><strong>{mt(48320)}</strong>
                <Btn v="soft" s="sm" icon="cash" onClick={() => nav("/produtor/financeiro?sacar=1")} className="" >Sacar</Btn></div>
            )}
            <Link className="ad-userchip" to={admin ? "/admin/equipa" : "/produtor/conta"} style={{ textDecoration: "none" }}>
              <Avatar name={user.name} />
              <span className="ad-userchip-text"><span className="ad-userchip-name">{user.name}</span><span className="ad-userchip-role">{admin ? "Administradora · Operações" : user.business?.name}</span></span>
            </Link>
          </div>
        </nav>
      </aside>
      <div className="vq-colmain">
        <header className="ad-topbar vq-top">
          <div className="ad-topbar-left">
            <IconBtn icon="menu" label="Abrir menu" className="vq-menubtn" onClick={() => setSide(true)} />
            <span className="ad-topbar-title">{title}</span>
            {admin ? <span className="vq-envchip vq-hide-sm"><i />Produção · todos os sistemas operacionais</span> : null}
          </div>
          <div className="ad-topbar-right">
            <div className="ad-input ad-input-sm ad-search vq-hide-sm" style={{ width: 240 }}>
              <span className="ad-input-icon"><Icon name="search" size={16} /></span>
              <input placeholder={admin ? "Procurar produtor, transação, NUIT" : "Procurar vendas, clientes"} aria-label="Procurar"
                onKeyDown={(e) => { if (e.key === "Enter") nav(admin ? `/admin/transacoes` : `/produtor/vendas?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`); }} />
              <span className="ad-kbd">↵</span>
            </div>
            <IconBtn icon={isDark ? "sun" : "moon"} label="Alternar tema" onClick={toggleTheme} />
            <div className="ad-menu-wrap">
              <IconBtn icon="bell" label="Notificações" badge={admin ? 4 : 3} onClick={() => setNotif((v) => !v)} />
              {notif ? <Notifications admin={admin} onClose={() => setNotif(false)} /> : null}
            </div>
            {admin ? null : <Btn v="primary" s="sm" icon="plus" to="/produtor/produtos/novo" className="vq-hide-sm">Novo produto</Btn>}
          </div>
        </header>
        <main className="vq-main" id="vq-main"><div className="stack"><Outlet /></div></main>
      </div>
    </div>
  );
}

export function StudentLayout() {
  useDocTitle();
  const { isDark, toggleTheme, session } = useApp();
  const loc = useLocation();
  const user = session?.user ?? DEMO_USERS.student;
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <>
      <header className="stu-top"><div className="lp-wrap">
        <Logo sub="Área do aluno" to="/aluno" />
        <div className="ad-tabs ad-tabs-segmented vq-hide-sm">
          <NavLink to="/aluno" end className={({ isActive }) => `ad-tab ${isActive || loc.pathname.startsWith("/aluno/aulas") ? "is-active" : ""}`}>Os meus produtos</NavLink>
          <NavLink to="/aluno/compras" className={({ isActive }) => `ad-tab ${isActive ? "is-active" : ""}`}>Compras</NavLink>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <IconBtn icon={isDark ? "sun" : "moon"} label="Alternar tema" onClick={toggleTheme} />
          <Link className="ad-userchip" to="/aluno/compras" style={{ textDecoration: "none" }}><Avatar name={user.name} /><span className="ad-userchip-text vq-hide-sm"><span className="ad-userchip-name">{user.name}</span><span className="ad-userchip-role">Aluno</span></span></Link>
        </div>
      </div></header>
      <main className="lp-wrap" style={{ paddingBlock: "28px 96px" }} id="vq-main"><div className="stack"><Outlet /></div></main>
    </>
  );
}

export function PublicLayout() {
  useDocTitle();
  const loc = useLocation();
  useEffect(() => { if (!loc.hash) window.scrollTo(0, 0); }, [loc.pathname, loc.hash]);
  return <Outlet />;
}

/** Atalho flutuante entre as áreas e os visuais, útil para quem está a testar. */
export function AreaSwitcher() {
  const [open, setOpen] = useState(false);
  const { skin, setSkin, isDark, toggleTheme } = useApp();
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const areas: [string, string, string, IconName][] = [["/", "Landing page", "Página pública de vendas", "globe"], ["/checkout/excel-zero-avancado", "Checkout", "O que o comprador vê", "cart"], ["/entrar", "Entrar e registo", "Login e onboarding com KYC", "user"], ["/produtor", "Área do produtor", "Painel do cliente que vende", "dash"], ["/aluno", "Área do aluno", "Onde o comprador consome", "cap"], ["/admin", "Backoffice", "Consola da plataforma", "shield"]];
  return (
    <div className="proto">
      {open ? (
        <div className="ad-menu" role="menu">
          <div className="ad-menu-header">Navegar no protótipo</div>
          {areas.map(([to, l, d, i]) => (
            <Link key={to} className={`ad-menu-item ${loc.pathname === to ? "is-current" : ""}`} to={to} role="menuitem" style={{ textDecoration: "none" }}><Icon name={i} size={18} /><span>{l}<small>{d}</small></span></Link>
          ))}
          <div className="ad-menu-sep" />
          <div className="ad-menu-header">Visual</div>
          {SKINS.map((s) => (
            <button key={s.id} className={`ad-menu-item ${skin === s.id ? "is-current" : ""}`} onClick={() => setSkin(s.id)} role="menuitemradio" aria-checked={skin === s.id}><Icon name={skin === s.id ? "checkc" : "image"} size={18} /><span>{s.label}<small>{s.note}</small></span></button>
          ))}
          <div className="ad-menu-sep" />
          <button className="ad-menu-item" onClick={toggleTheme}><Icon name={isDark ? "sun" : "moon"} size={18} /><span>Tema {isDark ? "claro" : "escuro"}</span></button>
        </div>
      ) : null}
      <button className="proto-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}><Icon name="grid" size={16} /><span>Áreas do protótipo</span></button>
    </div>
  );
}
