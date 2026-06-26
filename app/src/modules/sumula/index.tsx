import { useState } from "react";
import { Search, ClipboardCheck } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Badge, Button, Field, Input, Textarea } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AiAssistButton, AiDisclaimer } from "@/components/ai";
import { useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";
import { DOMAINS } from "@/modules/psicopatologia/domains";

// --------------------------------------------------------------------------
// Tipos locais
// --------------------------------------------------------------------------
interface DomainState {
  selected: string[];
  notes: string;
}
type PsicoSlice = Record<string, DomainState>;

interface SumulaSlice {
  interpretacao: string;
}

const SUMULA_DEFAULTS: SumulaSlice = { interpretacao: "" };

// --------------------------------------------------------------------------
// Utilitário: monta texto consolidado de achados para IA
// --------------------------------------------------------------------------
function buildConsolidatedText(psico: PsicoSlice): string {
  const lines: string[] = [];
  for (const domain of DOMAINS) {
    const state = psico[domain.id];
    const selected = state?.selected ?? [];
    const notes = state?.notes ?? "";
    if (selected.length === 0 && !notes) continue;
    lines.push(`## ${domain.title}`);
    if (selected.length > 0) lines.push(`Achados: ${selected.join(", ")}.`);
    if (notes) lines.push(`Observações: ${notes}`);
  }
  return lines.length > 0
    ? lines.join("\n")
    : "Nenhum achado registrado nos domínios semiológicos.";
}

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------
export default function SumulaStep() {
  // Slice da psicopatologia (leitura + escrita para "Preencher Exame Normal")
  const [psico, patchPsico] = useExamSlice<PsicoSlice>(SLICE.psicopatologia, {});

  // Slice próprio da súmula
  const [s, patch] = useExamSlice<SumulaSlice>(SLICE.sumula, SUMULA_DEFAULTS);

  // Estado local: busca
  const [query, setQuery] = useState("");
  const [confirmFill, setConfirmFill] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  // Filtra domínios conforme a busca
  const visibleDomains = DOMAINS.filter((domain) => {
    if (!normalizedQuery) return true;
    if (domain.title.toLowerCase().includes(normalizedQuery)) return true;
    const state = psico[domain.id];
    if (state?.selected.some((lbl) => lbl.toLowerCase().includes(normalizedQuery))) return true;
    if (state?.notes?.toLowerCase().includes(normalizedQuery)) return true;
    return false;
  });

  // Handler: preencher exame normal (confirmação via diálogo do app)
  const doFillNormal = () => {
    setConfirmFill(false);
    const next: PsicoSlice = {};
    for (const domain of DOMAINS) {
      const normals = domain.categories
        .flatMap((c) => c.items)
        .filter((i) => i.normal)
        .map((i) => i.label);
      next[domain.id] = {
        selected: normals,
        notes: psico[domain.id]?.notes ?? "",
      };
    }
    // Grava todos os domínios de uma vez via patch completo
    patchPsico(next);
  };

  const consolidatedText = buildConsolidatedText(psico);

  return (
    <StepShell
      title="Súmula Geral"
      description="Visão consolidada dos achados semiológicos e interpretação técnica."
      actions={
        <Button
          variant="outline"
          size="sm"
          icon={<ClipboardCheck className="h-4 w-4" />}
          onClick={() => setConfirmFill(true)}
        >
          Preencher Exame Normal
        </Button>
      }
    >
      <ConfirmDialog
        open={confirmFill}
        onClose={() => setConfirmFill(false)}
        onConfirm={doFillNormal}
        title="Preencher Exame Normal"
        message="Isso irá sobrescrever todos os achados selecionados com os valores normais de cada domínio. Deseja continuar?"
        confirmLabel="Preencher"
      />
      {/* ---------------------------------------------------------------- */}
      {/* Barra de busca                                                   */}
      {/* ---------------------------------------------------------------- */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Input
            placeholder="Pesquisar domínio, achado ou observação…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none focus:ring-0 dark:bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              limpar
            </button>
          )}
        </div>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Súmula semiológica: um card por domínio                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="mb-4 space-y-3">
        {visibleDomains.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum domínio corresponde à pesquisa.
          </Card>
        ) : (
          visibleDomains.map((domain) => {
            const state = psico[domain.id];
            const selected = state?.selected ?? [];
            const notes = state?.notes ?? "";
            const hasData = selected.length > 0 || !!notes;

            return (
              <Card key={domain.id}>
                <CardHeader
                  title={domain.title}
                  subtitle={domain.description}
                />
                <div className="px-5 py-3">
                  {hasData ? (
                    <>
                      {selected.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {selected.map((lbl) => (
                            <Badge key={lbl} color="brand">
                              {lbl}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {notes && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {notes}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-xs italic text-slate-400 dark:text-slate-500">
                      sem registro
                    </span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Interpretação semiológica                                        */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title="Interpretação Semiológica"
          subtitle="Tradução dos fenômenos em linguagem técnica e síntese clínica."
          actions={
            <AiAssistButton
              label="Sintetizar (IA)"
              request={() => ({
                task: "synthesize",
                messages: [
                  {
                    role: "system",
                    content:
                      "Você é um psiquiatra especialista em semiologia psiquiátrica. Com base nos achados do exame psicopatológico listados, produza uma interpretação semiológica técnica, clara e objetiva. Organize por domínios relevantes, destaque os achados mais significativos e suas implicações diagnósticas. Não invente dados que não estejam na lista fornecida.",
                  },
                  {
                    role: "user",
                    content: consolidatedText,
                  },
                ],
              })}
              onResult={(text) => patch({ interpretacao: text })}
            />
          }
        />
        <div className="p-5">
          <Field label="Interpretação técnica dos achados">
            <Textarea
              value={s.interpretacao}
              onChange={(e) => patch({ interpretacao: e.target.value })}
              placeholder="Descreva a interpretação semiológica consolidada dos achados do exame psicopatológico…"
              rows={7}
            />
          </Field>
          <AiDisclaimer />
        </div>
      </Card>
    </StepShell>
  );
}
