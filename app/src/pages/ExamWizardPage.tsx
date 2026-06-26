import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, Check, X, PenLine } from "lucide-react";
import { ExamProvider, useExam } from "@/context/ExamContext";
import { getStepsForTipo } from "@/modules/registry";
import { isStepComplete } from "@/modules/completion";
import { useToast } from "@/context/ToastContext";
import type { WizardGroup } from "@/lib/types";
import { Button, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EvolucaoWatchlist } from "@/modules/evolucao/Watchlist";
import { AltaJourney } from "@/modules/alta/Journey";
import { SignedDocument } from "@/components/SignedDocument";
import { cn } from "@/lib/utils";

const GROUP_ORDER: WizardGroup[] = ["Clínico", "Síntese", "Conclusão", "IA"];

const TIPO_LABEL: Record<string, string> = {
  admissao: "Admissão",
  evolucao: "Evolução",
  alta: "Alta",
  consulta: "Consulta",
};

export default function ExamWizardPage() {
  const { examId, stepId } = useParams();
  if (!examId) return <Navigate to="/" replace />;

  return (
    <ExamProvider examId={examId}>
      <WizardInner stepId={stepId} />
    </ExamProvider>
  );
}

function WizardInner({ stepId }: { stepId?: string }) {
  const { exam, isLoading, data, locked, lock } = useExam();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signing, setSigning] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);

  const tipo = exam?.tipo ?? "consulta";
  const steps = useMemo(() => getStepsForTipo(tipo), [tipo]);

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        group: g,
        steps: steps.filter((s) => s.group === g),
      })).filter((x) => x.steps.length > 0),
    [steps],
  );

  const current = steps.find((s) => s.id === stepId) ?? null;

  // Quando a rota não corresponde a uma etapa do tipo, vai para a primeira.
  // (Assinado não precisa de etapa: a vista de documento ignora o stepId.)
  useEffect(() => {
    if (exam && !current && !locked) {
      navigate(`/exame/${exam.id}/${steps[0].id}`, { replace: true });
    }
  }, [exam, current, steps, navigate, locked]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!exam) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <p>Exame não encontrado.</p>
        <Link to="/" className="text-brand-600 transition-colors hover:text-brand-700 hover:underline dark:text-brand-400">
          Voltar aos pacientes
        </Link>
      </div>
    );
  }

  // Assinado/imutável → vista de documento (somente leitura), sem o formulário.
  if (locked) {
    return <SignedDocument exam={exam} />;
  }

  const step = current ?? steps[0];
  const idx = steps.findIndex((s) => s.id === step.id);
  const total = steps.length;
  const prev = steps[idx - 1];
  const next = steps[idx + 1];
  const go = (id: string) => navigate(`/exame/${exam.id}/${id}`);
  const finish = () => navigate(`/pacientes/${exam.patientId}/historico`);

  // "Concluir" assina TODOS os tipos assináveis no último passo (admissão,
  // consulta, evolução e alta). Antes a evolução/alta só assinavam pelo botão
  // do topo — quem clicava "Concluir" saía sem assinar e o atendimento ficava
  // "Em aberto" na cronologia. Agora há um caminho único e confiável.
  const signsOnFinish =
    !locked &&
    (tipo === "admissao" || tipo === "consulta" || tipo === "evolucao" || tipo === "alta");

  const signMessage =
    tipo === "alta"
      ? "Concluir e assinar a alta? O documento fica imutável e o episódio é encerrado."
      : tipo === "evolucao"
        ? "Concluir e assinar esta evolução? Após assinar, ela fica imutável."
        : "Concluir e assinar este atendimento? Após assinar, fica imutável.";

  const finishAndSign = async () => {
    setConfirmSign(false);
    setSigning(true);
    try {
      await lock();
      toast("Atendimento assinado — agora imutável.", "success");
      finish();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao assinar o atendimento.",
        "error",
      );
    } finally {
      setSigning(false);
    }
  };

  const Step = step.Component;

  return (
    <div className="flex h-full">
      {/* Rail de etapas */}
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <Link
            to={`/pacientes/${exam.patientId}/historico`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" /> Cronologia
          </Link>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {exam.patient.name}
            </span>
            <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
              {TIPO_LABEL[tipo] ?? tipo}
            </span>
          </div>
          <div className="mt-1 text-xs font-medium text-slate-400 tabular-nums dark:text-slate-500">
            Etapa {idx + 1} de {total}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>
        <nav className="flex-1 space-y-4 p-3">
          {grouped.map(({ group, steps: gsteps }) => (
            <div key={group}>
              <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group}
              </p>
              <div className="space-y-0.5">
                {gsteps.map((s) => {
                  const active = s.id === step.id;
                  const complete = isStepComplete(s.id, data);
                  const sIdx = steps.findIndex((x) => x.id === s.id);
                  const passedIncomplete = sIdx < idx && !complete;
                  return (
                    <button
                      key={s.id}
                      onClick={() => go(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-brand-50 font-medium text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums transition-colors",
                          active
                            ? "bg-brand-600 text-white"
                            : complete
                              ? "bg-emerald-500 text-white"
                              : passedIncomplete
                                ? "bg-red-500 text-white"
                                : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
                        )}
                      >
                        {!active && complete ? (
                          <Check className="h-3 w-3" />
                        ) : !active && passedIncomplete ? (
                          <X className="h-3 w-3" />
                        ) : (
                          sIdx + 1
                        )}
                      </span>
                      <span className="truncate">{s.shortTitle || s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pontos a reavaliar até a alta — só na evolução, derivado da admissão. */}
        {tipo === "evolucao" && exam.episodeId && (
          <EvolucaoWatchlist patientId={exam.patientId} episodeId={exam.episodeId} />
        )}

        {/* Caminho do episódio (admissão → evoluções → alta) — só na alta. */}
        {tipo === "alta" && exam.episodeId && (
          <AltaJourney patientId={exam.patientId} episodeId={exam.episodeId} />
        )}
      </aside>

      {/* Conteúdo da etapa */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <Step />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Button
            variant="outline"
            icon={<ChevronLeft className="h-4 w-4" />}
            disabled={!prev}
            onClick={() => prev && go(prev.id)}
          >
            {prev ? prev.shortTitle || prev.title : "Início"}
          </Button>
          <span className="text-xs font-medium text-slate-400 tabular-nums dark:text-slate-500">
            {idx + 1} / {total}
          </span>
          {next ? (
            <Button onClick={() => go(next.id)}>
              {next.shortTitle || next.title}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : signsOnFinish ? (
            <Button variant="primary" loading={signing} onClick={() => setConfirmSign(true)}>
              Concluir e assinar
              <PenLine className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={finish}>
              Concluir
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmSign}
        onClose={() => setConfirmSign(false)}
        onConfirm={() => void finishAndSign()}
        title="Concluir e assinar"
        message={signMessage}
        confirmLabel="Concluir e assinar"
        loading={signing}
      />
    </div>
  );
}
