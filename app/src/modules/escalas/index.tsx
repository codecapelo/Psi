import { useState } from "react";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, Badge, EmptyState } from "@/components/ui";
import { useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";
import { SCALES } from "./registry";
import { ScaleRunner } from "./ScaleRunner";
import { SEVERITY_COLOR, type ScaleResult } from "./types";

type EscalasState = Record<string, ScaleResult>;

export default function EscalasStep() {
  const [escalas, patch] = useExamSlice<EscalasState>(SLICE.escalas, {});
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = activeId ? SCALES.find((s) => s.id === activeId) : null;

  if (active) {
    return (
      <StepShell title="Escalas" description="Aplicação de instrumento psicométrico.">
        <Card className="p-5">
          <ScaleRunner
            def={active}
            result={escalas[active.id]}
            onChange={(r) => patch({ [active.id]: r } as Partial<EscalasState>)}
            onClose={() => setActiveId(null)}
          />
        </Card>
      </StepShell>
    );
  }

  // Agrupa escalas por categoria.
  const byCategory = SCALES.reduce<Record<string, typeof SCALES>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <StepShell
      title="Escalas"
      description="Biblioteca de instrumentos psicométricos padronizados. Selecione uma escala para aplicar; o resultado fica vinculado ao exame."
    >
      {SCALES.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Nenhuma escala disponível"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, scales]) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {cat}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scales.map((s) => {
                  const res = escalas[s.id];
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveId(s.id)}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-brand-400 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {s.acronym}
                        </span>
                        {res?.completedAt && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {s.description}
                      </p>
                      {res && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {res.score}
                          </span>
                          {res.band && (
                            <Badge color={SEVERITY_COLOR[res.band.severity ?? "normal"]}>
                              {res.band.label}
                            </Badge>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </StepShell>
  );
}
