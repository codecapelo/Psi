import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Input, Select } from "@/components/ui";
import { TranscribeButton, AiAssistButton, AiDisclaimer } from "@/components/ai";
import { useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";

// --------------------------------------------------------------------------
// Modelo de dados da Anamnese (fatia data.anamnese)
// --------------------------------------------------------------------------
interface AnamneseSlice {
  context: string;
  identificacao: string;
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

export default function AnamneseStep() {
  const [a, patch] = useExamSlice<AnamneseSlice>(SLICE.anamnese, DEFAULTS);

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
