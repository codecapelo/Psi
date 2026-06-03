import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Input, Button } from "@/components/ui";
import { AiAssistButton, AiDisclaimer } from "@/components/ai";
import { useExam, useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";
import { Plus, Trash2 } from "lucide-react";

// --------------------------------------------------------------------------
// Tipos
// --------------------------------------------------------------------------

interface Atividade {
  acao: string;
  responsavel: string;
  prazo: string;
}

interface AtividadesBloco {
  preventivo: Atividade[];
  assistencial: Atividade[];
  gestao: Atividade[];
}

interface PtsSlice {
  resumoNecessidades: string;
  genograma: string;
  ecomapa: string;
  farmacoterapia: string;
  interacoes: string;
  orientacoes: string;
  tempoReavaliacao: string;
  fatoresRisco: string;
  fatoresProtecao: string;
  atividades: AtividadesBloco;
  acoesPactuadas: string;
}

const ATIVIDADE_VAZIA: Atividade = { acao: "", responsavel: "", prazo: "" };

const DEFAULTS: PtsSlice = {
  resumoNecessidades: "",
  genograma: "",
  ecomapa: "",
  farmacoterapia: "",
  interacoes: "",
  orientacoes: "",
  tempoReavaliacao: "",
  fatoresRisco: "",
  fatoresProtecao: "",
  atividades: {
    preventivo: [],
    assistencial: [],
    gestao: [],
  },
  acoesPactuadas: "",
};

// --------------------------------------------------------------------------
// Interface mínima para leitura da Anamnese (sem importar o módulo)
// --------------------------------------------------------------------------
interface AnamnesePartial {
  qp?: string;
  hda?: string;
  pessoalSocial?: string;
  identificacao?: string;
}

// --------------------------------------------------------------------------
// Componente auxiliar: linha de atividade
// --------------------------------------------------------------------------
function AtividadeLinha({
  atividade,
  onChange,
  onRemove,
  index,
}: {
  atividade: Atividade;
  onChange: (field: keyof Atividade, value: string) => void;
  onRemove: () => void;
  index: number;
}) {
  return (
    <div className="mb-2 flex items-start gap-2">
      <span className="mt-2 shrink-0 text-xs text-slate-400 dark:text-slate-500 w-5 text-right">
        {index + 1}.
      </span>
      <div className="flex-1 grid gap-2 sm:grid-cols-3">
        <Input
          value={atividade.acao}
          onChange={(e) => onChange("acao", e.target.value)}
          placeholder="Ação"
        />
        <Input
          value={atividade.responsavel}
          onChange={(e) => onChange("responsavel", e.target.value)}
          placeholder="Responsável"
        />
        <Input
          value={atividade.prazo}
          onChange={(e) => onChange("prazo", e.target.value)}
          placeholder="Prazo"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-2 shrink-0 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        aria-label="Remover linha"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Bloco de atividades (Preventivo / Assistencial / Gestão)
// --------------------------------------------------------------------------
type CategoriaAtividade = keyof AtividadesBloco;

function BlocoAtividades({
  titulo,
  categoria,
  lista,
  onUpdate,
}: {
  titulo: string;
  categoria: CategoriaAtividade;
  lista: Atividade[];
  onUpdate: (categoria: CategoriaAtividade, novaLista: Atividade[]) => void;
}) {
  const handleChange = (idx: number, field: keyof Atividade, value: string) => {
    const next = lista.map((a, i) => (i === idx ? { ...a, [field]: value } : a));
    onUpdate(categoria, next);
  };

  const handleRemove = (idx: number) => {
    onUpdate(categoria, lista.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    onUpdate(categoria, [...lista, { ...ATIVIDADE_VAZIA }]);
  };

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {titulo}
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={handleAdd}
        >
          Adicionar linha
        </Button>
      </div>

      {lista.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
          Nenhuma atividade cadastrada. Clique em "Adicionar linha".
        </p>
      ) : (
        <>
          {/* Cabeçalhos das colunas */}
          <div className="mb-1 hidden sm:grid sm:grid-cols-3 gap-2 pl-7 pr-8">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ação</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Responsável</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Prazo</span>
          </div>
          {lista.map((ativ, idx) => (
            <AtividadeLinha
              key={idx}
              index={idx}
              atividade={ativ}
              onChange={(field, value) => handleChange(idx, field, value)}
              onRemove={() => handleRemove(idx)}
            />
          ))}
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------
export default function PtsStep() {
  const { data } = useExam();
  const [p, patch] = useExamSlice<PtsSlice>(SLICE.pts, DEFAULTS);

  // Helper para atualizar uma categoria do bloco de atividades preservando as outras
  const updateAtividades = (categoria: CategoriaAtividade, novaLista: Atividade[]) => {
    patch({
      atividades: {
        ...p.atividades,
        [categoria]: novaLista,
      },
    });
  };

  // Importação local de dados da Anamnese — sem IA
  const importarDaAnamnese = () => {
    const anamnese = (data.anamnese ?? {}) as AnamnesePartial;
    const partes: string[] = [];

    if (anamnese.identificacao) {
      partes.push(`Identificação: ${anamnese.identificacao}`);
    }
    if (anamnese.qp) {
      partes.push(`Queixa Principal: ${anamnese.qp}`);
    }
    if (anamnese.hda) {
      partes.push(`História da Doença Atual: ${anamnese.hda}`);
    }
    if (anamnese.pessoalSocial) {
      partes.push(`História Pessoal e Social: ${anamnese.pessoalSocial}`);
    }

    const resumo = partes.length > 0
      ? partes.join("\n\n")
      : "(Anamnese ainda não preenchida.)";

    patch({ resumoNecessidades: resumo });
  };

  return (
    <StepShell
      title="PTS — Projeto Terapêutico Singular"
      description="Plano de cuidado multidisciplinar: necessidades, farmacoterapia, vulnerabilidade, atividades e pactuações com o usuário e família."
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. Resumo do Caso / Necessidades                                    */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Resumo do Caso e Necessidades"
          subtitle="Síntese clínica, contexto familiar e rede de apoio."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={importarDaAnamnese}
              >
                Importar da Anamnese
              </Button>
              <AiAssistButton
                label="Gerar Propostas via IA"
                request={() => ({
                  task: "suggest_pts",
                  messages: [
                    {
                      role: "system",
                      content:
                        "Você é um profissional de saúde mental experiente em CAPS. Com base nos dados clínicos fornecidos, elabore uma proposta de resumo de necessidades para um Projeto Terapêutico Singular (PTS), destacando necessidades prioritárias do usuário, vulnerabilidades e potencialidades. Use linguagem técnica e evite inventar informações não presentes nos dados.",
                    },
                    {
                      role: "user",
                      content: JSON.stringify(data, null, 2),
                    },
                  ],
                  context: data as Record<string, unknown>,
                })}
                onResult={(text) =>
                  patch({
                    resumoNecessidades:
                      (p.resumoNecessidades ? p.resumoNecessidades + "\n\n---\n\n" : "") + text,
                  })
                }
              />
            </div>
          }
        />
        <div className="p-5">
          <Field
            label="Resumo das Necessidades"
            hint="Síntese clínica, demandas prioritárias e objetivos do PTS."
          >
            <Textarea
              value={p.resumoNecessidades}
              onChange={(e) => patch({ resumoNecessidades: e.target.value })}
              rows={5}
            />
          </Field>

          <Field
            label="Genograma (descrição textual)"
            hint="Descreva a estrutura familiar, relações significativas e dinâmicas relevantes."
          >
            <Textarea
              value={p.genograma}
              onChange={(e) => patch({ genograma: e.target.value })}
              rows={3}
            />
          </Field>

          <Field
            label="Ecomapa (descrição textual)"
            hint="Mapeie a rede de suporte social: vínculos comunitários, serviços, grupos religiosos, etc."
          >
            <Textarea
              value={p.ecomapa}
              onChange={(e) => patch({ ecomapa: e.target.value })}
              rows={3}
            />
          </Field>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Proposta de Farmacoterapia                                       */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Proposta de Farmacoterapia"
          subtitle="Prescrição manual livre e análise de interações medicamentosas."
        />
        <div className="p-5">
          <Field
            label="Farmacoterapia (prescrição manual)"
            hint="Descreva o esquema farmacológico proposto: medicamento, dose, posologia e via."
          >
            <Textarea
              value={p.farmacoterapia}
              onChange={(e) => patch({ farmacoterapia: e.target.value })}
              rows={4}
            />
          </Field>

          <div className="mb-4 flex flex-wrap gap-2">
            <AiAssistButton
              label="Analisar Interações"
              request={() => ({
                task: "suggest_pts",
                messages: [
                  {
                    role: "system",
                    content:
                      "Você é um farmacêutico clínico especializado em psicofarmacologia. Analise o esquema medicamentoso informado e identifique potenciais interações medicamentosas, contraindicações relevantes e cuidados de monitoramento. Seja cauteloso e objetivo. Não substitua a avaliação do prescritor.",
                  },
                  {
                    role: "user",
                    content: p.farmacoterapia
                      ? `Esquema medicamentoso:\n${p.farmacoterapia}`
                      : "(Farmacoterapia não informada.)",
                  },
                ],
              })}
              onResult={(text) => patch({ interacoes: text })}
            />
          </div>

          {p.interacoes && (
            <Field label="Análise de Interações (IA)">
              <Textarea
                value={p.interacoes}
                onChange={(e) => patch({ interacoes: e.target.value })}
                rows={4}
              />
            </Field>
          )}

          <AiDisclaimer text="A análise de interações medicamentosas gerada por IA é apenas orientativa. Verifique sempre em bases farmacológicas reconhecidas (Micromedex, UpToDate, Bulário ANVISA). A decisão de prescrição é de responsabilidade exclusiva do profissional habilitado." />
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Orientações e Reavaliação                                        */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Orientações e Tempo de Reavaliação"
          subtitle="Orientações ao usuário e família; periodicidade de revisão do PTS."
        />
        <div className="p-5">
          <Field
            label="Orientações e Observações"
            hint="Instruções para o usuário, família e equipe; cuidados especiais."
          >
            <Textarea
              value={p.orientacoes}
              onChange={(e) => patch({ orientacoes: e.target.value })}
              rows={4}
            />
          </Field>

          <Field
            label="Tempo de Reavaliação"
            hint='Ex.: "30 dias", "3 meses", "Conforme evolução clínica".'
          >
            <Input
              value={p.tempoReavaliacao}
              onChange={(e) => patch({ tempoReavaliacao: e.target.value })}
              placeholder="Ex.: 30 dias"
            />
          </Field>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Avaliação de Vulnerabilidade                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Avaliação de Vulnerabilidade"
          subtitle="Identificação de fatores de risco e de proteção segundo critérios SOPsi."
        />
        <div className="p-5">
          <Field
            label="Fatores de risco (critérios SOPsi)"
            hint="Aspectos que aumentam a vulnerabilidade: isolamento, uso de substâncias, violência, etc."
          >
            <Textarea
              value={p.fatoresRisco}
              onChange={(e) => patch({ fatoresRisco: e.target.value })}
              rows={3}
            />
          </Field>

          <Field
            label="Fatores de proteção"
            hint="Recursos do usuário e rede que fortalecem o cuidado: vínculos, moradia, emprego, etc."
          >
            <Textarea
              value={p.fatoresProtecao}
              onChange={(e) => patch({ fatoresProtecao: e.target.value })}
              rows={3}
            />
          </Field>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Plano de Atividades (Matriz)                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Plano de Atividades"
          subtitle="Matriz de ações por eixo: Preventivo, Assistencial e de Gestão do Cuidado."
        />
        <div className="p-5">
          <BlocoAtividades
            titulo="Ações Preventivas"
            categoria="preventivo"
            lista={p.atividades.preventivo}
            onUpdate={updateAtividades}
          />

          <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

          <BlocoAtividades
            titulo="Ações Assistenciais"
            categoria="assistencial"
            lista={p.atividades.assistencial}
            onUpdate={updateAtividades}
          />

          <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

          <BlocoAtividades
            titulo="Ações de Gestão do Cuidado"
            categoria="gestao"
            lista={p.atividades.gestao}
            onUpdate={updateAtividades}
          />
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Ações Pactuadas com Usuário/Família                              */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title="Ações Pactuadas com Usuário e Família"
          subtitle="Registro dos compromissos construídos coletivamente na reunião do PTS."
        />
        <div className="p-5">
          <Field
            label="Ações Pactuadas"
            hint="Descreva os acordos estabelecidos com o usuário, família e equipe de referência."
          >
            <Textarea
              value={p.acoesPactuadas}
              onChange={(e) => patch({ acoesPactuadas: e.target.value })}
              rows={5}
            />
          </Field>
        </div>
      </Card>
    </StepShell>
  );
}
