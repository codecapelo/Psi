import { Sparkles } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Input, Select, Button } from "@/components/ui";
import { TranscribeButton, AiAssistButton, AiDisclaimer, useAi } from "@/components/ai";
import { useExamSlice } from "@/context/ExamContext";
import { useToast } from "@/context/ToastContext";
import { SLICE } from "@/modules/sliceKeys";

// --------------------------------------------------------------------------
// Modelo de dados da Anamnese (fatia data.anamnese)
// --------------------------------------------------------------------------
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
  examesComplementares: string;
  exameFisico: string;
  examePsiquico: string;
  examePsiquicoSintese: string;
}

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
const ORGANIZE_FIELDS: { key: keyof AnamneseSlice; label: string }[] = [
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

  /** Helper: campo de texto longo com botão de transcrição opcional. */
  const TextField = ({
    label,
    field,
    hint,
    rows = 3,
    transcribe = true,
  }: {
    label: string;
    field: keyof AnamneseSlice;
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
