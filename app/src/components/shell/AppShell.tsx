import { type ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications, usePatientsOverview } from "@/lib/queries";
import { Sidebar } from "./Sidebar";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfileModal } from "./ProfileModal";
import { titleForPath } from "./nav";

function MobileTab({
  label,
  icon,
  active,
  onClick,
  badge,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button className={"tab " + (active ? "active" : "")} onClick={onClick}>
      <Icon name={icon} size={22} />
      <span className="lbl">{label}</span>
      {badge ? <span className="tab-badge">{badge}</span> : null}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { prefs, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: notifs = [] } = useNotifications();
  const overview = usePatientsOverview();
  const pendentes = overview.data?.reduce((n, p) => n + (p.evolucoesPendentes || 0), 0) ?? 0;
  const unread = notifs.filter((n) => !n.read).length;

  const title = titleForPath(location.pathname);
  // Dentro do wizard de exame: esconde a sidebar e as tabs (ele tem chrome próprio).
  const inExam = location.pathname.startsWith("/exame/");
  const path = location.pathname;

  return (
    <div className="app">
      <div className="app-body">
        {!inExam && <Sidebar onProfile={() => setProfileOpen(true)} />}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          {/* Topbar desktop */}
          <header className="topbar desktop-only">
            <div className="topbar-title">
              <span className="topbar-eyebrow">{title.eye}</span>
              <span className="topbar-h">{title.t}</span>
            </div>
            <div
              className="searchbox"
              role="search"
              onClick={() => navigate("/pacientes")}
            >
              <Icon name="search" size={17} />
              <input
                placeholder="Buscar paciente, leito ou diagnóstico…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate("/pacientes");
                }}
              />
              <kbd>/</kbd>
            </div>
            <button
              className="icon-btn"
              title={prefs.dark ? "Tema claro" : "Tema escuro"}
              onClick={toggle}
            >
              <Icon name={prefs.dark ? "sun" : "moon"} size={18} />
            </button>
            <button className="icon-btn" title="Notificações" onClick={() => setNotifOpen(true)}>
              <Icon name="bell" size={18} />
              {unread ? <span className="notif-badge">{unread}</span> : null}
            </button>
            <button className="icon-btn" title="Conta" onClick={() => setProfileOpen(true)}>
              <Icon name="user" size={18} />
            </button>
          </header>

          {/* Topbar mobile */}
          <header className="mobile-top">
            <span className="brand-logo">
              <Icon name="stethoscope" size={17} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mt-eyebrow">{title.eye}</div>
              <div className="mt-title">{title.t}</div>
            </div>
            <button
              className="icon-btn"
              style={{ width: 38, height: 38, flexBasis: 38 }}
              onClick={() => setNotifOpen(true)}
            >
              <Icon name="bell" size={18} />
              {unread ? <span className="notif-badge">{unread}</span> : null}
            </button>
            <button
              className="icon-btn"
              style={{ width: 38, height: 38, flexBasis: 38 }}
              onClick={toggle}
            >
              <Icon name={prefs.dark ? "sun" : "moon"} size={18} />
            </button>
          </header>

          <main className="main">{children}</main>
        </div>
      </div>

      {/* Tabs mobile + FAB (escondidos no wizard) */}
      {!inExam && (
        <>
          <nav className="tabbar">
            <MobileTab
              label="Painel"
              icon="painel"
              active={path === "/"}
              onClick={() => navigate("/")}
            />
            <MobileTab
              label="Pacientes"
              icon="pacientes"
              active={path.startsWith("/pacientes")}
              onClick={() => navigate("/pacientes")}
              badge={pendentes}
            />
            <div style={{ width: 56, flex: "0 0 56px" }} />
            <MobileTab
              label="IA"
              icon="sparkles"
              active={path.startsWith("/ia")}
              onClick={() => navigate("/ia")}
            />
            <MobileTab
              label="Conta"
              icon="user"
              active={profileOpen}
              onClick={() => setProfileOpen(true)}
            />
          </nav>
          <button
            className="fab mobile-only"
            title="Nova evolução"
            onClick={() => navigate("/pacientes")}
          >
            <Icon name="plus" size={24} />
          </button>
        </>
      )}

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
