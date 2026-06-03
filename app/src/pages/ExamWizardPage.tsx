import { useMemo } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, Check } from "lucide-react";
import { ExamProvider, useExam } from "@/context/ExamContext";
import { WIZARD_STEPS, getStepById, TOTAL_STEPS } from "@/modules/registry";
import type { WizardGroup, WizardStepDef } from "@/lib/types";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

const GROUP_ORDER: WizardGroup[] = ["Clínico", "Síntese", "Conclusão", "IA"];

export default function ExamWizardPage() {
  const { examId, stepId } = useParams();
  if (!examId) return <Navigate to="/" replace />;
  if (!stepId) return <Navigate to={`/exame/${examId}/anamnese`} replace />;
  const step = getStepById(stepId);
  if (!step) return <Navigate to={`/exame/${examId}/anamnese`} replace />;

  return (
    <ExamProvider examId={examId}>
      <WizardInner step={step} />
    </ExamProvider>
  );
}

function WizardInner({ step }: { step: WizardStepDef }) {
  const { exam, isLoading } = useExam();
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((g) => ({
      group: g,
      steps: WIZARD_STEPS.filter((s) => s.group === g),
    })).filter((x) => x.steps.length > 0);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!exam) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <p>Exame não encontrado.</p>
        <Link to="/" className="text-brand-600 hover:underline">
          Voltar aos pacientes
        </Link>
      </div>
    );
  }

  const prev = WIZARD_STEPS.find((s) => s.index === step.index - 1);
  const next = WIZARD_STEPS.find((s) => s.index === step.index + 1);
  const go = (id: string) => navigate(`/exame/${exam.id}/${id}`);

  const Step = step.Component;

  return (
    <div className="flex h-full">
      {/* Rail de etapas */}
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Pacientes
          </Link>
          <div className="mt-2 truncate font-semibold text-slate-900 dark:text-slate-100">
            {exam.patient.name}
          </div>
          <div className="text-xs text-slate-400">
            Etapa {step.index} de {TOTAL_STEPS}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${(step.index / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
        <nav className="flex-1 space-y-4 p-3">
          {grouped.map(({ group, steps }) => (
            <div key={group}>
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group}
              </p>
              <div className="space-y-0.5">
                {steps.map((s) => {
                  const active = s.id === step.id;
                  const done = s.index < step.index;
                  return (
                    <button
                      key={s.id}
                      onClick={() => go(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        active
                          ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                          active
                            ? "bg-brand-600 text-white"
                            : done
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
                        )}
                      >
                        {done ? <Check className="h-3 w-3" /> : s.index}
                      </span>
                      <span className="truncate">{s.shortTitle || s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
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
          <span className="text-xs text-slate-400">
            {step.index} / {TOTAL_STEPS}
          </span>
          {next ? (
            <Button onClick={() => go(next.id)}>
              {next.shortTitle || next.title}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={() => navigate("/")}>
              Concluir
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
