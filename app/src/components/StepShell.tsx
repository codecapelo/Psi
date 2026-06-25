import type { ReactNode } from "react";
import { Check, CloudOff, Loader2, Lock } from "lucide-react";
import { useExam } from "@/context/ExamContext";

/**
 * Moldura padrão de uma etapa do wizard: título, descrição, indicador de
 * autosave e o conteúdo do módulo. Todo módulo de etapa deve envolver seu
 * conteúdo neste componente para manter a consistência visual.
 */
export function StepShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { saveState, locked, exam } = useExam();
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {!locked && <SaveIndicator state={saveState} />}
          {actions}
        </div>
      </div>
      {locked && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Documento assinado — somente leitura.
            {exam?.hash && (
              <span className="ml-1 font-mono text-xs opacity-80">
                hash {exam.hash.slice(0, 16)}…
              </span>
            )}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function SaveIndicator({
  state,
}: {
  state: "idle" | "saving" | "saved" | "error";
}) {
  if (state === "saving")
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
        <Check className="h-3.5 w-3.5" /> Salvo
      </span>
    );
  if (state === "error")
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-500">
        <CloudOff className="h-3.5 w-3.5" /> Erro ao salvar
      </span>
    );
  return null;
}
