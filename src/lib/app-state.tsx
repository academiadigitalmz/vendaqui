/** Estado de interface partilhado: tema, visual (skin), notificações toast e sessão. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HttpError, tokenStore } from "@/api/http";
import { api } from "@/api/endpoints";
import type { Session } from "@/api/types";
import { Icon, type IconName } from "./icons";
import { Btn, Input, Textarea } from "@/components/ui";

export type Skin = "academia" | "cakto" | "cakto-laranja";
export type ThemeChoice = "light" | "dark" | null;
export const SKINS: { id: Skin; label: string; note: string }[] = [
  { id: "cakto", label: "Cakto verde", note: "Linguagem Cakto original" },
  { id: "cakto-laranja", label: "Cakto laranja", note: "Linguagem Cakto com o laranja da marca" },
  { id: "academia", label: "Academia Digital", note: "Design System Academia Digital" },
];

const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem("vq." + k);
      return v == null ? d : (JSON.parse(v) as T);
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem("vq." + k, JSON.stringify(v));
    } catch {
      /* sem armazenamento */
    }
  },
};

type Tone = "success" | "info" | "warning" | "danger" | "neutral";
interface ToastItem {
  id: number;
  title: ReactNode;
  text?: ReactNode;
  tone: Tone;
  icon: IconName;
  className?: string;
}

export interface PromptOptions {
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  multiline?: boolean;
  confirmLabel?: string;
  required?: boolean;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
}

type DialogState =
  | ({ kind: "prompt"; resolve: (value: string | null) => void } & PromptOptions)
  | ({ kind: "confirm"; resolve: (value: boolean) => void } & ConfirmOptions);

interface Ctx {
  theme: ThemeChoice;
  isDark: boolean;
  toggleTheme: () => void;
  skin: Skin;
  setSkin: (s: Skin) => void;
  toast: (
    title: ReactNode,
    text?: ReactNode,
    tone?: Tone,
    icon?: IconName,
    className?: string,
  ) => void;
  prompt: (options: PromptOptions) => Promise<string | null>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  session: Session | null;
  authReady: boolean;
  signIn: (s: Session) => void;
  /** Resolves false when the server session could not be ended and stays open. */
  signOut: () => Promise<boolean>;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp fora do AppProvider");
  return c;
};

const DEFAULT_SKIN = (import.meta.env.VITE_DEFAULT_SKIN as Skin) || "cakto";

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeChoice>(() => store.get<ThemeChoice>("theme", null));
  const [skin, setSkinState] = useState<Skin>(() => store.get<Skin>("skin", DEFAULT_SKIN));
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const seq = useRef(0);
  const queryClient = useQueryClient();
  const userId = useRef<string | null>(null);

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    theme
      ? document.documentElement.setAttribute("data-theme", theme)
      : document.documentElement.removeAttribute("data-theme");
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute("data-skin", skin);
  }, [skin]);
  useEffect(() => {
    let active = true;
    const restore = window.location.pathname.startsWith("/admin")
      ? api.backofficeAuth.restore
      : api.auth.restore;
    restore()
      .then((restored) => {
        if (!active) return;
        userId.current = restored?.user.id ?? null;
        setSession(restored);
      })
      .catch(() => {
        tokenStore.set(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const isDark = theme ? theme === "dark" : systemDark;
  const toggleTheme = useCallback(() => {
    const t = isDark ? "light" : "dark";
    setTheme(t);
    store.set("theme", t);
  }, [isDark]);
  const setSkin = useCallback((s: Skin) => {
    setSkinState(s);
    store.set("skin", s);
  }, []);
  const toast = useCallback<Ctx["toast"]>(
    (title, text, tone = "success", icon = "checkc", className) => {
      const id = ++seq.current;
      setToasts((t) => [...t, { id, title, text, tone, icon, className }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
    },
    [],
  );
  const prompt = useCallback<Ctx["prompt"]>(
    (options) =>
      new Promise((resolve) => {
        setDialog((current) => {
          if (current?.kind === "prompt") current.resolve(null);
          if (current?.kind === "confirm") current.resolve(false);
          return {
            kind: "prompt",
            required: true,
            multiline: true,
            confirmLabel: "Continuar",
            ...options,
            resolve,
          };
        });
      }),
    [],
  );
  const confirm = useCallback<Ctx["confirm"]>(
    (options) =>
      new Promise((resolve) => {
        setDialog((current) => {
          if (current?.kind === "prompt") current.resolve(null);
          if (current?.kind === "confirm") current.resolve(false);
          return {
            kind: "confirm",
            confirmLabel: "Confirmar",
            tone: "primary",
            ...options,
            resolve,
          };
        });
      }),
    [],
  );
  const signIn = useCallback(
    (s: Session) => {
      // Cached responses are not keyed by user, so they must not outlive the one who fetched them.
      if (userId.current && userId.current !== s.user.id) queryClient.clear();
      userId.current = s.user.id;
      tokenStore.set(s.token, s.user.role === "admin" ? "backoffice" : "app");
      setSession(s);
      setAuthReady(true);
    },
    [queryClient],
  );
  const signOut = useCallback(async () => {
    const logout = session?.user.role === "admin" ? api.backofficeAuth.logout : api.auth.logout;
    try {
      await logout();
    } catch (error) {
      // 401 means the server has no session left to end.
      if (!(error instanceof HttpError && error.status === 401)) {
        toast(
          "Não foi possível terminar a sessão",
          "A sessão continua aberta. Verifique a ligação e tente novamente.",
          "danger",
          "alert",
        );
        return false;
      }
    }
    tokenStore.set(null);
    setSession(null);
    userId.current = null;
    queryClient.clear();
    return true;
  }, [session?.user.role, toast, queryClient]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
      skin,
      setSkin,
      toast,
      prompt,
      confirm,
      session,
      authReady,
      signIn,
      signOut,
    }),
    [
      theme,
      isDark,
      toggleTheme,
      skin,
      setSkin,
      toast,
      prompt,
      confirm,
      session,
      authReady,
      signIn,
      signOut,
    ],
  );
  return (
    <AppCtx.Provider value={value}>
      {children}
      {dialog && <AppDialog dialog={dialog} close={() => setDialog(null)} />}
      <div className="vq-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ad-toast ad-tone-${t.tone} ${t.className || ""}`}>
            <span className="ad-toast-icon">
              <Icon name={t.icon} size={16} />
            </span>
            <div className="ad-toast-body">
              <b>{t.title}</b>
              {t.text ? <span>{t.text}</span> : null}
            </div>
            <button
              className="ad-iconbtn ad-iconbtn-sm ad-btn-ghost"
              aria-label="Fechar"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}

function AppDialog({ dialog, close }: { dialog: DialogState; close: () => void }) {
  const [value, setValue] = useState(dialog.kind === "prompt" ? (dialog.initialValue ?? "") : "");
  const cancel = () => {
    if (dialog.kind === "prompt") dialog.resolve(null);
    else dialog.resolve(false);
    close();
  };
  const submit = () => {
    if (dialog.kind === "prompt") {
      const result = value.trim();
      if (dialog.required && !result) return;
      dialog.resolve(result);
    } else {
      dialog.resolve(true);
    }
    close();
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return (
    <div
      className="ad-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <form
        className="ad-modal ad-modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="ad-modal-head">
          <div>
            <h2 id="app-dialog-title" className="ad-modal-title">
              {dialog.title}
            </h2>
            {dialog.message && <p className="ad-modal-desc">{dialog.message}</p>}
          </div>
        </div>
        {dialog.kind === "prompt" && (
          <div className="ad-modal-body">
            <label className="ad-field">
              <span className="ad-label">{dialog.label ?? "Motivo"}</span>
              {dialog.multiline ? (
                <Textarea
                  autoFocus
                  rows={4}
                  value={value}
                  placeholder={dialog.placeholder}
                  onChange={(event) => setValue(event.target.value)}
                />
              ) : (
                <Input
                  autoFocus
                  value={value}
                  placeholder={dialog.placeholder}
                  onChange={(event) => setValue(event.target.value)}
                />
              )}
            </label>
          </div>
        )}
        <div className="ad-modal-foot">
          <Btn onClick={cancel}>Cancelar</Btn>
          <Btn
            type="submit"
            v={dialog.kind === "confirm" && dialog.tone === "danger" ? "danger" : "primary"}
            disabled={dialog.kind === "prompt" && !!dialog.required && !value.trim()}
          >
            {dialog.confirmLabel}
          </Btn>
        </div>
      </form>
    </div>
  );
}

export { store };
