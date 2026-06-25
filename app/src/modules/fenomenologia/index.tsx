import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea } from "@/components/ui";
import { useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";

// --------------------------------------------------------------------------
// Modelo de dados da Fenomenologia (fatia data.fenomenologia)
// --------------------------------------------------------------------------
interface FenomenologiaSlice {
  cenaEncontro: string;
  fenomenoNuclear: string;
  temporalidadeVivida: string;
  espacialidadeCorporeidade: string;
  intersubjetividade: string;
  ipseidade: string;
  tonalidadeAfetiva: string;
  sintese: string;
}

const DEFAULTS: FenomenologiaSlice = {
  cenaEncontro: "",
  fenomenoNuclear: "",
  temporalidadeVivida: "",
  espacialidadeCorporeidade: "",
  intersubjetividade: "",
  ipseidade: "",
  tonalidadeAfetiva: "",
  sintese: "",
};

/**
 * Campo de texto longo de um tópico fenomenológico.
 *
 * IMPORTANTE: componente de TOPO (fora do render do passo). Se for declarado
 * dentro de FenomenologiaStep, sua identidade muda a cada render e o React
 * remonta o <Textarea> a cada tecla — fazendo o input perder o foco.
 */
function TextField({
  label,
  field,
  slice,
  patch,
  hint,
  rows = 4,
}: {
  label: string;
  field: keyof FenomenologiaSlice;
  slice: FenomenologiaSlice;
  patch: (updates: Partial<FenomenologiaSlice>) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        value={slice[field]}
        onChange={(e) => patch({ [field]: e.target.value } as Partial<FenomenologiaSlice>)}
        rows={rows}
      />
    </Field>
  );
}

export default function FenomenologiaStep() {
  const [s, patch] = useExamSlice<FenomenologiaSlice>(SLICE.fenomenologia, DEFAULTS);

  return (
    <StepShell
      title="Fenomenologia"
      description="Roteiro de Exame Fenomenológico — abordagem clínica, não diagnóstica. Descreva a experiência vivida do paciente a partir das categorias existenciais."
    >
      {/* Bloco 1: Encontro */}
      <Card className="mb-4">
        <CardHeader
          title="Encontro Clínico"
          subtitle="Como o paciente se apresenta e qual é o clima da consulta."
        />
        <div className="p-5">
          <TextField
            slice={s}
            patch={patch}
            label="1. Cena do encontro e modo de presença"
            field="cenaEncontro"
            hint="Observe como o paciente entra, ocupa o espaço, se porta corporalmente e qual é o tom emocional do encontro — o 'clima' intersubjetivo que se instala desde o início."
          />
        </div>
      </Card>

      {/* Bloco 2: Experiência central */}
      <Card className="mb-4">
        <CardHeader
          title="Experiência Central"
          subtitle="O fenômeno que organiza o sofrimento e como o tempo é vivenciado."
        />
        <div className="p-5">
          <TextField
            slice={s}
            patch={patch}
            label="2. Fenômeno nuclear"
            field="fenomenoNuclear"
            hint="Qual é a experiência central que organiza o sofrimento do paciente? Descreva o fenômeno tal como ele se apresenta — sem reduzi-lo a diagnóstico — buscando a estrutura intencional do vivido (ex.: angústia sem objeto, vazio, dissolução)."
          />
          <TextField
            slice={s}
            patch={patch}
            label="3. Temporalidade vivida"
            field="temporalidadeVivida"
            hint="Como o paciente experiencia passado, presente e futuro? Exemplos: futuro bloqueado ou inexistente na depressão; presente paralisado no trauma; passado que invade o agora no PTSD; aceleração temporal na mania."
          />
        </div>
      </Card>

      {/* Bloco 3: Corpo e espaço */}
      <Card className="mb-4">
        <CardHeader
          title="Corpo, Espaço e Alteridade"
          subtitle="Como o paciente habita o próprio corpo, o espaço e a relação com os outros."
        />
        <div className="p-5">
          <TextField
            slice={s}
            patch={patch}
            label="4. Espacialidade e corporeidade"
            field="espacialidadeCorporeidade"
            hint="Como o paciente vivencia seu corpo e o espaço ao redor? Considere: postura, movimento, sensações corporais, distância interpessoal, vivências de estranheza ou invasão corporal, despersonalização ou desrealização."
          />
          <TextField
            slice={s}
            patch={patch}
            label="5. Intersubjetividade (ser-com-o-outro)"
            field="intersubjetividade"
            hint="Como o paciente se relaciona com os outros? Observe: capacidade de ressonância afetiva, abertura ou fechamento ao contato, padrões de retraimento, fusão ou isolamento, e a qualidade do vínculo que se estabelece na própria consulta."
          />
        </div>
      </Card>

      {/* Bloco 4: Self e afeto de fundo */}
      <Card className="mb-4">
        <CardHeader
          title="Self e Tonalidade Afetiva"
          subtitle="Senso de identidade e o humor de fundo que colore toda a experiência."
        />
        <div className="p-5">
          <TextField
            slice={s}
            patch={patch}
            label="6. Ipseidade / self"
            field="ipseidade"
            hint="Como o paciente experiencia a si mesmo? Investigue: senso de continuidade e unidade do eu, familiaridade consigo, fronteiras entre self e mundo, e alterações como despersonalização, pensamento inserido ou vivências de passividade."
          />
          <TextField
            slice={s}
            patch={patch}
            label="7. Tonalidade afetiva de fundo (Stimmung)"
            field="tonalidadeAfetiva"
            hint="Qual é o 'humor de fundo' — a atmosfera afetiva que colore toda a experiência do paciente, anterior a qualquer emoção específica? Ex.: melancolia como estreitamento do mundo, angústia como abertura sem chão, euforia como expansão ilimitada."
          />
        </div>
      </Card>

      {/* Bloco 5: Síntese fenomenológica */}
      <Card>
        <CardHeader
          title="Síntese Fenomenológica"
          subtitle="Integração descritiva do caso, redigida pelo profissional."
        />
        <div className="p-5">
          <Field
            label="8. Síntese fenomenológica"
            hint="Integração descritiva do caso: articule as categorias exploradas acima em uma narrativa coerente que capture a estrutura existencial do sofrimento vivido pelo paciente."
          >
            <Textarea
              value={s.sintese}
              onChange={(e) => patch({ sintese: e.target.value })}
              rows={8}
            />
          </Field>
        </div>
      </Card>
    </StepShell>
  );
}
