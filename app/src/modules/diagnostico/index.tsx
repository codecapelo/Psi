import {
  Layers,
  Clock,
  BookMarked,
  Sparkles,
  GitCompareArrows,
  FileCheck2,
} from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Button } from "@/components/ui";
import { AiAssistButton, AiDisclaimer } from "@/components/ai";
import { useExam, useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";

// --------------------------------------------------------------------------
// Modelo de dados da fatia Diagnóstico
// --------------------------------------------------------------------------
interface DiagnosticoSlice {
  sindromico: string;
  temporalidade: string;
  nosologico: string;
  triangulacao: string;
  diferenciais: string;
  justificativa: string;
}

const DEFAULTS: DiagnosticoSlice = {
  sindromico: "",
  temporalidade: "",
  nosologico: "",
  triangulacao: "",
  diferenciais: "",
  justificativa: "",
};

// --------------------------------------------------------------------------
// Heurística local de diagnóstico sindrômico baseada em psicopatologia
// --------------------------------------------------------------------------
function sugerirSindromico(psicopatologia: unknown): string {
  // psicopatologia é um objeto { [domainId]: { selected: string[]; notes: string } }
  if (!psicopatologia || typeof psicopatologia !== "object") {
    return "Dados de psicopatologia insuficientes para sugestão heurística.";
  }

  const domainMap = psicopatologia as Record<
    string,
    { selected?: string[]; notes?: string }
  >;

  // Coleta todos os achados selecionados (ids e notas) em texto minúsculo
  const allSelected: string[] = [];
  const allNotes: string[] = [];
  for (const domain of Object.values(domainMap)) {
    if (Array.isArray(domain.selected)) {
      allSelected.push(...domain.selected.map((s) => s.toLowerCase()));
    }
    if (domain.notes) {
      allNotes.push(domain.notes.toLowerCase());
    }
  }

  const corpus = [...allSelected, ...allNotes].join(" ");

  const sindromes: string[] = [];

  // Síndrome psicótica
  const psicotico =
    /(delírio|delirio|alucinaç|alucinação|ideia de referência|grandiosidade|persecutório|persecutoria|desorganiz|incoerência|incoerencia|pensamento desorganizado|eco do pensamento|inserção de pensamento|roubo de pensamento|transmissão de pensamento|comportamento desorganizado)/;
  if (psicotico.test(corpus)) {
    sindromes.push("síndrome psicótica");
  }

  // Síndrome maníaca / hipomaníaca
  const maniaco =
    /(mania|hipomania|euforia|grandiosidade|fuga de ideias|logorréia|logorreia|pressão de fala|desinibição|desinibicao|agitação psicomotora|irritabilidade intensa|diminuição do sono sem cansaço|diminuicao do sono)/;
  if (maniaco.test(corpus)) {
    sindromes.push("síndrome maníaca/hipomaníaca");
  }

  // Síndrome depressiva
  const depressivo =
    /(humor deprimido|depressão|depressao|anedonia|anedônia|tristeza|desesperança|desesperanca|fadiga intensa|perda de energia|pensamento lento|bradipsiquia|choro fácil|choro facil|culpa excessiva|ideação suicida|ideacao suicida|hipersonia|insônia|insonia)/;
  if (depressivo.test(corpus)) {
    sindromes.push("síndrome depressiva");
  }

  // Síndrome ansiosa
  const ansioso =
    /(ansiedade|angústia|angustia|preocupação excessiva|preocupacao excessiva|pânico|panico|fobia|medo intenso|evitação|evitacao|tensão muscular|tensao muscular|ruminação|ruminacao|inquietude|insônia de ansiedade)/;
  if (ansioso.test(corpus)) {
    sindromes.push("síndrome ansiosa");
  }

  // Síndrome dissociativa
  const dissociativo =
    /(dissociação|dissociacao|despersonalização|despersonalizacao|desrealização|desrealizacao|amnésia|amnesia|fuga dissociativa|transe)/;
  if (dissociativo.test(corpus)) {
    sindromes.push("síndrome dissociativa");
  }

  // Síndrome obsessivo-compulsiva
  const toc =
    /(obsessão|obsessao|compulsão|compulsao|pensamento intrusivo|ritual|verificação|verificacao|contamina)/;
  if (toc.test(corpus)) {
    sindromes.push("síndrome obsessivo-compulsiva");
  }

  // Síndrome cognitiva / demencial
  const cognitivo =
    /(desorientação|desorientacao|confusão mental|confusao mental|demência|demencia|comprometimento cognitivo|déficit de memória|deficit de memoria|afasia|apraxia|agnosia|rebaixamento do nível de consciência|rebaixamento do nivel)/;
  if (cognitivo.test(corpus)) {
    sindromes.push("síndrome cognitiva/demencial");
  }

  // Síndrome por uso de substâncias
  const substancia =
    /(intoxicação|intoxicacao|abstinência|abstinencia|dependência|dependencia|síndrome de abstinência|uso nocivo|craving|fissura)/;
  if (substancia.test(corpus)) {
    sindromes.push("síndrome relacionada ao uso de substâncias");
  }

  // Síndrome somática / somatoforme
  const somatico =
    /(queixas somáticas|queixas somaticas|hipocondria|somatização|somatizacao|dor crônica sem causa orgânica|conversão|conversao)/;
  if (somatico.test(corpus)) {
    sindromes.push("síndrome somatoforme");
  }

  if (sindromes.length === 0) {
    return (
      "Não foram identificados padrões sindrômicos claros a partir dos achados " +
      "psicopatológicos registrados. Revise os dados e complemente manualmente."
    );
  }

  const lista = sindromes
    .map((s, i) => `${i + 1}. ${s.charAt(0).toUpperCase() + s.slice(1)}`)
    .join("\n");

  return (
    `Sugestão heurística com base nos achados psicopatológicos:\n\n${lista}\n\n` +
    `⚠ Esta sugestão é baseada em regras locais simples e NÃO substitui o raciocínio clínico.`
  );
}

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------
export default function DiagnosticoStep() {
  const { data } = useExam();
  const [d, patch] = useExamSlice<DiagnosticoSlice>(SLICE.diagnostico, DEFAULTS);

  return (
    <StepShell
      title="Diagnóstico"
      description="Conclusão diagnóstica: sindrômico, temporalidade, nosológico (DSM/CID) e diferenciais."
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. Diagnóstico Sindrômico                                           */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                <Layers className="h-4 w-4" />
              </span>
              Diagnóstico Sindrômico
            </span>
          }
          subtitle="Agrupamento transversal dos achados em síndromes psicopatológicas."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const sugestao = sugerirSindromico(data.psicopatologia);
                  patch({ sindromico: sugestao });
                }}
              >
                Sugerir (Regras)
              </Button>
              <AiAssistButton
                label="Sugerir com IA"
                request={() => ({
                  task: "suggest_diagnosis",
                  context: data,
                  messages: [
                    {
                      role: "system",
                      content:
                        "Você é um psiquiatra experiente. Com base nos achados clínicos fornecidos " +
                        "(anamnese, fenomenologia, psicopatologia, escalas e sümula), elabore o " +
                        "diagnóstico sindrômico transversal do paciente: identifique e agrupe os " +
                        "sintomas em síndromes psicopatológicas principais e secundárias, " +
                        "ordenadas por relevância clínica. Seja objetivo, técnico e conciso. " +
                        "Não invente dados. Use apenas os achados fornecidos.",
                    },
                    {
                      role: "user",
                      content: JSON.stringify(data, null, 2),
                    },
                  ],
                })}
                onResult={(text) => patch({ sindromico: text })}
              />
            </div>
          }
        />
        <div className="p-5">
          <Field
            label="Síndrome(s) identificada(s)"
            hint="Agrupe os achados em síndromes transversais (ex.: síndrome depressiva, psicótica, ansiosa…)."
          >
            <Textarea
              value={d.sindromico}
              onChange={(e) => patch({ sindromico: e.target.value })}
              rows={5}
              placeholder="Descreva as síndromes identificadas a partir dos achados…"
            />
          </Field>
          <AiDisclaimer />
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Temporalidade e Curso                                            */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                <Clock className="h-4 w-4" />
              </span>
              Temporalidade e Curso
            </span>
          }
          subtitle="Início, duração, evolução e fatores desencadeantes do quadro."
        />
        <div className="p-5">
          <Field
            label="Temporalidade e Curso Clínico"
            hint="Inclua: início (agudo/subagudo/insidioso), duração, padrão de evolução (episódico, contínuo, remitente), fatores desencadeantes ou protetores."
          >
            <Textarea
              value={d.temporalidade}
              onChange={(e) => patch({ temporalidade: e.target.value })}
              rows={5}
              placeholder="Ex.: Início insidioso há 6 meses, curso progressivo sem remissões, precipitado por…"
            />
          </Field>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Hipótese Nosológica (DSM/CID)                                   */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                <BookMarked className="h-4 w-4" />
              </span>
              Hipótese Nosológica (DSM / CID)
            </span>
          }
          subtitle="Diagnóstico categorial com código (DSM-5-TR ou CID-11)."
        />
        <div className="p-5">
          <Field
            label="Hipótese(s) Nosológica(s)"
            hint="Informe o(s) diagnóstico(s) principal(is) e secundário(s) com seus códigos (ex.: F33.1 / 296.22 — Transtorno Depressivo Maior, episódio único, moderado)."
          >
            <Textarea
              value={d.nosologico}
              onChange={(e) => patch({ nosologico: e.target.value })}
              rows={4}
              placeholder="F32.1 — Episódio Depressivo Moderado (CID-11: 6A70.1)…"
            />
          </Field>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Triangulação com IA                                              */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4 ring-1 ring-inset ring-violet-100 dark:ring-violet-900/30">
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-900/40">
                <Sparkles className="h-4 w-4" />
              </span>
              Triangulação Diagnóstica (IA)
            </span>
          }
          subtitle="Hipóteses diagnósticas DSM-5-TR/CID-11 mais prováveis com raciocínio clínico."
          actions={
            <AiAssistButton
              label="Triangular (IA)"
              request={() => ({
                task: "suggest_diagnosis",
                context: data,
                messages: [
                  {
                    role: "system",
                    content:
                      "Você é um psiquiatra especialista em diagnóstico diferencial. " +
                      "Com base nos achados clínicos fornecidos, liste as hipóteses diagnósticas " +
                      "mais prováveis segundo o DSM-5-TR e/ou CID-11, ordenadas por probabilidade. " +
                      "Para cada hipótese, forneça: (1) nome do diagnóstico com código, " +
                      "(2) critérios que estão presentes no caso, (3) critérios que faltam ou " +
                      "são duvidosos, (4) breve raciocínio clínico. Seja rigoroso e objetivo. " +
                      "Não invente dados clínicos. Liste no máximo 5 hipóteses.",
                  },
                  {
                    role: "user",
                    content: JSON.stringify(data, null, 2),
                  },
                ],
              })}
              onResult={(text) => patch({ triangulacao: text })}
            />
          }
        />
        <div className="p-5">
          <Field
            label="Triangulação (hipóteses com raciocínio)"
            hint="A IA analisa todos os achados do exame e apresenta hipóteses diagnósticas fundamentadas com critérios DSM-5-TR/CID-11."
          >
            <Textarea
              value={d.triangulacao}
              onChange={(e) => patch({ triangulacao: e.target.value })}
              rows={7}
              placeholder="Clique em 'Triangular (IA)' para gerar automaticamente, ou escreva manualmente…"
            />
          </Field>
          <AiDisclaimer />
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Diagnósticos Diferenciais                                        */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                <GitCompareArrows className="h-4 w-4" />
              </span>
              Diagnósticos Diferenciais
            </span>
          }
          subtitle="Hipóteses alternativas que devem ser consideradas e descartadas."
          actions={
            <AiAssistButton
              label="Sugerir com IA"
              request={() => ({
                task: "suggest_differentials",
                context: data,
                messages: [
                  {
                    role: "system",
                    content:
                      "Você é um psiquiatra especialista. Com base nos achados clínicos fornecidos, " +
                      "elabore uma lista de diagnósticos diferenciais relevantes para este caso. " +
                      "Para cada diagnóstico diferencial, explique brevemente por que deve ser " +
                      "considerado e quais elementos clínicos falam a favor ou contra ele. " +
                      "Inclua diferenciais orgânicos quando pertinente. Seja objetivo e técnico.",
                  },
                  {
                    role: "user",
                    content: JSON.stringify(data, null, 2),
                  },
                ],
              })}
              onResult={(text) => patch({ diferenciais: text })}
            />
          }
        />
        <div className="p-5">
          <Field
            label="Diagnósticos Diferenciais"
            hint="Liste as condições que precisam ser diferenciadas do diagnóstico principal, com argumentação clínica."
          >
            <Textarea
              value={d.diferenciais}
              onChange={(e) => patch({ diferenciais: e.target.value })}
              rows={6}
              placeholder="Ex.: 1. Transtorno Bipolar tipo I — a favor: episódios de euforia prévios; contra: sem história familiar…"
            />
          </Field>
          <AiDisclaimer />
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Justificativa Clínica / Evidências                              */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                <FileCheck2 className="h-4 w-4" />
              </span>
              Justificativa Clínica / Evidências
            </span>
          }
          subtitle="Síntese dos elementos que sustentam a conclusão diagnóstica."
        />
        <div className="p-5">
          <Field
            label="Justificativa e Evidências Clínicas"
            hint="Descreva os achados objetivos e subjetivos que sustentam o diagnóstico: dados da anamnese, achados do exame psíquico, escalas aplicadas e exames complementares."
          >
            <Textarea
              value={d.justificativa}
              onChange={(e) => patch({ justificativa: e.target.value })}
              rows={6}
              placeholder="A conclusão diagnóstica é sustentada por: (1) … (2) … (3) …"
            />
          </Field>
        </div>
      </Card>
    </StepShell>
  );
}
