import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import apiClient from "@/lib/api";
import type { Patient, PatientClinical, PatientDetails } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Input, Select, Field, Modal, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PatientRow } from "@/components/shell-ui";
import { usePatientsOverview, overviewKey } from "@/lib/queries";

type Filtro = "todos" | "internado" | "alta-elaboracao" | "alto";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "internado", label: "Internados" },
  { id: "alta-elaboracao", label: "Alta" },
  { id: "alto", label: "Risco alto" },
];

export default function PatientsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const overview = usePatientsOverview();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [showCreate, setShowCreate] = useState(false);

  const list = useMemo(() => {
    const all = overview.data ?? [];
    return all.filter((p) => {
      const clinical = (p.clinical ?? {}) as PatientClinical;
      const hay = [p.name, p.diagnostico?.nosologico, clinical.leito, p.summary]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQ = !q || hay.includes(q.toLowerCase());
      let matchF = true;
      if (filtro === "internado") matchF = p.status === "internado";
      else if (filtro === "alta-elaboracao") matchF = p.status === "alta-elaboracao";
      else if (filtro === "alto") matchF = clinical.risco === "alto";
      return matchQ && matchF;
    });
  }, [overview.data, q, filtro]);

  // Admitir = abrir internação (admissão → evoluções → alta) e cair no wizard.
  const admit = useMutation({
    mutationFn: (patientId: string) => apiClient.episodes.startInternacao(patientId),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: overviewKey });
      navigate(`/exame/${exam.id}`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao admitir.", "error"),
  });

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div className="grow">
          <div className="eyebrow">Unidade de internação · Psiquiatria</div>
          <h1 className="h1" style={{ marginTop: 6 }}>
            Pacientes
          </h1>
          <div className="sub">
            {(overview.data?.length ?? 0)} {overview.data?.length === 1 ? "paciente" : "pacientes"} sob
            seus cuidados
          </div>
        </div>
        <div>
          <Button
            variant="primary"
            icon={<Icon name="plus" size={17} />}
            onClick={() => setShowCreate(true)}
          >
            Admitir paciente
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div className="searchbox" style={{ maxWidth: 320 }}>
          <Icon name="search" size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, diagnóstico, leito…"
          />
        </div>
        <div className="segmented">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              className={filtro === f.id ? "on" : ""}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="faint desktop-only" style={{ marginLeft: "auto", fontSize: ".84rem" }}>
          {list.length} {list.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      <div className="surface" style={{ padding: "8px 10px" }}>
        {list.length ? (
          <div className="rows">
            {list.map((p) => (
              <PatientRow key={p.id} p={p} onClick={() => navigate(`/pacientes/${p.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ padding: "28px 12px" }}>
            <EmptyState
              icon={<Icon name="search" size={26} />}
              title={
                overview.isLoading ? "Carregando pacientes…" : "Nenhum paciente encontrado"
              }
              description={
                overview.isError
                  ? "Não foi possível carregar os pacientes (servidor indisponível)."
                  : "Ajuste a busca ou troque o filtro para ver mais pacientes."
              }
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQ("");
                    setFiltro("todos");
                  }}
                >
                  Limpar filtros
                </Button>
              }
            />
          </div>
        )}
      </div>

      <CreatePatientModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(patient, doAdmit) => {
          qc.invalidateQueries({ queryKey: ["patients"] });
          qc.invalidateQueries({ queryKey: overviewKey });
          setShowCreate(false);
          if (doAdmit) admit.mutate(patient.id);
        }}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// Cadastro de paciente (com dados cadastrais opcionais). Pode "Cadastrar" ou
// "Cadastrar e admitir" (abre a internação em seguida).
// --------------------------------------------------------------------------
const EMPTY_DETAILS: PatientDetails = {
  nascimento: "",
  sexo: "",
  cpf: "",
  rg: "",
  nomeMae: "",
  nacionalidade: "",
  naturalidade: "",
  estadoCivil: "",
  profissao: "",
  escolaridade: "",
  endereco: "",
  telefone: "",
};

function cleanDetails(d: PatientDetails): PatientDetails {
  const out: PatientDetails = {};
  for (const [k, v] of Object.entries(d)) {
    const val = (v ?? "").trim();
    if (val) out[k as keyof PatientDetails] = val;
  }
  return out;
}

function CreatePatientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (patient: Patient, admit: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [externalId, setExternalId] = useState("");
  const [leito, setLeito] = useState("");
  const [details, setDetails] = useState<PatientDetails>(EMPTY_DETAILS);
  const [showMore, setShowMore] = useState(false);
  const { toast } = useToast();

  const setField = (key: keyof PatientDetails, value: string) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const reset = () => {
    setName("");
    setExternalId("");
    setLeito("");
    setDetails(EMPTY_DETAILS);
    setShowMore(false);
  };

  const create = useMutation({
    mutationFn: async (admit: boolean) => {
      const patient = await apiClient.patients.create({
        name: name.trim(),
        externalId: externalId.trim() || null,
        details: cleanDetails(details),
        clinical: leito.trim() ? { leito: leito.trim() } : undefined,
      });
      return { patient, admit };
    },
    onSuccess: ({ patient, admit }) => {
      toast(admit ? "Paciente admitido." : "Paciente cadastrado.", "success");
      reset();
      onCreated(patient, admit);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro", "error"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Admitir paciente">
      <Field label="Nome completo ou iniciais" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Maria S. A."
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Field label="ID externo" hint="Código do prontuário/sistema oficial.">
          <Input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder="Opcional"
          />
        </Field>
        <Field label="Enfermaria / leito" hint="Opcional — exibido nas listas.">
          <Input
            value={leito}
            onChange={(e) => setLeito(e.target.value)}
            placeholder="Ex.: Enf. B · 214"
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        {showMore ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Mais dados do paciente (opcional)
      </button>

      {showMore && (
        <div className="mb-2 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field label="Data de nascimento">
            <Input
              type="date"
              value={details.nascimento ?? ""}
              onChange={(e) => setField("nascimento", e.target.value)}
            />
          </Field>
          <Field label="Sexo / Gênero">
            <Select value={details.sexo ?? ""} onChange={(e) => setField("sexo", e.target.value)}>
              <option value="">—</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </Select>
          </Field>
          <Field label="CPF">
            <Input value={details.cpf ?? ""} onChange={(e) => setField("cpf", e.target.value)} placeholder="000.000.000-00" />
          </Field>
          <Field label="RG">
            <Input value={details.rg ?? ""} onChange={(e) => setField("rg", e.target.value)} />
          </Field>
          <Field label="Nome da mãe" className="sm:col-span-2">
            <Input value={details.nomeMae ?? ""} onChange={(e) => setField("nomeMae", e.target.value)} />
          </Field>
          <Field label="Telefone">
            <Input value={details.telefone ?? ""} onChange={(e) => setField("telefone", e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Endereço">
            <Input value={details.endereco ?? ""} onChange={(e) => setField("endereco", e.target.value)} placeholder="Rua, nº, bairro, cidade/UF" />
          </Field>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="outline"
          onClick={() => create.mutate(false)}
          loading={create.isPending && create.variables === false}
          disabled={!name.trim() || create.isPending}
        >
          Só cadastrar
        </Button>
        <Button
          onClick={() => create.mutate(true)}
          loading={create.isPending && create.variables === true}
          disabled={!name.trim() || create.isPending}
        >
          Cadastrar e admitir
        </Button>
      </div>
    </Modal>
  );
}
