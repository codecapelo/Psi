import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Trash2,
  LineChart,
  FilePlus2,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import apiClient from "@/lib/api";
import type { Patient, PatientDetails } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Card,
  Input,
  Select,
  Field,
  Modal,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const patientsQ = useQuery({
    queryKey: ["patients", search],
    queryFn: () => apiClient.patients.list(search || undefined),
  });

  // "Novo Exame": se o paciente tem uma internação ABERTA (admissão sem alta),
  // o atendimento continua como uma EVOLUÇÃO dela; caso contrário, abre uma
  // consulta avulsa.
  const startExam = useMutation({
    mutationFn: async (patientId: string) => {
      const episodes = await apiClient.episodes.listByPatient(patientId);
      const internacaoAberta = episodes.find(
        (ep) =>
          ep.tipo === "internacao" &&
          ep.status === "aberto" &&
          ep.exams.some((e) => e.tipo === "admissao") &&
          !ep.exams.some((e) => e.tipo === "alta"),
      );
      return internacaoAberta
        ? apiClient.episodes.addExam(internacaoAberta.id, "evolucao")
        : apiClient.exams.create(patientId);
    },
    onSuccess: (exam) => navigate(`/exame/${exam.id}`),
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao iniciar o atendimento.", "error"),
  });

  const deletePatient = useMutation({
    mutationFn: (id: string) => apiClient.patients.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast("Paciente removido.", "success");
      setToDelete(null);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro", "error"),
  });

  const patients = patientsQ.data ?? [];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Meus Pacientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastre, busque e inicie exames clínicos.
          </p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          Cadastrar paciente
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, sintomas, diagnóstico ou conteúdo da anamnese…"
          className="pl-9"
        />
      </div>

      {patientsQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title={search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
          description={
            search
              ? "Tente outros termos de busca."
              : "Cadastre o primeiro paciente para começar."
          }
          action={
            !search && (
              <Button
                icon={<UserPlus className="h-4 w-4" />}
                onClick={() => setShowCreate(true)}
              >
                Cadastrar paciente
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {patients.map((p) => (
            <Card key={p.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {p.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {p.externalId ? `ID: ${p.externalId} · ` : ""}
                  Atualizado em {formatDate(p.updatedAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<FilePlus2 className="h-4 w-4" />}
                  loading={startExam.isPending && startExam.variables === p.id}
                  onClick={() => startExam.mutate(p.id)}
                >
                  Novo Exame
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Histórico de exames"
                  onClick={() => navigate(`/pacientes/${p.id}/historico`)}
                >
                  <LineChart className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Excluir paciente"
                  onClick={() => setToDelete(p)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreatePatientModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["patients"] });
          setShowCreate(false);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deletePatient.mutate(toDelete.id)}
        title="Excluir paciente"
        message={
          <>
            Excluir <strong>{toDelete?.name}</strong> e todos os seus exames?
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        danger
        loading={deletePatient.isPending}
      />
    </div>
  );
}

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

/** Remove campos vazios para não persistir strings em branco. */
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
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [externalId, setExternalId] = useState("");
  const [details, setDetails] = useState<PatientDetails>(EMPTY_DETAILS);
  const [showMore, setShowMore] = useState(false);
  const { toast } = useToast();

  const setField = (key: keyof PatientDetails, value: string) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const reset = () => {
    setName("");
    setExternalId("");
    setDetails(EMPTY_DETAILS);
    setShowMore(false);
  };

  const create = useMutation({
    mutationFn: () =>
      apiClient.patients.create({
        name: name.trim(),
        externalId: externalId.trim() || null,
        details: cleanDetails(details),
      }),
    onSuccess: () => {
      toast("Paciente cadastrado.", "success");
      reset();
      onCreated();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro", "error"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Cadastrar paciente">
      <Field label="Nome completo ou iniciais" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Maria S. A."
          autoFocus
        />
      </Field>
      <Field
        label="ID externo (código do sistema oficial)"
        hint="Opcional — código do prontuário/sistema oficial."
      >
        <Input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          placeholder="Opcional"
        />
      </Field>

      {/* Dados cadastrais opcionais — preenchem documentos automaticamente. */}
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
          <Field label="Estado civil">
            <Select value={details.estadoCivil ?? ""} onChange={(e) => setField("estadoCivil", e.target.value)}>
              <option value="">—</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="União estável">União estável</option>
            </Select>
          </Field>
          <Field label="Profissão">
            <Input value={details.profissao ?? ""} onChange={(e) => setField("profissao", e.target.value)} />
          </Field>
          <Field label="Escolaridade">
            <Input value={details.escolaridade ?? ""} onChange={(e) => setField("escolaridade", e.target.value)} />
          </Field>
          <Field label="Telefone">
            <Input value={details.telefone ?? ""} onChange={(e) => setField("telefone", e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Naturalidade (cidade/UF)">
            <Input value={details.naturalidade ?? ""} onChange={(e) => setField("naturalidade", e.target.value)} />
          </Field>
          <Field label="Nacionalidade">
            <Input value={details.nacionalidade ?? ""} onChange={(e) => setField("nacionalidade", e.target.value)} placeholder="Brasileira" />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input value={details.endereco ?? ""} onChange={(e) => setField("endereco", e.target.value)} placeholder="Rua, nº, bairro, cidade/UF" />
          </Field>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => create.mutate()}
          loading={create.isPending}
          disabled={!name.trim()}
        >
          Cadastrar
        </Button>
      </div>
    </Modal>
  );
}
