import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import { usePatientsOverview } from "@/lib/queries";
import { cn, initials } from "@/lib/utils";
import { NAV_CLINICA, NAV_SISTEMA, type NavEntry } from "./nav";

function NavItem({ entry, badge }: { entry: NavEntry; badge?: number }) {
  return (
    <NavLink
      to={entry.to}
      end={entry.end}
      className={({ isActive }) => cn("nav-item", isActive && "active")}
    >
      <Icon name={entry.icon} size={19} />
      <span className="lbl">{entry.label}</span>
      {badge ? <span className="nav-badge">{badge}</span> : null}
    </NavLink>
  );
}

export function Sidebar({ onProfile }: { onProfile: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const overview = usePatientsOverview();
  const pendentes =
    overview.data?.reduce((n, p) => n + (p.evolucoesPendentes || 0), 0) ?? 0;

  const name = user?.email ?? "Profissional";

  return (
    <aside className="sidebar">
      <div className="brand-mark">
        <span className="brand-logo">
          <Icon name="stethoscope" size={19} />
        </span>
        <div className="brand-text">
          <div className="brand-name">
            SOP<b>si</b>
          </div>
          <div className="brand-sub">Prontuário psiquiátrico</div>
        </div>
      </div>

      <div style={{ padding: "4px 4px 8px" }}>
        <Button
          variant="primary"
          icon={<Icon name="plus" size={17} />}
          className="w-full"
          onClick={() => navigate("/pacientes")}
        >
          <span className="lbl">Nova evolução</span>
        </Button>
      </div>

      <div className="nav-group-label">Clínica</div>
      {NAV_CLINICA.map((e) => (
        <NavItem key={e.to} entry={e} badge={e.to === "/pacientes" ? pendentes : undefined} />
      ))}

      <div className="nav-group-label">Sistema</div>
      {NAV_SISTEMA.filter((e) => !e.admin || user?.isAdmin).map((e) => (
        <NavItem key={e.to} entry={e} />
      ))}

      <div className="sidebar-spacer" />
      <div className="sidebar-foot">
        <div className="user-chip" onClick={onProfile} role="button" tabIndex={0}>
          <span className="avatar">{initials(name)}</span>
          <div className="user-meta">
            <div className="user-name">{name}</div>
            <div className="user-role">Psiquiatra</div>
          </div>
          <Icon name="chevronRight" size={16} className="faint" />
        </div>
      </div>
    </aside>
  );
}
