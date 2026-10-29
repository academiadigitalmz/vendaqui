import { useEffect, type ReactNode } from "react";
import { IconBtn } from "./ui";

function useEscape(onClose: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
}

export function Modal({ title, desc, children, foot, size = "md", onClose, noClose }: { title: ReactNode; desc?: ReactNode; children: ReactNode; foot?: ReactNode; size?: "sm" | "md" | "lg"; onClose: () => void; noClose?: boolean }) {
  useEscape(noClose ? () => {} : onClose);
  return (
    <div className="ad-overlay" onClick={(e) => { if (e.target === e.currentTarget && !noClose) onClose(); }}>
      <div className={`ad-modal ad-modal-${size}`} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        <div className="ad-modal-head"><div><h2 className="ad-modal-title">{title}</h2>{desc ? <p className="ad-modal-desc">{desc}</p> : null}</div>{noClose ? null : <IconBtn icon="x" label="Fechar" onClick={onClose} />}</div>
        <div className="ad-modal-body">{children}</div>
        {foot ? <div className="ad-modal-foot">{foot}</div> : null}
      </div>
    </div>
  );
}

export function Drawer({ over, title, sub, children, foot, onClose }: { over?: ReactNode; title: ReactNode; sub?: ReactNode; children: ReactNode; foot?: ReactNode; onClose: () => void }) {
  useEscape(onClose);
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head"><div className="stack-xs"><span className="faint" style={{ fontSize: 12 }}>{over}</span><h2 className="ad-modal-title">{title}</h2>{sub}</div><IconBtn icon="x" label="Fechar" onClick={onClose} /></div>
        <div className="drawer-body">{children}</div>
        {foot ? <div className="drawer-foot">{foot}</div> : null}
      </aside>
    </>
  );
}
