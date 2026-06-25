import { useState } from "react";
import { PenLine, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Button, Badge, CheckboxItem } from "@/components/ui";
import { useExam, useExamSlice } from "@/context/ExamContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/utils";
import { DOMAINS } from "@/modules/psicopatologia/domains";

// --------------------------------------------------------------------------
// Modelo da evolução (fatia data.evolucao) — espelha server/longitudinal.ts
// --------------------------------------------------------------------------
type EemMap = Record<string, string[]>;

interface SoapSnapshot {
  s: string;
  o: string;
  a: string;
  p: string;
  eem: EemMap;
  sourceTipo: string;
  sourceDate: string;
}

interface EvolucaoData {
  s: string;
  o: string;
  a: string;
  p: string;
  eem: EemMap;
  /** Linha de base imutável (evolução anterior ou admissão). */
  prev: SoapSnapshot | null;
}

const DEFAULTS: EvolucaoData = { s: "", o: "", a: "", p: "", eem: {}, prev: null };

const SOAP_FIELDS: { key: "s" | "o" | "a" | "p"; label: string; hint: string }[] = [
  { key: "s", label: "S — Subjetivo", hint: "Relato e queixas do paciente desde a última avaliação." },
  { key: "o", label: "O — Objetivo", hint: "Exame, sinais, comportamento observado, exames complementares." },
  { key: "a", label: "A — Avaliação", hint: "Impressão clínica e evolução do quadro." },
  { key: "p", label: "P — Plano", hint: "Conduta, ajustes de medicação e encaminhamentos." },
];

/** Rótulo amigável do tipo do atendimento-fonte. */
function sourceLabel(tipo: string): string {
  if (tipo === "admissao") return "Admissão";
  if (tipo === "evolucao") return "evolução anterior";
  if (tipo === "consulta") return "consulta";
  return tipo || "—";
}

export default function EvolucaoStep() {
  const [e, patch] = useExamSlice<EvolucaoData>("evolucao", DEFAULTS);
  const { locked, lock } = useExam();
  const { toast } = useToast();
  const [signing, setSigning] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const prev = e.prev;
  const eem = e.eem ?? {};
  const prevEem = prev?.eem ?? {};

  const setSoap = (key: "s" | "o" | "a" | "p", value: string) =>
    patch({ [key]: value } as Partial<EvolucaoData>);

  const toggleFinding = (domainId: string, label: string, checked: boolean) => {
    const set = new Set(eem[domainId] ?? []);
    if (checked) set.add(label);
    else set.delete(label);
    const next: EemMap = { ...eem };
    const arr = [...set];
    if (arr.length) next[domainId] = arr;
    else delete next[domainId];
    patch({ eem: next });
  };

  const sign = async () => {
    if (!window.confirm("Assinar esta evolução? Após assinar, ela fica imutável.")) return;
    setSigning(true);
    try {
      await lock();
      toast("Evolução assinada — agora imutável.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao assinar a evolução.", "error");
    } finally {
      setSigning(false);
    }
  };

  // Domínios com achados (na base ou hoje) aparecem por padrão; o resto é opcional.
  const activeIds = new Set(
    DOMAINS.filter((d) => (eem[d.id]?.length ?? 0) > 0 || (prevEem[d.id]?.length ?? 0) > 0).map(
      (d) => d.id,
    ),
  );
  const visibleDomains = showAll ? DOMAINS : DOMAINS.filter((d) => activeIds.has(d.id));

  // Resumo global de mudanças do EEM (novos × resolvidos).
  let novos = 0;
  let resolvidos = 0;
  for (const d of DOMAINS) {
    const cur = new Set(eem[d.id] ?? []);
    const old = new Set(prevEem[d.id] ?? []);
    for (const x of cur) if (!old.has(x)) novos++;
    for (const x of old) if (!cur.has(x)) resolvidos++;
  }

  return (
    <StepShell
      title="Evolução (SOAP)"
      description="Evolução baseada na avaliação anterior. Os campos vêm preenchidos a partir do último atendimento — ajuste o que mudou e assine."
      actions={
        !locked && (
          <Button
            variant="primary"
            size="sm"
            icon={<PenLine className="h-4 w-4" />}
            loading={signing}
            onClick={sign}
          >
            Assinar evolução
          </Button>
        )
      }
    >
      {prev && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>
            Baseada em <strong>{sourceLabel(prev.sourceTipo)}</strong>
            {prev.sourceDate ? ` de ${formatDate(prev.sourceDate, true)}` : ""}.
          </span>
          {(novos > 0 || resolvidos > 0) && (
            <span className="flex items-center gap-1.5">
              {novos > 0 && <Badge color="amber">{novos} novo(s)</Badge>}
              {resolvidos > 0 && <Badge color="green">{resolvidos} resolvido(s)</Badge>}
            </span>
          )}
        </div>
      )}

      {/* ── SOAP: anterior (esq.) × hoje (dir.) ───────────────────────── */}
      <Card className="mb-4">
        <CardHeader
          title="Nota de evolução (SOAP)"
          subtitle="À esquerda, a avaliação anterior (somente leitura). À direita, a evolução de hoje."
        />
        <div className="p-5">
          {SOAP_FIELDS.map((f) => {
            const changed = !!prev && prev[f.key] !== e[f.key];
            return (
              <div key={f.key} className="mb-5 last:mb-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="field-label mb-0">{f.label}</span>
                  {changed && <Badge color="amber">alterado</Badge>}
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Anterior
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {prev?.[f.key]?.trim() ? prev[f.key] : "—"}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                      Hoje
                    </div>
                    <Textarea
                      value={e[f.key]}
                      onChange={(ev) => setSoap(f.key, ev.target.value)}
                      rows={3}
                      placeholder={f.hint}
                      disabled={locked}
                    />
                  </div>
                </div>
                <p className="field-hint">{f.hint}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Mini-EEM com carry-forward ───────────────────────────────── */}
      <Card>
        <CardHeader
          title="Exame do Estado Mental (evolução)"
          subtitle="Achados trazidos da avaliação anterior vêm marcados. Desmarque o que melhorou e marque o que surgiu/piorou."
          actions={
            <Button
              variant="outline"
              size="sm"
              icon={showAll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Só os alterados" : "Todos os domínios"}
            </Button>
          }
        />
        <div className="p-5">
          {visibleDomains.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhum achado na avaliação anterior. Use "Todos os domínios" para registrar achados.
            </p>
          )}
          <div className="space-y-4">
            {visibleDomains.map((d) => {
              const cur = new Set(eem[d.id] ?? []);
              const old = new Set(prevEem[d.id] ?? []);
              const resolvidosList = [...old].filter((x) => !cur.has(x));
              return (
                <div key={d.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                  <h4 className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {d.shortTitle || d.title}
                  </h4>
                  <div className="grid gap-0.5 sm:grid-cols-2">
                    {d.categories.flatMap((c) => c.items).map((item) => {
                      const isNew = cur.has(item.label) && !old.has(item.label);
                      return (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <CheckboxItem
                            label={item.label}
                            tooltip={item.tooltip}
                            checked={cur.has(item.label)}
                            onChange={(v) => toggleFinding(d.id, item.label, v)}
                            disabled={locked}
                          />
                          {isNew && <Badge color="amber">novo</Badge>}
                        </div>
                      );
                    })}
                  </div>
                  {resolvidosList.length > 0 && (
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <ArrowRight className="h-3 w-3" /> Resolvido(s):{" "}
                      <span className="line-through opacity-70">{resolvidosList.join(", ")}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </StepShell>
  );
}
