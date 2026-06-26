import { Fragment, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Lock,
  DoorOpen,
  Activity,
  LogOut,
  Plus,
  Stethoscope,
  CalendarClock,
} from "lucide-react";
import apiClient from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Badge, EmptyState, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Exam, EpisodeWithExams } from "@/lib/types";

// --------------------------------------------------------------------------
// Apresentação dos tipos de atendimento
// --------------------------------------------------------------------------
const ENCOUNTER_META: Record<
  string,
  { label: string; icon: typeof FileText; color: "slate" | "green" | "brand" | "amber" }
> = {
  admissao: { label: "Admissão", icon: DoorOpen, color: "brand" },
  evolucao: { label: "Evolução", icon: Activity, color: "slate" },
  alta: { label: "Alta", icon: LogOut, color: "green" },
  consulta: { label: "Consulta", icon: FileText, color: "slate" },
};

const EPISODE_LABEL: Record<string, string> = {
  internacao: "Internação",
  ambulatorial: "Ambulatorial",
  consulta: "Consulta avulsa",
};

/** Rótulo do intervalo entre dois atendimentos. */
function gapLabel(fromIso: string, toIso: string): string {
  const days = Math.round(
    (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000,
  );
  if (days <= 0) return "mesmo dia";
  if (days === 1) return "1 dia";
  if (days < 30) return `${days} dias`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 mês" : `${months} meses`;
}

// --------------------------------------------------------------------------
// Nó de atendimento na linha do tempo
// --------------------------------------------------------------------------
function EncounterNode({
  exam,
  onOpen,
  onDelete,
}: {
  exam: Exam;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const meta = ENCOUNTER_META[exam.tipo ?? "consulta"] ?? ENCOUNTER_META.consulta;
  const Icon = meta.icon;
  return (
    <div className="group relative flex w-40 shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:border-slate-300 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <button onClick={onOpen} className="text-left">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <Badge color={meta.color}>{meta.label}</Badge>
        </div>
        <div className="mt-2.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {formatDate(exam.createdAt)}
        </div>
        <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDate(exam.createdAt, true).split(" ")[1]}</div>
        <div className="mt-2 flex items-center gap-1.5">
          {exam.lockedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/40">
              <Lock className="h-3 w-3" /> Assinada
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-900/40">Em aberto</span>
          )}
        </div>
      </button>
      {onDelete && !exam.lockedAt && (
        <button
          onClick={onDelete}
          title="Excluir atendimento"
          className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Conector horizontal entre nós, com o intervalo de tempo. */
function Connector({ label }: { label: string }) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center justify-center px-1 pt-6">
      <span className="whitespace-nowrap text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400">{label}</span>
      <div className="mt-1 h-px w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
    </div>
  );
}

export default function PatientHistoryPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [toDiscard, setToDiscard] = useState<EpisodeWithExams | null>(null);

  const patientQ = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => apiClient.patients.get(patientId!),
    enabled: !!patientId,
  });
  const episodesQ = useQuery({
    queryKey: ["episodes", patientId],
    queryFn: () => apiClient.episodes.listByPatient(patientId!),
    enabled: !!patientId,
  });
  const examsQ = useQuery({
    queryKey: ["exams", patientId],
    queryFn: () => apiClient.exams.listByPatient(patientId!),
    enabled: !!patientId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["episodes", patientId] });
    qc.invalidateQueries({ queryKey: ["exams", patientId] });
  };

  // Marca a cronologia como obsoleta e abre o atendimento recém-criado. Sem a
  // invalidação, a lista (staleTime 30s) mostraria o estado antigo ao voltar.
  const openFresh = (exam: { id: string }) => {
    invalidate();
    navigate(`/exame/${exam.id}`);
  };

  const newInternacao = useMutation({
    mutationFn: () => apiClient.episodes.startInternacao(patientId!),
    onSuccess: openFresh,
    // O servidor recusa (409) uma 2ª internação aberta com mensagem clara.
    onError: (err) => {
      invalidate();
      toast(err instanceof Error ? err.message : "Erro ao iniciar a internação.", "error");
    },
  });

  const discardEpisode = useMutation({
    mutationFn: (id: string) => apiClient.episodes.remove(id),
    onSuccess: () => {
      invalidate();
      toast("Internação descartada.", "success");
      setToDiscard(null);
    },
    onError: (err) =>
      toast(err instanceof Error ? err.message : "Erro ao descartar a internação.", "error"),
  });

  const newConsulta = useMutation({
    mutationFn: () => apiClient.exams.create(patientId!),
    onSuccess: openFresh,
    onError: () => toast("Erro ao criar a consulta.", "error"),
  });

  const addEvolucao = useMutation({
    mutationFn: (episodeId: string) => apiClient.episodes.addExam(episodeId, "evolucao"),
    onSuccess: openFresh,
    onError: (err) =>
      toast(err instanceof Error ? err.message : "Erro ao criar a evolução.", "error"),
  });

  const darAlta = useMutation({
    mutationFn: (episodeId: string) => apiClient.episodes.addExam(episodeId, "alta"),
    onSuccess: openFresh,
    onError: (err) =>
      toast(err instanceof Error ? err.message : "Erro ao registrar a alta.", "error"),
  });

  const deleteExam = useMutation({
    mutationFn: (id: string) => apiClient.exams.remove(id),
    onSuccess: () => {
      invalidate();
      toast("Atendimento removido.", "success");
    },
  });

  const episodes = episodesQ.data ?? [];
  const looseExams = (examsQ.data ?? [])
    .filter((e) => !e.episodeId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const loading = episodesQ.isLoading || examsQ.isLoading;
  const hasError = episodesQ.isError || examsQ.isError;
  const isEmpty = !loading && !hasError && episodes.length === 0 && looseExams.length === 0;
  const busy =
    newInternacao.isPending ||
    newConsulta.isPending ||
    addEvolucao.isPending ||
    darAlta.isPending;

  const openExam = (id: string) => navigate(`/exame/${id}`);

  return (
    <div className="mx-auto max-w-6xl animate-fade-in p-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" /> Pacientes
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 sm:flex dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {patientQ.data?.name ?? "Cronologia"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cronologia de atendimentos — internações, evoluções, altas e consultas.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            icon={<FileText className="h-4 w-4" />}
            loading={newConsulta.isPending}
            disabled={busy}
            onClick={() => newConsulta.mutate()}
          >
            Consulta avulsa
          </Button>
          <Button
            icon={<DoorOpen className="h-4 w-4" />}
            loading={newInternacao.isPending}
            disabled={busy}
            onClick={() => newInternacao.mutate()}
          >
            Nova internação
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : hasError ? (
        <EmptyState
          icon={<Stethoscope className="h-10 w-10" />}
          title="Não foi possível carregar a cronologia"
          description="Houve um erro ao buscar os atendimentos deste paciente. Tente novamente."
          action={
            <Button
              variant="outline"
              onClick={() => {
                episodesQ.refetch();
                examsQ.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<Stethoscope className="h-10 w-10" />}
          title="Nenhum atendimento registrado"
          description="Inicie uma internação (admissão → evoluções → alta) ou registre uma consulta avulsa."
        />
      ) : (
        <div className="space-y-4">
          {/* Episódios (internações etc.) */}
          {episodes.map((ep) => (
            <EpisodeTrack
              key={ep.id}
              episode={ep}
              busy={busy}
              onOpen={openExam}
              onDelete={(id) => deleteExam.mutate(id)}
              onAddEvolucao={() => addEvolucao.mutate(ep.id)}
              onDarAlta={() => darAlta.mutate(ep.id)}
              onDiscard={() => setToDiscard(ep)}
            />
          ))}

          {/* Consultas avulsas (sem episódio) */}
          {looseExams.length > 0 && (
            <Card className="p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <FileText className="h-4 w-4" />
                </span>
                <Badge color="slate">{EPISODE_LABEL.consulta}</Badge>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Atendimentos avulsos
                </span>
              </div>
              <div className="flex items-stretch overflow-x-auto pb-2">
                {looseExams.map((ex, i) => (
                  <Fragment key={ex.id}>
                    {i > 0 && <Connector label={gapLabel(looseExams[i - 1].createdAt, ex.createdAt)} />}
                    <EncounterNode
                      exam={ex}
                      onOpen={() => openExam(ex.id)}
                      onDelete={() => deleteExam.mutate(ex.id)}
                    />
                  </Fragment>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!toDiscard}
        onClose={() => setToDiscard(null)}
        onConfirm={() => toDiscard && discardEpisode.mutate(toDiscard.id)}
        title="Descartar internação"
        message={
          <>
            Descartar esta internação
            {toDiscard && toDiscard.exams.length > 0
              ? ` e seus ${toDiscard.exams.length} atendimento(s) não assinado(s)`
              : ""}
            ? Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Descartar"
        danger
        loading={discardEpisode.isPending}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// Faixa horizontal de um episódio
// --------------------------------------------------------------------------
function EpisodeTrack({
  episode,
  busy,
  onOpen,
  onDelete,
  onAddEvolucao,
  onDarAlta,
  onDiscard,
}: {
  episode: EpisodeWithExams;
  busy: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onAddEvolucao: () => void;
  onDarAlta: () => void;
  onDiscard: () => void;
}) {
  const exams = [...episode.exams].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const aberto = episode.status === "aberto";
  const isInternacao = episode.tipo === "internacao";
  // Só é possível descartar um episódio sem NENHUM atendimento assinado
  // (registro assinado é imutável). Resolve internações abertas vazias/equívocas.
  const canDiscard = !exams.some((e) => e.lockedAt);
  // Já existe uma alta (rascunho ou assinada): não oferecemos "Dar alta" de novo
  // (violaria uq_exams_episode_alta). O episódio só fecha ao assinar a alta.
  const hasAlta = exams.some((e) => e.tipo === "alta");

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span
            className={
              isInternacao
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40"
                : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }
          >
            {isInternacao ? <DoorOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </span>
          <Badge color={isInternacao ? "brand" : "slate"}>
            {EPISODE_LABEL[episode.tipo] ?? episode.tipo}
          </Badge>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {episode.titulo || formatDate(episode.openedAt)}
          </span>
          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {formatDate(episode.openedAt)}
            {episode.closedAt ? ` → ${formatDate(episode.closedAt)}` : ""}
          </span>
          <Badge color={aberto ? "amber" : "green"}>{aberto ? "Aberto" : "Encerrado"}</Badge>
        </div>
        {canDiscard && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-4 w-4 text-red-500" />}
            disabled={busy}
            onClick={onDiscard}
            title="Descartar este episódio (nenhum atendimento assinado)"
          >
            Descartar
          </Button>
        )}
      </div>

      <div className="flex items-stretch overflow-x-auto pb-2">
        {exams.map((ex, i) => (
          <Fragment key={ex.id}>
            {i > 0 && <Connector label={gapLabel(exams[i - 1].createdAt, ex.createdAt)} />}
            <EncounterNode
              exam={ex}
              onOpen={() => onOpen(ex.id)}
              onDelete={() => onDelete(ex.id)}
            />
          </Fragment>
        ))}

        {/* Ações da internação aberta. Quando já há alta (rascunho/assinada), a
            internação está em fechamento — não oferecemos novos atendimentos
            (uma evolução nova apareceria depois da alta na cronologia). */}
        {aberto && isInternacao && !hasAlta && (
          <>
            {exams.length > 0 && <Connector label="" />}
            <div className="flex w-44 shrink-0 flex-col justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                disabled={busy}
                onClick={onAddEvolucao}
              >
                Nova evolução
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<LogOut className="h-4 w-4" />}
                disabled={busy}
                onClick={onDarAlta}
              >
                Dar alta
              </Button>
            </div>
          </>
        )}
      </div>

      {aberto && isInternacao && exams.length > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {hasAlta
            ? "Alta iniciada — abra-a e assine para encerrar a internação."
            : "Internação aberta — registre evoluções e finalize com a alta."}
        </p>
      )}
    </Card>
  );
}
