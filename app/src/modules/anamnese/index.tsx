import { Sparkles, Plus, Trash2 } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Input, Select, Button } from "@/components/ui";
import { TranscribeButton, AiAssistButton, AiDisclaimer, useAi } from "@/components/ai";
import { useExamSlice } from "@/context/ExamContext";
import { useToast } from "@/context/ToastContext";
import { SLICE } from "@/modules/sliceKeys";

// --------------------------------------------------------------------------
// Modelo de dados da Anamnese (fatia data.anamnese)
// --------------------------------------------------------------------------
/** Uma linha da tabela de uso de substâncias (núcleo da anamnese de reabilitação). */
interface SubstanceRow {
  substancia: string;
  inicio: string;
  via: string;
  quantidade: string;
  frequencia: string;
  ultimoUso: string;
  padrao: string;
}

const EMPTY_SUBSTANCE: SubstanceRow = {
  substancia: "",
  inicio: "",
  via: "",
  quantidade: "",
  frequencia: "",
  ultimoUso: "",
  padrao: "",
};

interface AnamneseSlice {
  context: string;
  identificacao: string;
  /** Transcrição bruta da consulta inteira (voz ou colada). */
  transcricaoBruta: string;
  /** Anotações que o profissional fez durante a consulta (apoio à IA). */
  anotacoes: string;
  qp: string;
  hda: string;
  hpp: string;
  alergias: string;
  medicacoes: string;
  familiar: string;
  pessoalSocial: string;
  habitos: string;
  /** Núcleo de reabilitação: tabela de uso de substâncias. */
  substancias: SubstanceRow[];
  /** Substância de maior impacto ("droga de escolha"). */
  drogaEscolha: string;
  /** Caracterização/gravidade do TUS (critérios DSM-5-TR / CID-11). */
  criteriosTUS: string;
  /** Notas livres do uso de substâncias (tolerância, abstinência, fissura, risco). */
  usoSubstanciasNotas: string;
  examesComplementares: string;
  exameFisico: string;
  examePsiquico: string;
  examePsiquicoSintese: string;
}

/** Chaves da fatia cujo valor é string (campos de texto editáveis). */
type StringFieldKey = {
  [K in keyof AnamneseSlice]: AnamneseSlice[K] extends string ? K : never;
}[keyof AnamneseSlice];

const DEFAULTS: AnamneseSlice = {
  context: "",
  identificacao: "",
  transcricaoBruta: "",
  anotacoes: "",
  qp: "",
  hda: "",
  hpp: "",
  alergias: "",
  medicacoes: "",
  familiar: "",
  pessoalSocial: "",
  habitos: "",
  substancias: [],
  drogaEscolha: "",
  criteriosTUS: "",
  usoSubstanciasNotas: "",
  examesComplementares: "",
  exameFisico: "",
  examePsiquico: "",
  examePsiquicoSintese: "",
};

const CONTEXTOS = [
  "Consultório Particular",
  "Ambulatório",
  "CAPS I",
  "CAPS II",
  "CAPS III (24h)",
  "CAPS AD",
  "CAPSi",
  "UBS",
  "Emergência / Pronto-Socorro",
  "Internação",
  "Interconsulta",
  "Hospital Dia",
  "Visita Domiciliar",
  "Residência Terapêutica",
];

// Campos que a IA preenche automaticamente a partir da transcrição + anotações.
// (As chaves precisam existir em AnamneseSlice.)
const ORGANIZE_FIELDS: { key: StringFieldKey; label: string }[] = [
  { key: "identificacao", label: "Identificação: idade, sexo, ocupação, estado civil" },
  { key: "qp", label: "Queixa Principal: motivo do atendimento, de preferência a fala literal do paciente" },
  { key: "hda", label: "História da Doença Atual: cronologia, sintomas e evolução" },
  { key: "hpp", label: "História Patológica Pregressa: comorbidades e internações" },
  { key: "alergias", label: "Alergias e reações adversas a medicamentos" },
  { key: "medicacoes", label: "Medicações de uso contínuo" },
  { key: "familiar", label: "História do contexto familiar" },
  { key: "pessoalSocial", label: "História pessoal e social" },
  { key: "habitos", label: "Hábitos e substâncias: álcool, drogas, sono e alimentação" },
  { key: "examesComplementares", label: "Exames complementares: laboratoriais e de imagem" },
  { key: "exameFisico", label: "Exame físico: sinais vitais e achados" },
];

const ORGANIZE_SYSTEM =
  "Você é um psiquiatra organizando uma anamnese a partir do registro de um atendimento. " +
  "Com base na TRANSCRIÇÃO da consulta e nas ANOTAÇÕES do profissional, distribua as informações nos campos indicados. " +
  "Regras: use APENAS informações presentes no material; nunca invente, deduza ou complete além do que foi dito; " +
  'se não houver informação para um campo, devolva string vazia (""); ' +
  "preserve a fala literal do paciente na queixa principal sempre que possível; " +
  "escreva de forma técnica, objetiva e em português. " +
  "Responda SOMENTE com um objeto JSON contendo exatamente estas chaves:\n" +
  ORGANIZE_FIELDS.map((f) => `- "${f.key}": ${f.label}`).join("\n");

export default function AnamneseStep() {
  const [a, patch] = useExamSlice<AnamneseSlice>(SLICE.anamnese, DEFAULTS);
  const { toast } = useToast();
  const { complete, loading: organizing } = useAi();

  /**
   * Envia a transcrição + anotações para a IA e distribui o resultado nos
   * campos da anamnese. Preenche APENAS campos vazios — nunca sobrescreve o
   * que o profissional já escreveu.
   */
  const organize = async () => {
    const transcricao = (a.transcricaoBruta || "").trim();
    const notas = (a.anotacoes || "").trim();
    if (!transcricao && !notas) {
      toast("Grave ou cole a transcrição da consulta antes de organizar.", "error");
      return;
    }

    const text = await complete({
      task: "organize",
      jsonMode: true,
      messages: [
        { role: "system", content: ORGANIZE_SYSTEM },
        {
          role: "user",
          content:
            `TRANSCRIÇÃO DA CONSULTA:\n${transcricao || "(vazio)"}\n\n` +
            `ANOTAÇÕES DO PROFISSIONAL:\n${notas || "(vazio)"}`,
        },
      ],
    });
    if (text == null) return; // erro já sinalizado pelo useAi

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      toast("Não consegui interpretar a resposta da IA. Tente novamente.", "error");
      return;
    }

    const updates: Record<string, string> = {};
    let filled = 0;
    let skipped = 0;
    for (const f of ORGANIZE_FIELDS) {
      const val = String(parsed[f.key] ?? "").trim();
      if (!val) continue;
      if ((a[f.key] || "").trim()) {
        skipped++; // já preenchido pelo profissional — preserva
        continue;
      }
      updates[f.key] = val;
      filled++;
    }

    if (filled === 0) {
      toast(
        skipped > 0
          ? "Os campos já têm conteúdo — nada foi sobrescrito."
          : "Não encontrei informações para distribuir nos campos.",
        "info",
      );
      return;
    }

    patch(updates as Partial<AnamneseSlice>);
    toast(
      `${filled} campo(s) preenchido(s)${skipped ? `, ${skipped} preservado(s)` : ""}. Revise antes de salvar.`,
      "success",
    );
  };

  // ---- Tabela de uso de substâncias -------------------------------------
  const subs = a.substancias ?? [];
  const setRow = (i: number, field: keyof SubstanceRow, value: string) =>
    patch({ substancias: subs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)) });
  const addRow = () => patch({ substancias: [...subs, { ...EMPTY_SUBSTANCE }] });
  const removeRow = (i: number) =>
    patch({ substancias: subs.filter((_, idx) => idx !== i) });

  /** Extrai a tabela de uso de substâncias da transcrição/notas via IA. */
  const extractSubstances = async () => {
    const base = `${a.transcricaoBruta || ""}\n${a.usoSubstanciasNotas || ""}`.trim();
    if (!base) {
      toast("Grave/cole a transcrição ou as notas de uso antes de extrair.", "error");
      return;
    }
    const hasSubs = subs.some((r) => r.substancia.trim());
    const text = await complete({
      task: "organize",
      jsonMode: true,
      messages: [
        {
          role: "system",
          content:
            "Você é psiquiatra. A partir do material clínico, extraia a HISTÓRIA DE USO DE SUBSTÂNCIAS. " +
            "Responda em JSON com as chaves: " +
            '"substancias" (lista de objetos com substancia, inicio, via, quantidade, frequencia, ultimoUso, padrao), ' +
            '"drogaEscolha" (substância de maior impacto) e ' +
            '"criteriosTUS" (gravidade DSM-5-TR/CID-11: leve/moderado/grave; tolerância, abstinência, fissura). ' +
            "Use APENAS o que estiver no material; não invente. Campos sem informação = string vazia; " +
            "se nenhuma substância for citada, devolva substancias como lista vazia.",
        },
        { role: "user", content: base },
      ],
    });
    if (text == null) return;

    let parsed: { substancias?: unknown; drogaEscolha?: unknown; criteriosTUS?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      toast("Não consegui interpretar a resposta da IA. Tente novamente.", "error");
      return;
    }

    const rawList = Array.isArray(parsed.substancias) ? parsed.substancias : [];
    const rows: SubstanceRow[] = rawList
      .map((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        return {
          substancia: String(o.substancia ?? "").trim(),
          inicio: String(o.inicio ?? "").trim(),
          via: String(o.via ?? "").trim(),
          quantidade: String(o.quantidade ?? "").trim(),
          frequencia: String(o.frequencia ?? "").trim(),
          ultimoUso: String(o.ultimoUso ?? "").trim(),
          padrao: String(o.padrao ?? "").trim(),
        };
      })
      .filter((r) => r.substancia);

    const updates: Partial<AnamneseSlice> = {};
    if (rows.length && !hasSubs) updates.substancias = rows;
    const droga = String(parsed.drogaEscolha ?? "").trim();
    if (droga && !a.drogaEscolha.trim()) updates.drogaEscolha = droga;
    const crit = String(parsed.criteriosTUS ?? "").trim();
    if (crit && !a.criteriosTUS.trim()) updates.criteriosTUS = crit;

    if (Object.keys(updates).length === 0) {
      toast(
        hasSubs
          ? "A tabela já tem conteúdo — nada foi sobrescrito."
          : "Não encontrei uso de substâncias no material.",
        "info",
      );
      return;
    }
    patch(updates);
    toast("Uso de substâncias preenchido. Revise antes de salvar.", "success");
  };

  /** Helper: campo de texto longo com botão de transcrição opcional. */
  const TextField = ({
    label,
    field,
    hint,
    rows = 3,
    transcribe = true,
  }: {
    label: string;
    field: StringFieldKey;
    hint?: string;
    rows?: number;
    transcribe?: boolean;
  }) => (
    <Field label={label} hint={hint}>
      {transcribe && (
        <div className="mb-2">
          <TranscribeButton
            onTranscript={(t) =>
              patch({ [field]: (a[field] ? a[field] + " " : "") + t } as Partial<AnamneseSlice>)
            }
          />
        </div>
      )}
      <Textarea
        value={a[field]}
        onChange={(e) => patch({ [field]: e.target.value } as Partial<AnamneseSlice>)}
        rows={rows}
      />
    </Field>
  );

  return (
    <StepShell
      title="Anamnese"
      description="Registro longitudinal da história clínica. Use a transcrição inteligente para registrar o atendimento por voz."
    >
      <Card className="mb-4">
        <CardHeader title="Contexto do Atendimento" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Local do atendimento">
            <Select
              value={a.context}
              onChange={(e) => patch({ context: e.target.value })}
            >
              <option value="">Selecione…</option>
              {CONTEXTOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Identificação (dados sociodemográficos)">
            <Input
              value={a.identificacao}
              onChange={(e) => patch({ identificacao: e.target.value })}
              placeholder="Idade, sexo, ocupação, estado civil…"
            />
          </Field>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader
          title="Transcrição do Atendimento"
          subtitle="Grave a consulta uma única vez (ou cole o texto) e deixe a IA distribuir o conteúdo nos campos abaixo. As anotações do profissional ajudam a organização."
        />
        <div className="p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <TranscribeButton
              onTranscript={(t) =>
                patch({
                  transcricaoBruta:
                    (a.transcricaoBruta ? a.transcricaoBruta + " " : "") + t,
                })
              }
            />
            <Button
              type="button"
              variant="ai"
              size="sm"
              loading={organizing}
              icon={<Sparkles className="h-4 w-4" />}
              onClick={organize}
            >
              Organizar nos campos
            </Button>
          </div>
          <Field
            label="Transcrição da consulta"
            hint="Texto bruto do atendimento — gravado por voz ou colado. Editável."
          >
            <Textarea
              value={a.transcricaoBruta}
              onChange={(e) => patch({ transcricaoBruta: e.target.value })}
              rows={6}
              placeholder="Transcrição da conversa com o paciente…"
            />
          </Field>
          <Field
            label="Anotações do profissional"
            hint="Cole aqui o que você anotou durante a consulta — serve de apoio para a IA organizar os campos."
          >
            <Textarea
              value={a.anotacoes}
              onChange={(e) => patch({ anotacoes: e.target.value })}
              rows={4}
              placeholder="Observações, hipóteses, lembretes…"
            />
          </Field>
          <AiDisclaimer text="A organização automática preenche apenas campos vazios e nunca sobrescreve o que você já escreveu. Revise tudo — a decisão clínica é sempre do profissional." />
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader title="História Clínica" />
        <div className="p-5">
          <TextField
            label="Queixa Principal (QP)"
            field="qp"
            hint="Motivo do atendimento — preferencialmente a fala literal do paciente."
            rows={2}
          />
          <TextField
            label="História da Doença Atual (HDA)"
            field="hda"
            hint="Cronologia, sintomas e evolução."
            rows={5}
          />
          <TextField
            label="História Patológica Pregressa (HPP)"
            field="hpp"
            hint="Comorbidades e internações."
          />
          <TextField
            label="Alergias e Reações Adversas"
            field="alergias"
            transcribe={false}
            rows={2}
          />
          <TextField
            label="Medicações de Uso Contínuo"
            field="medicacoes"
            transcribe={false}
          />
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader
          title="História do Uso de Substâncias"
          subtitle="Opcional — preencha quando houver uso de substâncias. Detalhe cada substância; aplique AUDIT/CIWA-Ar/COWS na etapa de Escalas."
          actions={
            <Button
              type="button"
              variant="ai"
              size="sm"
              loading={organizing}
              icon={<Sparkles className="h-4 w-4" />}
              onClick={extractSubstances}
            >
              Extrair da transcrição (IA)
            </Button>
          }
        />
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-2">Substância</th>
                  <th className="pb-2 pr-2">Início</th>
                  <th className="pb-2 pr-2">Via</th>
                  <th className="pb-2 pr-2">Quantidade</th>
                  <th className="pb-2 pr-2">Frequência</th>
                  <th className="pb-2 pr-2">Último uso</th>
                  <th className="pb-2 pr-2">Padrão atual</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-3 text-sm text-slate-400">
                      Nenhuma substância registrada. Use "Adicionar substância" ou "Extrair da transcrição (IA)".
                    </td>
                  </tr>
                )}
                {subs.map((row, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-1 pr-2">
                      <Input value={row.substancia} onChange={(e) => setRow(i, "substancia", e.target.value)} placeholder="Álcool" />
                    </td>
                    <td className="py-1 pr-2">
                      <Input value={row.inicio} onChange={(e) => setRow(i, "inicio", e.target.value)} placeholder="15a" />
                    </td>
                    <td className="py-1 pr-2">
                      <Input value={row.via} onChange={(e) => setRow(i, "via", e.target.value)} placeholder="VO" />
                    </td>
                    <td className="py-1 pr-2">
                      <Input value={row.quantidade} onChange={(e) => setRow(i, "quantidade", e.target.value)} placeholder="750 mL/dia" />
                    </td>
                    <td className="py-1 pr-2">
                      <Input value={row.frequencia} onChange={(e) => setRow(i, "frequencia", e.target.value)} placeholder="diária" />
                    </td>
                    <td className="py-1 pr-2">
                      <Input value={row.ultimoUso} onChange={(e) => setRow(i, "ultimoUso", e.target.value)} placeholder="há 10h" />
                    </td>
                    <td className="py-1 pr-2">
                      <Input value={row.padrao} onChange={(e) => setRow(i, "padrao", e.target.value)} placeholder="dependência grave" />
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        aria-label="Remover substância"
                        className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={addRow}>
              Adicionar substância
            </Button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Droga de escolha" hint="Substância de maior impacto.">
              <Input
                value={a.drogaEscolha}
                onChange={(e) => patch({ drogaEscolha: e.target.value })}
                placeholder="Ex.: álcool"
              />
            </Field>
            <Field
              label="Gravidade / critérios (DSM-5-TR / CID-11)"
              hint="Leve (2–3) · moderado (4–5) · grave (≥6); tolerância, abstinência, fissura."
            >
              <Input
                value={a.criteriosTUS}
                onChange={(e) => patch({ criteriosTUS: e.target.value })}
                placeholder="Ex.: TUS álcool grave (≥6 critérios)"
              />
            </Field>
          </div>
          <Field
            label="Observações"
            hint="Tolerância, abstinência, fissura, comportamentos de risco, tratamentos prévios e recaídas."
          >
            <div className="mb-2">
              <TranscribeButton
                onTranscript={(t) =>
                  patch({
                    usoSubstanciasNotas:
                      (a.usoSubstanciasNotas ? a.usoSubstanciasNotas + " " : "") + t,
                  })
                }
              />
            </div>
            <Textarea
              value={a.usoSubstanciasNotas}
              onChange={(e) => patch({ usoSubstanciasNotas: e.target.value })}
              rows={4}
            />
          </Field>
          <AiDisclaimer text="A extração por IA preenche apenas campos vazios. Confirme cada dado — a decisão clínica é do profissional." />
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader title="História de Vida e Contexto" />
        <div className="p-5">
          <TextField label="História do Contexto Familiar" field="familiar" />
          <TextField label="História Pessoal e Social" field="pessoalSocial" rows={4} />
          <TextField
            label="Hábitos e Substâncias"
            field="habitos"
            hint="Álcool, drogas, sono e alimentação."
          />
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader title="Exames e Achados Físicos" />
        <div className="p-5">
          <TextField
            label="Exames Complementares"
            field="examesComplementares"
            hint="Laboratoriais e de imagem."
            transcribe={false}
          />
          <TextField
            label="Exame Físico"
            field="exameFisico"
            hint="Sinais vitais e achados físicos."
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Exame Psíquico (Transcrição na Íntegra)"
          subtitle="Registre o exame psíquico por voz ou texto e, opcionalmente, sintetize com IA."
        />
        <div className="p-5">
          <div className="mb-2 flex flex-wrap gap-2">
            <TranscribeButton
              onTranscript={(t) =>
                patch({ examePsiquico: (a.examePsiquico ? a.examePsiquico + " " : "") + t })
              }
            />
            <AiAssistButton
              label="Sintetizar e Preencher"
              request={() => ({
                task: "synthesize",
                messages: [
                  {
                    role: "system",
                    content:
                      "Você é um psiquiatra. Sintetize o exame psíquico a seguir em um texto técnico, organizado por domínios semiológicos, claro e objetivo. Não invente dados.",
                  },
                  { role: "user", content: a.examePsiquico || "(sem conteúdo)" },
                ],
              })}
              onResult={(text) => patch({ examePsiquicoSintese: text })}
            />
          </div>
          <Field label="Transcrição na íntegra">
            <Textarea
              value={a.examePsiquico}
              onChange={(e) => patch({ examePsiquico: e.target.value })}
              rows={5}
            />
          </Field>
          {a.examePsiquicoSintese && (
            <Field label="Síntese (IA)">
              <Textarea
                value={a.examePsiquicoSintese}
                onChange={(e) => patch({ examePsiquicoSintese: e.target.value })}
                rows={5}
              />
              <AiDisclaimer />
            </Field>
          )}
        </div>
      </Card>
    </StepShell>
  );
}
