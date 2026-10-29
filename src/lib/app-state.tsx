/** Estado de interface partilhado: tema, visual (skin), notificações toast e sessão. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { tokenStore } from "@/api/http";
import type { Role, Session, User } from "@/api/types";
import { Icon, type IconName } from "./icons";

export type Skin = "academia" | "cakto" | "cakto-laranja";
export type ThemeChoice = "light" | "dark" | null;
export const SKINS: { id: Skin; label: string; note: string }[] = [
  { id: "cakto", label: "Cakto verde", note: "Linguagem Cakto original" },
  { id: "cakto-laranja", label: "Cakto laranja", note: "Linguagem Cakto com o laranja da marca" },
  { id: "academia", label: "Academia Digital", note: "Design System Academia Digital" },
];
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem("vq." + k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem("vq." + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
};

type Tone = "success" | "info" | "warning" | "danger" | "neutral";
interface ToastItem { id: number; title: ReactNode; text?: ReactNode; tone: Tone; icon: IconName; className?: string }

interface Ctx {
  theme: ThemeChoice; isDark: boolean; toggleTheme: () => void;
  skin: Skin; setSkin: (s: Skin) => void;
  toast: (title: ReactNode, text?: ReactNode, tone?: Tone, icon?: IconName, className?: string) => void;
  session: Session | null; signIn: (s: Session) => void; signOut: () => void;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(AppCtx); if (!c) throw new Error("useApp fora do AppProvider"); return c; };

const DEFAULT_SKIN = (import.meta.env.VITE_DEFAULT_SKIN as Skin) || "cakto";

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeChoice>(() => store.get<ThemeChoice>("theme", null));
  const [skin, setSkinState] = useState<Skin>(() => store.get<Skin>("skin", DEFAULT_SKIN));
  const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [session, setSession] = useState<Session | null>(() => store.get<Session | null>("session", null));
  const seq = useRef(0);

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => { theme ? document.documentElement.setAttribute("data-theme", theme) : document.documentElement.removeAttribute("data-theme"); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute("data-skin", skin); }, [skin]);

  const isDark = theme ? theme === "dark" : systemDark;
  const toggleTheme = useCallback(() => { const t = isDark ? "light" : "dark"; setTheme(t); store.set("theme", t); }, [isDark]);
  const setSkin = useCallback((s: Skin) => { setSkinState(s); store.set("skin", s); }, []);
  const toast = useCallback<Ctx["toast"]>((title, text, tone = "success", icon = "checkc", className) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, title, text, tone, icon, className }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
  }, []);
  const signIn = useCallback((s: Session) => { tokenStore.set(s.token); store.set("session", s); setSession(s); }, []);
  const signOut = useCallback(() => { tokenStore.set(null); store.set("session", null); setSession(null); }, []);

  const value = useMemo(() => ({ theme, isDark, toggleTheme, skin, setSkin, toast, session, signIn, signOut }), [theme, isDark, toggleTheme, skin, setSkin, toast, session, signIn, signOut]);
  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="vq-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ad-toast ad-tone-${t.tone} ${t.className || ""}`}>
            <span className="ad-toast-icon"><Icon name={t.icon} size={16} /></span>
            <div className="ad-toast-body"><b>{t.title}</b>{t.text ? <span>{t.text}</span> : null}</div>
            <button className="ad-iconbtn ad-iconbtn-sm ad-btn-ghost" aria-label="Fechar" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}

/** Em modo simulado, abrir uma área cria uma sessão de demonstração com o papel certo. */
export function demoSession(role: Role, users: Record<Role, User>): Session {
  return { token: `demo-${role}`, user: users[role] };
}
export { store };
