import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { KpiCard, SectionHead, PatientRow } from "@/components/shell-ui";
import { usePatientsOverview, useAgenda } from "@/lib/queries";
import { formatHora } from "@/lib/utils";
import type { AppointmentTipo, PatientClinical } from "@/lib/types";

const AGENDA_ICO: Record<AppointmentTipo, IconName> = {
  round: "stethoscope",
  evolucao: "penLine",
  risco: "shield",
  alta: "alta",
  reuniao: "pacientes",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const longDate = () =>
  new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function PainelPage() {
  const navigate = useNavigate();
  const overview = usePatientsOverview();
  const agenda = useAgenda();

  const list = overview.data ?? [];
  const internados = list.filter((p) => p.status === "internado").length;
  const altas = list.filter((p) => p.status === "alta-elaboracao").length;
  const pendentes = list.reduce((n, p) => n + (p.evolucoesPendentes || 0), 0);
  const emRisco = list.filter((p) => (p.clinical as PatientClinical)?.risco === "alto").length;

  const precisam = list
    .filter(
      (p) =>
        p.evolucoesPendentes > 0 ||
        (p.clinical as PatientClinical)?.risco === "alto" ||
        p.status === "alta-elaboracao",
    )
    .sort(
      (a, b) =>
        Number((b.clinical as PatientClinical)?.risco === "alto") -
        Number((a.clinical as PatientClinical)?.risco === "alto"),
    );

  const compromissos = agenda.data ?? [];

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div className="grow">
          <div className="eyebrow">{longDate()}</div>
          <h1 className="h1" style={{ marginTop: 6 }}>
            {greeting()}
          </h1>
          <div className="sub">
            Você tem{" "}
            <strong style={{ color: "var(--text-strong)" }}>
              {pendentes} {pendentes === 1 ? "evolução pendente" : "evoluções pendentes"}
            </strong>{" "}
            e{" "}
            <strong style={{ color: "var(--text-strong)" }}>
              {altas} {altas === 1 ? "alta" : "altas"}
            </strong>{" "}
            em elaboração.
          </div>
        </div>
        <div className="desktop-only" style={{ display: "flex", gap: 10 }}>
          <Button
            variant="outline"
            icon={<Icon name="pacientes" size={17} />}
            onClick={() => navigate("/pacientes")}
          >
            Pacientes
          </Button>
          <Button
            variant="primary"
            icon={<Icon name="sparkles" size={17} />}
            onClick={() => navigate("/ia")}
          >
            Nova evolução
          </Button>
        </div>
      </div>

      <div className="grid cols-4 kpi-strip" style={{ marginBottom: "var(--section-gap)" }}>
        <KpiCard icon="bed" tint="tint-brand" num={internados} label="Pacientes internados" />
        <KpiCard
          icon="penLine"
          tint="tint-amber"
          num={pendentes}
          label="Evoluções pendentes"
          foot="hoje"
        />
        <KpiCard
          icon="alta"
          tint="tint-emerald"
          num={altas}
          label="Altas em elaboração"
        />
        <KpiCard
          icon="shield"
          tint="tint-amber"
          num={emRisco}
          label="Em risco alto"
          foot="vigilância"
          footIcon="warning"
        />
      </div>

      <div className="split">
        {/* esquerda — pacientes que precisam de atenção */}
        <div className="surface surface-pad">
          <SectionHead
            title="Precisam de você"
            sub={`${precisam.length} ${precisam.length === 1 ? "paciente" : "pacientes"} com pendência ou risco`}
            action="Ver todos"
            actionIcon="arrowRight"
            onAction={() => navigate("/pacientes")}
          />
          {precisam.length ? (
            <div className="rows">
              {precisam.map((p) => (
                <PatientRow key={p.id} p={p} onClick={() => navigate(`/pacientes/${p.id}`)} />
              ))}
            </div>
          ) : (
            <p className="muted" style={{ padding: "8px 6px", fontSize: ".92rem" }}>
              {overview.isLoading
                ? "Carregando pacientes…"
                : "Nenhuma pendência no momento. Tudo em dia."}
            </p>
          )}
        </div>

        {/* direita — agenda + nudge de IA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="surface surface-pad">
            <SectionHead
              title="Agenda de hoje"
              action="Ver agenda"
              actionIcon="arrowRight"
              onAction={() => navigate("/agenda")}
            />
            {compromissos.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {compromissos.map((a) => (
                  <div
                    key={a.id}
                    className="row"
                    style={{ padding: "10px 4px", cursor: a.patientId ? "pointer" : "default" }}
                    onClick={a.patientId ? () => navigate(`/pacientes/${a.patientId}`) : undefined}
                  >
                    <span
                      className="tnum faint"
                      style={{ fontSize: ".82rem", fontWeight: 600, width: 46, flex: "0 0 46px" }}
                    >
                      {formatHora(a.scheduledAt)}
                    </span>
                    <span
                      className="kpi-ico tint-brand"
                      style={{ width: 30, height: 30, flex: "0 0 30px", borderRadius: 9 }}
                    >
                      <Icon name={AGENDA_ICO[a.tipo] || "clock"} size={15} />
                    </span>
                    <span
                      style={{
                        fontSize: ".88rem",
                        color: "var(--text-strong)",
                        fontWeight: 520,
                        minWidth: 0,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.titulo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ padding: "4px 6px", fontSize: ".9rem" }}>
                Nada agendado para hoje.
              </p>
            )}
          </div>

          {/* nudge de IA */}
          <div className="ai-surface">
            <div className="ai-head">
              <span className="ai-spark">
                <Icon name="sparkles" size={17} />
              </span>
              <div>
                <div className="ai-title">Assistente clínico</div>
                <div className="ai-sub">Acelere a evolução com transcrição</div>
              </div>
            </div>
            <div style={{ padding: "16px 22px 20px" }}>
              <p className="clin" style={{ margin: "0 0 14px", fontSize: ".9rem" }}>
                Grave a entrevista e a IA monta um rascunho SOAP estruturado para você revisar e
                assinar.
              </p>
              <Button
                variant="ai"
                size="sm"
                icon={<Icon name="mic" size={16} />}
                onClick={() => navigate("/ia")}
              >
                Nova evolução com IA
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
