import { useMemo, useRef } from "react";
import { Sparkles, ClipboardList } from "lucide-react";
import { Card, Field, Badge, Button } from "@/components/ui";
import { AiDisclaimer, useAi } from "@/components/ai";
import { useToast } from "@/context/ToastContext";
import { buildPrefillRequest, parsePrefill } from "./suggest";
import {
  bandFor,
  sumScore,
  SEVERITY_COLOR,
  type ScaleDef,
  type ScaleResult,
} from "./types";

/** Aplica e pontua uma escala. Resultado é controlado pelo componente pai. */
export function ScaleRunner({
  def,
  result,
  onChange,
  onClose,
  transcript,
}: {
  def: ScaleDef;
  result: ScaleResult | undefined;
  onChange: (r: ScaleResult) => void;
  onClose?: () => void;
  /** Material clínico (transcrição/anotações) para pré-preenchimento por IA. */
  transcript?: string;
}) {
  const { complete: runAi, loading: prefilling } = useAi();
  const { toast } = useToast();
  const answers = result?.answers ?? {};
  // Espelha as respostas mais recentes para o merge pós-await: se o profissional
  // marcar/alterar itens enquanto a IA responde, essas edições são preservadas.
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const score = useMemo(
    () => (def.score ? def.score(answers) : sumScore(answers)),
    [def, answers],
  );
  const band = bandFor(def, score);
  const answeredCount = Object.keys(answers).length;
  const complete = answeredCount >= def.items.length;

  /**
   * Propõe a pontuação dos itens a partir do material clínico. Só adiciona itens
   * ainda não respondidos — as respostas do profissional sempre prevalecem.
   */
  const applyPrefill = async () => {
    if (!transcript?.trim()) return;
    const text = await runAi(buildPrefillRequest(def, transcript));
    if (text == null) return;
    const { answers: pre } = parsePrefill(def, text);
    // Lê o estado mais recente (não o snapshot do clique): preserva respostas
    // que o profissional marcou enquanto a IA respondia.
    const current = answersRef.current;
    const added = Object.keys(pre).filter((id) => !(id in current));
    if (added.length === 0) {
      toast(
        "Não encontrei no material itens suficientes para pontuar esta escala.",
        "info",
      );
      return;
    }
    const merged = { ...pre, ...current };
    const nextScore = def.score ? def.score(merged) : sumScore(merged);
    onChange({
      answers: merged,
      score: nextScore,
      band: bandFor(def, nextScore),
      completedAt:
        Object.keys(merged).length >= def.items.length
          ? new Date().toISOString()
          : undefined,
    });
    toast(`${added.length} item(ns) pré-preenchido(s) pela IA. Revise cada um.`, "success");
  };

  const setAnswer = (itemId: string, value: number) => {
    const nextAnswers = { ...answers, [itemId]: value };
    const nextScore = def.score ? def.score(nextAnswers) : sumScore(nextAnswers);
    onChange({
      answers: nextAnswers,
      score: nextScore,
      band: bandFor(def, nextScore),
      completedAt:
        Object.keys(nextAnswers).length >= def.items.length
          ? new Date().toISOString()
          : undefined,
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 sm:flex dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {def.acronym} — {def.name}
            </h3>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {def.description}
            </p>
            {def.reference && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Ref.: {def.reference}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {transcript?.trim() && !complete && (
            <Button
              variant="ai"
              size="sm"
              loading={prefilling}
              icon={<Sparkles className="h-4 w-4" />}
              onClick={applyPrefill}
            >
              Pré-preencher (IA)
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Voltar
            </Button>
          )}
        </div>
      </div>

      {transcript?.trim() && !complete && (
        <AiDisclaimer text="Pré-preenchimento por IA é uma sugestão a partir do material clínico — confirme e ajuste cada item; a pontuação é do profissional." />
      )}
      {def.note && <AiDisclaimer text={def.note} />}

      <div className="mt-4 space-y-3">
        {def.items.map((item, idx) => {
          const opts = item.options ?? def.defaultOptions ?? [];
          const answered = item.id in answers;
          return (
            <Card
              key={item.id}
              className={
                "p-4 transition-colors " +
                (answered
                  ? "border-brand-200 bg-brand-50/30 dark:border-brand-900/40 dark:bg-brand-900/10"
                  : "")
              }
            >
              <div className="flex items-start gap-3">
                <span
                  className={
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ring-1 ring-inset transition-colors " +
                    (answered
                      ? "bg-brand-100 text-brand-700 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-900/50"
                      : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700")
                  }
                >
                  {idx + 1}
                </span>
                <Field label={item.text} className="mb-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {opts.map((opt) => {
                      const selected = answers[item.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAnswer(item.id, opt.value)}
                          className={
                            "rounded-lg border px-3 py-1.5 text-sm transition-all " +
                            (selected
                              ? "border-brand-500 bg-brand-50 font-medium text-brand-700 ring-1 ring-inset ring-brand-200 dark:border-brand-500/60 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40"
                              : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800")
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="sticky bottom-2 mt-4 flex items-center justify-between gap-4 p-4 shadow-pop ring-1 ring-slate-900/5 dark:ring-white/10">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {answeredCount}/{def.items.length} itens respondidos
          </div>
          <div className="mt-1.5 h-1.5 w-32 max-w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all dark:bg-brand-400"
              style={{ width: `${def.items.length ? (answeredCount / def.items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-baseline gap-3">
          <div className="text-right">
            <div className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Escore
            </div>
            <span className="text-3xl font-bold leading-none tabular-nums text-slate-900 dark:text-slate-100">
              {score}
            </span>
          </div>
          <div className="flex items-center gap-2 self-center">
            {band && (
              <Badge color={SEVERITY_COLOR[band.severity ?? "normal"]}>
                {band.label}
              </Badge>
            )}
            {!complete && (
              <span className="text-xs font-medium text-amber-500">
                (parcial)
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
