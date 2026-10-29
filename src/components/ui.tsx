/** Componentes do Design System em React. As classes ad-* vêm de src/styles/components.css. */
import { useId, useState, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { Icon, PayLogo, type IconName } from "@/lib/icons";
import { initials, int, pct, maskPhone } from "@/lib/format";
import { METHODS } from "@/lib/methods";
import type { PaymentMethod, PayoutDestinationKind } from "@/api/types";

export type Tone = "neutral" | "primary" | "success" | "info" | "warning" | "danger" | "blue" | "purple" | "green" | "orange" | "teal" | "red";
type BtnVariant = "primary" | "secondary" | "ghost" | "soft" | "danger" | "inverse" | "link";
type Size = "sm" | "md" | "lg";

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  v?: BtnVariant; s?: Size; icon?: IconName; iconRight?: IconName; to?: string; block?: boolean; loading?: boolean; type?: "button" | "submit";
}
export function Btn({ v = "secondary", s = "md", icon, iconRight, to, block, loading, className = "", children, type = "button", ...rest }: BtnProps) {
  const cls = `ad-btn ad-btn-${v} ad-btn-${s} ${block ? "ad-btn-block" : ""} ${className}`;
  const inner = (<>{loading ? <span className="ad-spinner" style={{ width: 16, height: 16 }} /> : icon ? <Icon name={icon} size={s === "sm" ? 16 : 18} /> : null}{children != null && children !== "" ? <span>{children}</span> : null}{iconRight ? <Icon name={iconRight} size={16} /> : null}</>);
  if (to) return <Link className={cls} to={to}>{inner}</Link>;
  return <button type={type} className={cls} disabled={loading || rest.disabled} {...rest}>{inner}</button>;
}

export function IconBtn({ icon, label, s = "md", v = "ghost", badge, className = "", ...rest }: { icon: IconName; label: string; s?: Size; v?: BtnVariant; badge?: number | string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">) {
  return (
    <button type="button" className={`ad-iconbtn ad-iconbtn-${s} ad-btn-${v} ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={s === "sm" ? 16 : 18} />
      {badge ? <span className="ad-count ad-iconbtn-badge">{badge}</span> : null}
    </button>
  );
}

export const Badge = ({ children, tone = "neutral", v = "soft", s = "sm", dot }: { children: ReactNode; tone?: Tone; v?: "soft" | "solid" | "outline"; s?: "sm" | "md"; dot?: boolean }) => (
  <span className={`ad-badge ad-badge-${v} ad-badge-${s} ad-tone-${tone}`}>{dot ? <span className="ad-badge-dot" /> : null}{children}</span>
);

export const Tile = ({ icon, tone = "primary", s = "md", v = "soft" }: { icon: IconName; tone?: Tone; s?: "sm" | "md" | "lg"; v?: "soft" | "solid" }) => (
  <span className={`ad-tile ad-tile-${v} ad-tile-${s} ad-tone-${tone}`}><Icon name={icon} size={s === "sm" ? 16 : s === "lg" ? 24 : 20} /></span>
);

export const Avatar = ({ name, s = "sm" }: { name: string; s?: "xs" | "sm" | "md" | "lg" | "xl" }) => <span className={`ad-avatar ad-avatar-${s}`}>{initials(name)}</span>;

export function Field({ label, children, help, req, aside, className = "", htmlFor }: { label?: ReactNode; children: ReactNode; help?: ReactNode; req?: boolean; aside?: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={`ad-field ${className}`}>
      {label ? <div className="ad-field-top"><label className="ad-label" htmlFor={htmlFor}>{label}{req ? <> <span className="ad-req">*</span></> : null}</label>{aside}</div> : null}
      {children}
      {help ? <span className="ad-helper">{help}</span> : null}
    </div>
  );
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> { s?: Size; icon?: IconName; prefix?: string; suffix?: string; wrapClass?: string }
export function Input({ s = "md", icon, prefix, suffix, wrapClass = "", ...rest }: InputProps) {
  return (
    <div className={`ad-input ad-input-${s} ${wrapClass}`}>
      {icon ? <span className="ad-input-icon"><Icon name={icon} size={16} /></span> : null}
      {prefix ? <span className="co-prefix">{prefix}</span> : null}
      <input {...rest} />
      {suffix ? <span className="faint" style={{ fontSize: 13 }}>{suffix}</span> : null}
    </div>
  );
}
export const SearchInput = (p: InputProps) => <Input icon="search" wrapClass="ad-search" {...p} />;

export function Select({ options, s = "md", icon, ...rest }: { options: (string | [string, string])[]; s?: Size; icon?: IconName } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">) {
  return (
    <div className={`ad-input ad-input-${s} ad-select`}>
      {icon ? <span className="ad-input-icon"><Icon name={icon} size={16} /></span> : null}
      <select {...rest}>{options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}</select>
      <span className="ad-select-chevron"><Icon name="down" size={16} /></span>
    </div>
  );
}

export const Textarea = ({ rows = 3, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="ad-input ad-textarea"><textarea rows={rows} {...rest} /></div>
);

export function Switch({ checked, onChange, label, defaultChecked }: { checked?: boolean; onChange?: (v: boolean) => void; label: string; defaultChecked?: boolean }) {
  const [inner, setInner] = useState(!!defaultChecked);
  const on = checked ?? inner;
  return (
    <button type="button" className="ad-switch-track" role="switch" aria-checked={on} aria-label={label} onClick={() => { if (checked === undefined) setInner(!on); onChange?.(!on); }}>
      <span className="ad-switch-thumb" />
    </button>
  );
}

export function Checkbox({ label, defaultChecked, checked, onChange }: { label: ReactNode; defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <label className="ad-check">
      <input type="checkbox" defaultChecked={defaultChecked} checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="ad-check-box"><Icon name="check" size={12} /></span>
      <span className="ad-check-label">{label}</span>
    </label>
  );
}

export function Tabs<K extends string>({ items, value, onChange, kind = "underline" }: { items: [K, ReactNode, (number | string)?][]; value: K; onChange: (k: K) => void; kind?: "underline" | "pill" | "segmented" }) {
  return (
    <div className={`ad-tabs ad-tabs-${kind}`} role="tablist">
      {items.map(([k, l, c]) => (
        <button key={k} type="button" className={`ad-tab ${k === value ? "is-active" : ""}`} role="tab" aria-selected={k === value} onClick={() => onChange(k)}>
          {l}{c != null ? <span className="ad-tab-count">{c}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Card({ title, icon, tone = "primary", aside, children, foot, flush, className = "" }: { title?: ReactNode; icon?: IconName; tone?: Tone; aside?: ReactNode; children: ReactNode; foot?: ReactNode; flush?: boolean; className?: string }) {
  return (
    <section className={`ad-card ${className}`}>
      {title ? <header className="ad-card-head"><div className="ad-card-title">{icon ? <Tile icon={icon} tone={tone} s="sm" /> : null}<h3>{title}</h3></div>{aside}</header> : null}
      <div className={`ad-card-body ${flush ? "" : "is-padded"}`}>{children}</div>
      {foot ? <footer className="ad-card-foot">{foot}</footer> : null}
    </section>
  );
}

export function PageHead({ title, desc, actions, over }: { title: ReactNode; desc?: ReactNode; actions?: ReactNode; over?: ReactNode }) {
  return (
    <div className="ad-pagehead">
      <div>{over ? <div className="ad-overline">{over}</div> : null}<h1 className="ad-pagehead-title">{title}</h1>{desc ? <p className="ad-pagehead-desc">{desc}</p> : null}</div>
      {actions ? <div className="ad-pagehead-actions">{actions}</div> : null}
    </div>
  );
}

export function Kpi({ label, value, icon = "bars", tone = "primary", delta, hint, spark, sparkColor, aside }: { label: ReactNode; value: ReactNode; icon?: IconName; tone?: Tone; delta?: number; hint?: ReactNode; spark?: number[]; sparkColor?: string; aside?: ReactNode }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <Tile icon={icon} tone={tone} s="sm" />
        {delta != null ? <span className={`delta ${delta >= 0 ? "up" : "down"}`}><Icon name={delta >= 0 ? "trendup" : "trenddown"} size={13} />{pct(Math.abs(delta))}</span> : aside}
      </div>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {hint ? <span className="kpi-hint">{hint}</span> : null}
      {spark ? <Spark data={spark} color={sparkColor} /> : null}
    </div>
  );
}

export const Meter = ({ value, color = "var(--primary)" }: { value: number; color?: string }) => (
  <span className="meter" style={{ ["--mc" as string]: color }}><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} /></span>
);

export function Alert({ title, text, tone = "info", icon = "info", action }: { title: ReactNode; text?: ReactNode; tone?: Tone; icon?: IconName; action?: ReactNode }) {
  return (
    <div className={`ad-alert ad-tone-${tone}`} role="status">
      <span className="ad-alert-icon"><Icon name={icon} size={20} /></span>
      <div className="ad-alert-body"><span className="ad-alert-title">{title}</span>{text ? <span className="ad-alert-text">{text}</span> : null}{action ? <div className="ad-alert-action">{action}</div> : null}</div>
    </div>
  );
}

export const Empty = ({ icon, title, desc, action }: { icon: IconName; title: ReactNode; desc?: ReactNode; action?: ReactNode }) => (
  <div className="ad-empty"><span className="ad-empty-icon"><Icon name={icon} size={22} /></span><span className="ad-empty-title">{title}</span>{desc ? <span className="ad-empty-desc">{desc}</span> : null}{action ? <div className="ad-empty-action">{action}</div> : null}</div>
);

export function Pager({ total, per = 10 }: { total: number; per?: number }) {
  const last = Math.max(4, Math.ceil(total / per));
  return (
    <div className="tbl-foot">
      <span>A mostrar 1–{Math.min(per, total)} de {int(total)}</span>
      <nav className="ad-pagination" aria-label="Paginação">
        <button className="ad-page" aria-label="Anterior"><Icon name="left" size={16} /></button>
        <button className="ad-page is-active">1</button><button className="ad-page">2</button><button className="ad-page">3</button>
        <span className="ad-page-gap">…</span><button className="ad-page">{last}</button>
        <button className="ad-page" aria-label="Seguinte"><Icon name="right" size={16} /></button>
      </nav>
    </div>
  );
}

export interface Col<R> { label: ReactNode; render: (r: R, i: number) => ReactNode; num?: boolean; key?: string }
export function Table<R>({ cols, rows, onRow, rowKey, dense, className = "", total, per }: { cols: Col<R>[]; rows: R[]; onRow?: (r: R) => void; rowKey: (r: R, i: number) => string; dense?: boolean; className?: string; total?: number; per?: number }) {
  return (
    <>
      <div className="ad-table-wrap">
        <table className={`ad-table ${dense ? "is-dense" : ""} ${className}`}>
          <thead><tr>{cols.map((c, i) => <th key={i} className={c.num ? "num" : ""}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={rowKey(r, i)} className={onRow ? "click" : ""} onClick={onRow ? () => onRow(r) : undefined}>
                {cols.map((c, j) => <td key={j} className={c.num ? "num" : ""} data-label={typeof c.label === "string" ? c.label : ""}>{c.render(r, i)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total != null ? <Pager total={total} per={per} /> : null}
    </>
  );
}

export const CellUser = ({ name, sub, avatar = true }: { name: string; sub?: ReactNode; avatar?: boolean }) => (
  <div className="cell-user">{avatar ? <Avatar name={name} /> : null}<div><b>{name}</b>{sub ? <small>{sub}</small> : null}</div></div>
);

/** Etiqueta de estado com cor semântica. */
const STATUS: Record<string, [string, Tone]> = {
  approved: ["Aprovada", "success"], pending: ["Pendente", "warning"], declined: ["Recusada", "danger"], refunded: ["Reembolsada", "neutral"], chargeback: ["Chargeback", "danger"], expired: ["Expirada", "neutral"],
  active: ["Ativo", "success"], in_review: ["Em análise", "warning"], draft: ["Rascunho", "neutral"], suspended: ["Suspenso", "danger"],
  past_due: ["Em atraso", "warning"], canceled: ["Cancelada", "neutral"],
  paid: ["Pago", "success"], processing: ["Em processamento", "info"], failed: ["Falhou", "danger"], rejected: ["Rejeitado", "danger"],
  verified: ["Verificado", "success"], blocked: ["Bloqueado", "danger"],
  open: ["Aberta", "warning"], won: ["Ganha", "success"], lost: ["Perdida", "danger"], resolved: ["Resolvida", "success"],
  expired_coupon: ["Expirado", "neutral"],
};
export const Status = ({ s, label }: { s: string; label?: string }) => { const [l, t] = STATUS[s] ?? [s, "neutral"]; return <Badge tone={t} dot>{label ?? l}</Badge>; };

export const Method = ({ m }: { m: PaymentMethod | PayoutDestinationKind }) => (
  <span className={`pm pm-${m}`}><i />{m === "bank" ? "Banco" : METHODS[m].label}</span>
);
export { PayLogo, maskPhone };

export function Spark({ data, color = "var(--primary)", w = 120, h = 32 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i * w) / (data.length - 1), h - 2 - ((v - min) / (max - min || 1)) * (h - 4)]);
  const l = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  return (
    <svg className="vq-spark" width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ ["--sc" as string]: color }} aria-hidden="true">
      <path className="a" d={`${l}L${w},${h}L0,${h}Z`} /><path className="l" d={l} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Timeline({ items }: { items: { title: ReactNode; sub?: ReactNode; tone: Tone; icon: IconName }[] }) {
  return (
    <ol className="timeline">
      {items.map((it, i) => (
        <li key={i} className={`ad-tone-${it.tone}`}><span className="tl-dot"><Icon name={it.icon} size={13} /></span><div className="tl-body"><b>{it.title}</b>{it.sub ? <small>{it.sub}</small> : null}</div></li>
      ))}
    </ol>
  );
}

export function Skeleton({ h = 120 }: { h?: number }) { return <div className="ad-skel" style={{ height: h, borderRadius: 16 }} />; }
export function Loading({ rows = 3 }: { rows?: number }) {
  return <div className="stack-sm" aria-busy="true" aria-label="A carregar">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={i ? 64 : 120} />)}</div>;
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return <Alert tone="danger" icon="alert" title="Não foi possível carregar estes dados" text={error instanceof Error ? error.message : "Verifique a ligação e tente outra vez."} action={retry ? <Btn s="sm" onClick={retry}>Tentar outra vez</Btn> : undefined} />;
}

export const useFieldId = () => useId().replace(/:/g, "");
export const Cover = ({ cover, icon, lg }: { cover: string; icon: IconName; lg?: boolean }) => <span className={`cover ${lg ? "lg" : ""} cv-${cover}`}><Icon name={icon} size={lg ? 26 : 18} /></span>;
