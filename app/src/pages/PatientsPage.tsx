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
} from "lucide-react";
import apiClient from "@/lib/api";
import type { Patient } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Card,
  Input,
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

  const createExam = useMutation({
    mutationFn: (patientId: string) => apiClient.exams.create(patientId),
    onSuccess: (exam) => navigate(`/exame/${exam.id}`),
    onError: (e) => toast(e instanceof Error ? e.message : "Erro", "error"),
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
                  loading={createExam.isPending && createExam.variables === p.id}
                  onClick={() => createExam.mutate(p.id)}
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
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: () =>
      apiClient.patients.create({ name: name.trim(), externalId: externalId.trim() || null }),
    onSuccess: () => {
      toast("Paciente cadastrado.", "success");
      setName("");
      setExternalId("");
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
