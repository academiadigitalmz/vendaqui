import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, type Notification } from "@/api/endpoints";
import { Btn, Card, Empty, ErrorState, IconBtn, PageHead, Tile } from "@/components/ui";
import type { IconName } from "@/lib/icons";

type NotificationAudience = "user" | "backoffice";
type NotificationArea = "student" | "seller" | "admin";

const pagePath = (area: NotificationArea) =>
  area === "admin"
    ? "/admin/notificacoes"
    : area === "seller"
      ? "/produtor/notificacoes"
      : "/aluno/notificacoes";

const notificationIcon = (type: string): IconName => {
  if (type.startsWith("payout_")) return "cash";
  if (type === "purchase_available") return "book";
  if (type.startsWith("seller_")) return "idcard";
  return "bell";
};

const notificationTone = (type: string) => {
  if (type.endsWith("failed") || type.endsWith("rejected") || type.includes("attention"))
    return "danger" as const;
  if (type.endsWith("approved") || type.endsWith("completed") || type === "purchase_available")
    return "success" as const;
  return "info" as const;
};

const relativeDate = (value: string) => {
  const elapsed = new Date(value).getTime() - Date.now();
  const minutes = Math.round(elapsed / 60_000);
  const formatter = new Intl.RelativeTimeFormat("pt-MZ", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return formatter.format(days, "day");
  return new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
};

const actionPath = (notification: Notification, area: NotificationArea) => {
  const path = notification.actionUrl;
  if (!path) return pagePath(area);
  if (path === "/library") return "/aluno";
  if (path === "/seller/verification") return "/produtor/verificacao";
  if (path.startsWith("/seller/payouts/")) return "/produtor/financeiro";
  if (path.startsWith("/backoffice/payouts/")) return "/admin/saques";
  if (path.startsWith("/backoffice/payments/")) return "/admin/encomendas";
  return path.replace(/^\/seller/, "/produtor").replace(/^\/backoffice/, "/admin");
};

function NotificationRow({
  notification,
  compact,
  onOpen,
}: {
  notification: Notification;
  compact?: boolean;
  onOpen: (notification: Notification) => void;
}) {
  return (
    <button
      type="button"
      className={`notification-row ${compact ? "is-compact" : ""} ${notification.readAt ? "" : "is-unread"}`}
      onClick={() => onOpen(notification)}
    >
      <Tile
        icon={notificationIcon(notification.type)}
        tone={notificationTone(notification.type)}
        s="sm"
      />
      <span className="notification-copy">
        <span className="notification-title">{notification.title}</span>
        <span className="notification-body">{notification.body}</span>
        <span className="notification-time">{relativeDate(notification.createdAt)}</span>
      </span>
      {!notification.readAt && <span className="notification-unread" aria-label="Não lida" />}
    </button>
  );
}

export function NotificationBell({
  audience,
  area,
}: {
  audience: NotificationAudience;
  area: NotificationArea;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const client = useQueryClient();
  const count = useQuery({
    queryKey: ["notifications", audience, "unread-count"],
    queryFn: () => api.notifications.unreadCount(audience),
    refetchInterval: 30_000,
  });
  const recent = useQuery({
    queryKey: ["notifications", audience, "recent"],
    queryFn: () => api.notifications.list(audience, 1, 5),
    enabled: open,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["notifications", audience] });
  const read = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(audience, id),
    onSuccess: refresh,
  });
  const readAll = useMutation({
    mutationFn: () => api.notifications.markAllRead(audience),
    onSuccess: refresh,
  });

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const openNotification = async (notification: Notification) => {
    if (!notification.readAt) await read.mutateAsync(notification.id);
    setOpen(false);
    navigate(actionPath(notification, area));
  };

  return (
    <div className="notification-bell" ref={root}>
      <IconBtn
        icon="bell"
        label="Notificações"
        badge={count.data?.count ? Math.min(count.data.count, 99) : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <section className="notification-popover" aria-label="Notificações">
          <header className="notification-popover-head">
            <div>
              <strong>Notificações</strong>
              {count.data?.count ? (
                <span>
                  {count.data.count} não lida{count.data.count === 1 ? "" : "s"}
                </span>
              ) : (
                <span>Tudo em dia</span>
              )}
            </div>
            {count.data?.count ? (
              <button type="button" onClick={() => readAll.mutate()}>
                Marcar todas como lidas
              </button>
            ) : null}
          </header>
          <div className="notification-popover-list">
            {recent.isPending && (
              <div className="notification-loading">
                <span className="ad-spinner" />
              </div>
            )}
            {recent.isError && (
              <div className="notification-inline-error">
                Não foi possível carregar as notificações.
              </div>
            )}
            {recent.data?.items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                compact
                onOpen={openNotification}
              />
            ))}
            {recent.data && !recent.data.items.length && (
              <Empty icon="bell" title="Sem notificações" />
            )}
          </div>
          <Link
            className="notification-popover-foot"
            to={pagePath(area)}
            onClick={() => setOpen(false)}
          >
            Ver todas as notificações
          </Link>
        </section>
      )}
    </div>
  );
}

export function NotificationsPage({
  audience,
  area,
}: {
  audience: NotificationAudience;
  area: NotificationArea;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", audience, "all"],
    queryFn: () => api.notifications.list(audience, 1, 50),
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["notifications", audience] });
  const read = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(audience, id),
    onSuccess: refresh,
  });
  const readAll = useMutation({
    mutationFn: () => api.notifications.markAllRead(audience),
    onSuccess: refresh,
  });
  if (query.isPending)
    return (
      <div className="notification-page-loading">
        <span className="ad-spinner" />
      </div>
    );
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />;

  const unread = query.data.items.filter((notification) => !notification.readAt).length;
  const openNotification = async (notification: Notification) => {
    if (!notification.readAt) await read.mutateAsync(notification.id);
    const target = actionPath(notification, area);
    if (target !== location.pathname) navigate(target);
  };

  return (
    <>
      <PageHead
        title="Notificações"
        desc="Actualizações importantes sobre compras, perfil e operações."
        actions={
          unread ? (
            <Btn s="sm" onClick={() => readAll.mutate()} loading={readAll.isPending}>
              Marcar todas como lidas
            </Btn>
          ) : undefined
        }
      />
      <Card flush className="notification-page-card">
        {query.data.items.length ? (
          <div className="notification-page-list">
            {query.data.items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpen={openNotification}
              />
            ))}
          </div>
        ) : (
          <Empty
            icon="bell"
            title="Ainda não existem notificações"
            desc="As actualizações importantes aparecerão aqui."
          />
        )}
      </Card>
    </>
  );
}
