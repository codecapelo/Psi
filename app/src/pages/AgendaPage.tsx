import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { Button, Field, Input, Select, Modal, EmptyState } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { KpiCard, SectionHead } from "@/components/shell-ui";
import { useAgenda, agendaKey, usePatientsOverview } from "@/lib/queries";
import { formatHora } from "@/lib/utils";
import type { AppointmentTipo } from "@/lib/types";
import { useToast } from "@/context/ToastContext";

const META: Record<AppointmentTipo, { ico: IconName; tint: string; dot: string; label: string }> = {
  round: { ico: "stethoscope", tint: "tint-brand", dot: "var(--brand)", label: "Round" },
  evolucao: { ico: "penLine", tint: "tint-brand", dot: "var(--brand)", label: "Evolução" },
  risco: { ico: "shield", tint: "tint-amber", dot: "#d97706", label: "Avaliação de risco" },
  alta: { ico: "alta", tint: "tint-emerald", dot: "#10895a", label: "Alta" },
  reuniao: { ico: "pacientes", tint: "tint-teal", dot: "var(--accent)", label: "Reunião" },
};

function dayISO(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

const longDate = (iso: string) => {
  const s = new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

type Dia = "ontem" | "hoje" | "amanha";
const OFFSET: Record<Dia, number> = { ontem: -1, hoje: 0, amanha: 1 };

export default function AgendaPage() {
  const navigate = useNavigate();
  const [dia, setDia] = useState<Dia>("hoje");
  const [showNew, setShowNew] = useState(false);
  const date = dayISO(OFFSET[dia]);
  const agenda = useAgenda(date);
  const list = agenda.data ?? [];

  const nEvol = list.filter((a) => a.tipo === "evolucao").length;
  const nAlta = list.filter((a) => a.tipo === "alta").length;

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div className="grow">
          <div className="eyebrow">Organização do dia</div>
          <h1 className="h1" style={{ marginTop: 6 }}>
            Agenda
          </h1>
          <div className="sub">{longDate(date)}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="segmented desktop-only">
            {(["ontem", "hoje", "amanha"] as Dia[]).map((d) => (
              <button key={d} className={dia === d ? "on" : ""} onClick={() => setDia(d)}>
                {d === "ontem" ? "Ontem" : d === "hoje" ? "Hoje" : "Amanhã"}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name="plus" size={16} />}
            onClick={() => setShowNew(true)}
          >
            Novo
          </Button>
        </div>
      </div>

      <div className="grid cols-3 kpi-strip" style={{ marginBottom: "var(--section-gap)" }}>
        <KpiCard icon="agenda" tint="tint-brand" num={list.length} label="Compromissos" />
        <KpiCard icon="penLine" tint="tint-amber" num={nEvol} label="Evoluções agendadas" />
        <KpiCard icon="alta" tint="tint-emerald" num={nAlta} label="Altas previstas" />
      </div>

      <div className="surface surface-pad">
        <SectionHead title="Linha do tempo" sub={`Compromissos de ${dia === "hoje" ? "hoje" : dia === "ontem" ? "ontem" : "amanhã"}`} />
        {list.length ? (
          <div className="agenda-list">
            {list.map((a) => {
              const m = META[a.tipo] ?? META.reuniao;
              return (
                <div key={a.id} className="agenda-item">
                  <div className="agenda-time tnum">{formatHora(a.scheduledAt)}</div>
                  <div className="agenda-rail">
                    <span className="agenda-dot" style={{ backgroundColor: m.dot }} />
                  </div>
                  <div
                    className={"agenda-card" + (a.patientId ? " clickable" : "")}
                    onClick={a.patientId ? () => navigate(`/pacientes/${a.patientId}`) : undefined}
                    role={a.patientId ? "button" : undefined}
                  >
                    <span
                      className={"kpi-ico " + m.tint}
                      style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: 10 }}
                    >
                      <Icon name={m.ico} size={17} />
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: ".94rem" }}>
                        {a.titulo}
                      </div>
                      <div className="faint" style={{ fontSize: ".8rem", marginTop: 1 }}>
                        {m.label}
                        {a.local ? " · " + a.local : ""}
                      </div>
                    </div>
                    {a.patientId && <Icon name="chevronRight" size={17} className="row-chev" />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="agenda" size={26} />}
            title="Nada agendado"
            description={agenda.isLoading ? "Carregando…" : "Não há compromissos para este dia."}
          />
        )}
      </div>

      <NewAppointmentModal open={showNew} onClose={() => setShowNew(false)} date={date} />
    </div>
  );
}

// --------------------------------------------------------------------------
function NewAppointmentModal({
  open,
  onClose,
  date,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const overview = usePatientsOverview();
  const [tipo, setTipo] = useState<AppointmentTipo>("reuniao");
  const [titulo, setTitulo] = useState("");
  const [hora, setHora] = useState("09:00");
  const [local, setLocal] = useState("");
  const [patientId, setPatientId] = useState("");

  const create = useMutation({
    mutationFn: () =>
      apiClient.agenda.create({
        tipo,
        titulo: titulo.trim(),
        local: local.trim() || null,
        patientId: patientId || null,
        scheduledAt: new Date(`${date}T${hora}:00`).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendaKey(date) });
      toast("Compromisso adicionado.", "success");
      setTitulo("");
      setLocal("");
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro", "error"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Novo compromisso" size="md">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Tipo">
          <Select className="select-chevron" value={tipo} onChange={(e) => setTipo(e.target.value as AppointmentTipo)}>
            <option value="round">Round</option>
            <option value="evolucao">Evolução</option>
            <option value="risco">Avaliação de risco</option>
            <option value="alta">Alta</option>
            <option value="reuniao">Reunião</option>
          </Select>
        </Field>
        <Field label="Título" required>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Round da enfermaria B" />
        </Field>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Hora">
            <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </Field>
          <Field label="Local">
            <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Opcional" />
          </Field>
        </div>
        <Field label="Paciente (opcional)">
          <Select className="select-chevron" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">— Nenhum —</option>
            {(overview.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" disabled={!titulo.trim()} loading={create.isPending} onClick={() => create.mutate()}>
          Adicionar
        </Button>
      </div>
    </Modal>
  );
}
