import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon, type IconName } from "@/components/Icon";
import apiClient from "@/lib/api";
import { useNotifications, notificationsKey } from "@/lib/queries";
import { relativeFromNow } from "@/lib/utils";
import type { Notification, NotificationTipo } from "@/lib/types";

const META: Record<NotificationTipo, { ico: IconName; tint: string }> = {
  risco: { ico: "shield", tint: "tint-amber" },
  evolucao: { ico: "penLine", tint: "tint-brand" },
  alta: { ico: "alta", tint: "tint-emerald" },
  medicacao: { ico: "pill", tint: "tint-teal" },
  exame: { ico: "activity", tint: "tint-brand" },
};

export function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: notifs = [] } = useNotifications();

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey }),
  });
  const markAll = useMutation({
    mutationFn: () => apiClient.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey }),
  });

  if (!open) return null;
  const unread = notifs.filter((n) => !n.read).length;

  const onItem = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.patientId) {
      navigate(`/pacientes/${n.patientId}`);
      onClose();
    }
  };

  return (
    <>
      <div className="notif-scrim" onClick={onClose} />
      <div className="notif-panel" role="dialog" aria-label="Notificações">
        <div className="notif-head">
          <div>
            <div className="notif-title">Notificações</div>
            <div className="notif-sub faint">
              {unread ? `${unread} não lidas` : "Tudo em dia"}
            </div>
          </div>
          {unread > 0 && (
            <button className="link-btn" onClick={() => markAll.mutate()}>
              Marcar todas
            </button>
          )}
        </div>
        <div className="notif-list">
          {notifs.length ? (
            notifs.map((n) => {
              const m = META[n.tipo] ?? META.evolucao;
              return (
                <button
                  key={n.id}
                  className={"notif-item" + (n.read ? "" : " unread")}
                  onClick={() => onItem(n)}
                >
                  <span
                    className={"kpi-ico " + m.tint}
                    style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: 10 }}
                  >
                    <Icon name={m.ico} size={16} />
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="notif-it-title">{n.titulo}</div>
                    {n.descricao && <div className="notif-it-desc">{n.descricao}</div>}
                    <div className="notif-it-when faint">{relativeFromNow(n.createdAt)}</div>
                  </div>
                  {!n.read && <span className="notif-unread-dot" />}
                </button>
              );
            })
          ) : (
            <div style={{ padding: "30px 16px", textAlign: "center" }}>
              <span className="muted">Nenhuma notificação</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
