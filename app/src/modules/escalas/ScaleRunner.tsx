import { useMemo, useRef } from "react";
import { Sparkles } from "lucide-react";
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
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {def.acronym} — {def.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {def.description}
          </p>
          {def.reference && (
            <p className="mt-1 text-xs text-slate-400">Ref.: {def.reference}</p>
          )}
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

      <div className="mt-4 space-y-2">
        {def.items.map((item, idx) => {
          const opts = item.options ?? def.defaultOptions ?? [];
          return (
            <Card key={item.id} className="p-3">
              <Field
                label={`${idx + 1}. ${item.text}`}
                className="mb-0"
              >
                <div className="flex flex-wrap gap-2">
                  {opts.map((opt) => {
                    const selected = answers[item.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswer(item.id, opt.value)}
                        className={
                          "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                          (selected
                            ? "border-brand-500 bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                            : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800")
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </Card>
          );
        })}
      </div>

      <Card className="sticky bottom-2 mt-4 flex items-center justify-between gap-4 p-4">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {answeredCount}/{def.items.length} itens respondidos
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {score}
          </span>
          {band && (
            <Badge color={SEVERITY_COLOR[band.severity ?? "normal"]}>
              {band.label}
            </Badge>
          )}
          {!complete && (
            <span className="text-xs text-amber-500">
              (parcial)
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
