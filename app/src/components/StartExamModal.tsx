// ==========================================================================
// Diálogo "Iniciar atendimento" — escolha explícita da modalidade. Reusado pela
// lista de pacientes e pelo prontuário. Roteia para o wizard real (/exame/:id).
//   • sem internação aberta → Consulta avulsa | Nova internação
//   • com internação aberta → Nova evolução | Dar alta | Consulta avulsa
//   • com alta em rascunho   → Continuar alta
// ==========================================================================
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, DoorOpen, FileText, LogOut } from "lucide-react";
import apiClient from "@/lib/api";
import type { Exam, Patient } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Modal, Spinner } from "@/components/ui";

function ChoiceRow({
  icon,
  title,
  subtitle,
  primary,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        primary
          ? "border-brand-200 bg-brand-50 hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-900/20 dark:hover:bg-brand-900/30"
          : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
      )}
    >
      <span className={cn("shrink-0", primary ? "text-brand-600 dark:text-brand-400" : "text-slate-400")}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{title}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
    </button>
  );
}

export function StartExamModal({
  patient,
  onClose,
}: {
  patient: Patient | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const episodesQ = useQuery({
    queryKey: ["episodes", patient?.id],
    queryFn: () => apiClient.episodes.listByPatient(patient!.id),
    enabled: !!patient,
  });

  const internacaoAberta = episodesQ.data?.find(
    (ep) => ep.tipo === "internacao" && ep.status === "aberto",
  );
  const altaDraft = internacaoAberta?.exams.find((e) => e.tipo === "alta" && !e.lockedAt);

  const start = useMutation({
    mutationFn: (fn: () => Promise<Exam>) => fn(),
    onSuccess: (exam) => {
      onClose();
      navigate(`/exame/${exam.id}`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao iniciar o atendimento.", "error"),
  });
  const busy = start.isPending;

  const openExisting = (examId: string) => {
    onClose();
    navigate(`/exame/${examId}`);
  };

  return (
    <Modal open={!!patient} onClose={onClose} title="Iniciar atendimento" size="sm">
      {patient && (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Paciente:{" "}
          <strong className="text-slate-700 dark:text-slate-200">{patient.name}</strong>
        </p>
      )}

      {episodesQ.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : internacaoAberta ? (
        <div className="space-y-2">
          <p className="mb-1 text-sm text-amber-700 dark:text-amber-400">
            Este paciente tem uma internação aberta.
          </p>
          {altaDraft ? (
            <ChoiceRow
              icon={<LogOut className="h-5 w-5" />}
              title="Continuar alta"
              subtitle="Retomar o resumo de alta ainda não assinado — assine para encerrar."
              primary
              disabled={busy}
              onClick={() => openExisting(altaDraft.id)}
            />
          ) : (
            <>
              <ChoiceRow
                icon={<Activity className="h-5 w-5" />}
                title="Nova evolução"
                subtitle="Continua a internação em curso."
                primary
                disabled={busy}
                onClick={() => start.mutate(() => apiClient.episodes.addExam(internacaoAberta.id, "evolucao"))}
              />
              <ChoiceRow
                icon={<LogOut className="h-5 w-5" />}
                title="Dar alta"
                subtitle="Resumo de alta — encerra a internação ao assinar."
                disabled={busy}
                onClick={() => start.mutate(() => apiClient.episodes.addExam(internacaoAberta.id, "alta"))}
              />
            </>
          )}
          <ChoiceRow
            icon={<FileText className="h-5 w-5" />}
            title="Consulta avulsa"
            subtitle="Atendimento único, fora da internação."
            disabled={busy}
            onClick={() => start.mutate(() => apiClient.exams.create(patient!.id))}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <ChoiceRow
            icon={<FileText className="h-5 w-5" />}
            title="Consulta avulsa"
            subtitle="Atendimento único (ambulatório, consultório)."
            primary
            disabled={busy}
            onClick={() => start.mutate(() => apiClient.exams.create(patient!.id))}
          />
          <ChoiceRow
            icon={<DoorOpen className="h-5 w-5" />}
            title="Nova internação"
            subtitle="Abre admissão → evoluções → alta."
            disabled={busy}
            onClick={() => start.mutate(() => apiClient.episodes.startInternacao(patient!.id))}
          />
        </div>
      )}
    </Modal>
  );
}
