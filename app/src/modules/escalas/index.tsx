import { useState } from "react";
import { ClipboardList, CheckCircle2, Sparkles } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, Badge, EmptyState, Button } from "@/components/ui";
import { useAi } from "@/components/ai";
import { useExamSlice } from "@/context/ExamContext";
import { useToast } from "@/context/ToastContext";
import { SLICE } from "@/modules/sliceKeys";
import { cn } from "@/lib/utils";
import { SCALES } from "./registry";
import { ScaleRunner } from "./ScaleRunner";
import { SEVERITY_COLOR, type ScaleDef, type ScaleResult } from "./types";
import {
  buildSuggestRequest,
  parseSuggestions,
  type SuggestedScales,
} from "./suggest";

type EscalasState = Record<string, ScaleResult>;

/** Leitura parcial da fatia de anamnese — só os campos de material clínico. */
interface AnamneseLite {
  transcricaoBruta?: string;
  anotacoes?: string;
  usoSubstanciasNotas?: string;
}

export default function EscalasStep() {
  const [escalas, patch] = useExamSlice<EscalasState>(SLICE.escalas, {});
  const [sugeridas, patchSugeridas] = useExamSlice<SuggestedScales>(
    SLICE.escalasSugeridas,
    { ids: [] },
  );
  const [anam] = useExamSlice<AnamneseLite>(SLICE.anamnese, {});
  const { complete, loading: suggesting } = useAi();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Material clínico disponível (transcrição + anotações + notas de uso).
  const material = [anam.transcricaoBruta, anam.anotacoes, anam.usoSubstanciasNotas]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join("\n");

  const suggestedIds = sugeridas.ids ?? [];
  const suggestedSet = new Set(suggestedIds);

  const active = activeId ? SCALES.find((s) => s.id === activeId) : null;

  /** Recalcula as escalas sugeridas a partir do material clínico atual. */
  const runSuggest = async () => {
    if (!material.trim()) {
      toast(
        "Adicione a transcrição ou as anotações na Anamnese para sugerir escalas.",
        "error",
      );
      return;
    }
    const text = await complete(buildSuggestRequest(material));
    if (text == null) return;
    const { ids, reasons } = parseSuggestions(text);
    if (!ids.length) {
      toast("Não identifiquei escalas claramente indicadas no material.", "info");
      return;
    }
    patchSugeridas({ ids, reasons, at: new Date().toISOString() });
    toast(`${ids.length} escala(s) sugerida(s) destacada(s).`, "success");
  };

  if (active) {
    return (
      <StepShell title="Escalas" description="Aplicação de instrumento psicométrico.">
        <Card className="p-5">
          <ScaleRunner
            def={active}
            result={escalas[active.id]}
            transcript={material}
            onChange={(r) => patch({ [active.id]: r } as Partial<EscalasState>)}
            onClose={() => setActiveId(null)}
          />
        </Card>
      </StepShell>
    );
  }

  // Agrupa escalas por categoria.
  const byCategory = SCALES.reduce<Record<string, ScaleDef[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  /** Card de uma escala — destacado quando sugerido pela IA. */
  const renderCard = (s: ScaleDef) => {
    const res = escalas[s.id];
    const isSuggested = suggestedSet.has(s.id);
    const reason = sugeridas.reasons?.[s.id];
    return (
      <button
        key={s.id}
        onClick={() => setActiveId(s.id)}
        className={cn(
          "rounded-xl border bg-white p-4 text-left shadow-sm transition-colors dark:bg-slate-900",
          isSuggested
            ? "border-amber-400 ring-1 ring-amber-300 dark:border-amber-500/60 dark:ring-amber-500/30"
            : "border-slate-200 hover:border-brand-400 dark:border-slate-800",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {s.acronym}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {isSuggested && <Sparkles className="h-4 w-4 text-amber-500" />}
            {res?.completedAt && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {s.description}
        </p>
        {isSuggested && reason && (
          <p className="mt-1 line-clamp-2 text-xs text-amber-700 dark:text-amber-300">
            {reason}
          </p>
        )}
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
  };

  return (
    <StepShell
      title="Escalas"
      description="Biblioteca de instrumentos psicométricos padronizados. Selecione uma escala para aplicar; o resultado fica vinculado ao exame."
      actions={
        <Button
          type="button"
          variant="ai"
          size="sm"
          loading={suggesting}
          icon={<Sparkles className="h-4 w-4" />}
          onClick={runSuggest}
        >
          Sugerir pela transcrição
        </Button>
      }
    >
      {SCALES.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Nenhuma escala disponível"
        />
      ) : (
        <div className="space-y-6">
          {suggestedIds.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
              <div className="mb-1 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Sugeridas pela transcrição
                </h3>
              </div>
              <p className="mb-3 text-xs text-amber-700/80 dark:text-amber-300/80">
                Indicadas pelo material clínico — confirme e aplique. Ao abrir uma escala,
                você pode pré-preenchê-la pela IA.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedIds.map((id) => {
                  const s = SCALES.find((x) => x.id === id);
                  return s ? renderCard(s) : null;
                })}
              </div>
            </div>
          )}

          {Object.entries(byCategory).map(([cat, scales]) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {cat}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scales.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      )}
    </StepShell>
  );
}
