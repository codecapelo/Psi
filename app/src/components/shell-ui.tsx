// ==========================================================================
// Helpers de UI do shell SOPsi 2.0 — peças compartilhadas pelas telas (Painel,
// Pacientes, Prontuário…). Usam as classes do shell.css (.surface/.kpi/.row/
// .pill…) e o Icon. Recriação tipada do `ui.jsx` do protótipo.
// ==========================================================================
import { type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  PatientClinical,
  PatientOverview,
  PatientOverviewStatus,
  RiscoNivel,
} from "@/lib/types";

// --------------------------------------------------------------------------
// Pills / status / risco
// --------------------------------------------------------------------------
type PillKind =
  | "pill-slate"
  | "pill-brand"
  | "pill-teal"
  | "pill-amber"
  | "pill-emerald";

export function Pill({
  kind = "pill-slate",
  dot = false,
  className,
  style,
  children,
}: {
  kind?: PillKind;
  dot?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span className={cn("pill", kind, className)} style={style}>
      {dot && <span className="pill-dot" />}
      {children}
    </span>
  );
}

export const statusMeta: Record<PatientOverviewStatus, { label: string; pill: PillKind }> = {
  internado: { label: "Internado", pill: "pill-teal" },
  "alta-elaboracao": { label: "Alta em elaboração", pill: "pill-amber" },
};

export const riscoMeta: Record<RiscoNivel, { label: string; pill: PillKind }> = {
  baixo: { label: "Risco baixo", pill: "pill-slate" },
  moderado: { label: "Risco moderado", pill: "pill-amber" },
  alto: { label: "Risco alto", pill: "pill-amber" },
};

export function StatusPill({ status }: { status?: PatientOverviewStatus | null }) {
  if (!status) return null;
  const m = statusMeta[status];
  return (
    <Pill kind={m.pill} dot>
      {m.label}
    </Pill>
  );
}

export function RiskPill({ risco }: { risco?: RiscoNivel | null }) {
  if (!risco) return null;
  const m = riscoMeta[risco];
  return (
    <span className={cn("pill", m.pill)}>
      {risco === "alto" ? <Icon name="warning" size={12} /> : <span className="pill-dot" />}
      {m.label}
    </span>
  );
}

// --------------------------------------------------------------------------
// Avatar
// --------------------------------------------------------------------------
export function PatientAvatar({ name, size }: { name: string; size?: number }) {
  return (
    <div
      className="pt-avatar"
      style={size ? { width: size, height: size, flexBasis: size } : undefined}
    >
      {initials(name)}
    </div>
  );
}

// --------------------------------------------------------------------------
// KPI card
// --------------------------------------------------------------------------
export function KpiCard({
  icon,
  tint,
  num,
  label,
  foot,
  footIcon,
  footClass,
}: {
  icon: IconName;
  tint: string;
  num: ReactNode;
  label: string;
  foot?: ReactNode;
  footIcon?: IconName;
  footClass?: string;
}) {
  return (
    <div className="surface kpi">
      <div className="kpi-top">
        <div className={cn("kpi-ico", tint)}>
          <Icon name={icon} size={19} />
        </div>
        {foot != null && (
          <span className={cn("kpi-foot", footClass || "faint")}>
            {footIcon && <Icon name={footIcon} size={13} />}
            {foot}
          </span>
        )}
      </div>
      <div>
        <div className="kpi-num">{num}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Section header
// --------------------------------------------------------------------------
export function SectionHead({
  title,
  sub,
  action,
  onAction,
  actionIcon,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  actionIcon?: IconName;
}) {
  return (
    <div className="sec-head">
      <div className="grow">
        <div className="sec-title">{title}</div>
        {sub && <div className="sec-sub">{sub}</div>}
      </div>
      {action && (
        <button className="link-btn" onClick={onAction}>
          {action}
          {actionIcon && <Icon name={actionIcon} size={15} />}
        </button>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Patient row (lista/painel) — opera sobre o PatientOverview enriquecido.
// --------------------------------------------------------------------------
function metaLine(p: PatientOverview): string {
  const clinical = (p.clinical ?? {}) as PatientClinical;
  const parts = [
    p.diagnostico?.nosologico,
    clinical.leito,
  ].filter((x): x is string => !!x && x.trim().length > 0);
  if (parts.length) return parts.join(" · ");
  return p.summary?.trim() || "Sem episódio aberto";
}

export function PatientRow({
  p,
  onClick,
  trailing,
}: {
  p: PatientOverview;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div
      className="row row-pad"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <PatientAvatar name={p.name} />
      <div className="row-main">
        <div className="row-name">
          {p.name}
          {p.evolucoesPendentes > 0 && (
            <span className="pill pill-brand" style={{ fontSize: ".66rem", padding: "1px 7px" }}>
              {p.evolucoesPendentes} pend.
            </span>
          )}
        </div>
        <div className="row-meta">{metaLine(p)}</div>
      </div>
      {trailing || (
        <div className="row-aside">
          <StatusPill status={p.status} />
          {p.diasInternado != null && (
            <span className="faint" style={{ fontSize: ".76rem" }}>
              {p.diasInternado}º dia
            </span>
          )}
        </div>
      )}
      <Icon name="chevronRight" size={18} className="row-chev" />
    </div>
  );
}
