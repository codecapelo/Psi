import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { FileText, Plus, Settings, Trash2, Download, Printer, Star } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import {
  Card,
  CardHeader,
  Field,
  Input,
  Textarea,
  Modal,
  Button,
  Badge,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { useExam } from "@/context/ExamContext";
import { useToast } from "@/context/ToastContext";
import apiClient from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { SLICE } from "@/modules/sliceKeys";
import { BUILTIN_TEMPLATES, type BuiltinTemplate } from "./builtins";
import type { ReportTemplate } from "@/lib/types";

// --------------------------------------------------------------------------
// Tipos internos
// --------------------------------------------------------------------------

/** Shape normalizada para a lista de modelos (builtins + custom). */
interface NormalizedTemplate {
  id: string;
  name: string;
  body: string;
  isBuiltin: boolean;
  recommended?: boolean;
}

/** Contexto de substituição de placeholders. */
type PlaceholderCtx = Record<string, string>;

// --------------------------------------------------------------------------
// Shapes mínimas para acessar fatias do ExamData (que é Record<string,unknown>)
// --------------------------------------------------------------------------

interface AnamneseShape {
  qp?: string;
  hda?: string;
  context?: string;
}

interface DiagnosticoShape {
  sindromico?: string;
  nosologico?: string;
}

interface PtsShape {
  orientacoes?: string;
}

// --------------------------------------------------------------------------
// buildContext — monta o mapa de placeholders a partir do exame
// --------------------------------------------------------------------------

/** dd/mm/yyyy a partir de uma data yyyy-mm-dd, sem deslocamento de fuso. */
function formatNascimento(s?: string): string {
  if (!s) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

/** Idade (anos) a partir da data de nascimento yyyy-mm-dd. */
function calcIdade(nascimento?: string): string {
  const m = nascimento ? /^(\d{4})-(\d{2})-(\d{2})/.exec(nascimento) : null;
  if (!m) return "";
  const nasc = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(nasc.getTime())) return "";
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade >= 0 && idade < 200 ? String(idade) : "";
}

function buildContext(
  exam: ReturnType<typeof useExam>["exam"],
  data: ReturnType<typeof useExam>["data"],
  medico: string,
  crm: string,
): PlaceholderCtx {
  const anamnese = (data[SLICE.anamnese] as AnamneseShape | undefined) ?? {};
  const diagnostico = (data[SLICE.diagnostico] as DiagnosticoShape | undefined) ?? {};
  const pts = (data[SLICE.pts] as PtsShape | undefined) ?? {};
  const det = exam?.patient?.details ?? {};

  const hoje = new Date().toISOString();

  return {
    paciente: exam?.patient?.name ?? "____",
    idExterno: exam?.patient?.externalId ?? "____",
    data: formatDate(hoje),
    contexto: anamnese.context ?? "____",
    queixa: anamnese.qp ?? "____",
    hda: anamnese.hda ?? "____",
    diagnostico: diagnostico.sindromico ?? "____",
    nosologico: diagnostico.nosologico ?? "____",
    // {{cid}} é sinônimo de {{nosologico}}
    cid: diagnostico.nosologico ?? "____",
    conduta: pts.orientacoes ?? "____",
    medico: medico || "____",
    crm: crm || "____",
    // Dados cadastrais do paciente (preenchem documentos automaticamente).
    nascimento: formatNascimento(det.nascimento) || "____",
    idade: calcIdade(det.nascimento) || "____",
    sexo: det.sexo || "____",
    cpf: det.cpf || "____",
    rg: det.rg || "____",
    nomeMae: det.nomeMae || "____",
    nacionalidade: det.nacionalidade || "____",
    naturalidade: det.naturalidade || "____",
    estadoCivil: det.estadoCivil || "____",
    profissao: det.profissao || "____",
    escolaridade: det.escolaridade || "____",
    endereco: det.endereco || "____",
    telefone: det.telefone || "____",
  };
}

// --------------------------------------------------------------------------
// applyTemplate — substitui todos os {{chave}} pelos valores do contexto
// --------------------------------------------------------------------------

function applyTemplate(body: string, ctx: PlaceholderCtx): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => ctx[key] ?? "____");
}

// --------------------------------------------------------------------------
// generatePDF — cria e salva o PDF com paginação automática
// --------------------------------------------------------------------------

function generatePDF(title: string, content: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;

  // Título
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, maxLineWidth) as string[];
  for (const line of titleLines) {
    if (y + 7 > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
    doc.text(line, marginLeft, y);
    y += 7;
  }

  // Separador
  y += 4;

  // Corpo
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Divide por linhas preservando quebras explícitas
  const rawLines = content.split("\n");
  for (const rawLine of rawLines) {
    const wrapped = doc.splitTextToSize(rawLine || " ", maxLineWidth) as string[];
    for (const wrappedLine of wrapped) {
      if (y + 6 > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(wrappedLine, marginLeft, y);
      y += 6;
    }
  }

  const safeName = title.replace(/[^a-zA-Z0-9_\-À-ɏ]/g, "_");
  doc.save(`${safeName}.pdf`);
}

// --------------------------------------------------------------------------
// LaudosStep — componente principal
// --------------------------------------------------------------------------

export default function LaudosStep() {
  const { exam, data } = useExam();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dados do médico (não estão no exame; editáveis localmente)
  const [medico, setMedico] = useState("");
  const [crm, setCrm] = useState("");

  // Modelo selecionado e texto editável
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [editableBody, setEditableBody] = useState<string>("");

  // Modals
  const [showNew, setShowNew] = useState(false);
  const [showManage, setShowManage] = useState(false);

  // Formulário de novo modelo
  const [newName, setNewName] = useState("");
  const [newBody, setNewBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Query dos modelos custom do backend
  const { data: customTemplates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["templates"],
    queryFn: () => apiClient.templates.list(),
    select: (list: ReportTemplate[]) => list.filter((t) => !t.builtin),
  });

  // Lista normalizada: builtins + custom
  const templates: NormalizedTemplate[] = [
    ...BUILTIN_TEMPLATES.map((b: BuiltinTemplate) => ({
      id: b.id,
      name: b.name,
      body: b.body,
      isBuiltin: true,
      recommended: b.recommended,
    })),
    ...customTemplates.map((t: ReportTemplate) => ({
      id: t.id,
      name: t.name,
      body: t.body,
      isBuiltin: false,
      recommended: false,
    })),
  ];

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  function handleSelectTemplate(tpl: NormalizedTemplate) {
    const ctx = buildContext(exam, data, medico, crm);
    const filled = applyTemplate(tpl.body, ctx);
    setSelectedId(tpl.id);
    setSelectedName(tpl.name);
    setEditableBody(filled);
  }

  function handleDownloadPdf() {
    if (!editableBody) {
      toast("Selecione um modelo antes de baixar o PDF.", "error");
      return;
    }
    try {
      generatePDF(selectedName || "Laudo", editableBody);
      toast("PDF gerado com sucesso.", "success");
    } catch (err) {
      console.error(err);
      toast("Erro ao gerar o PDF.", "error");
    }
  }

  function handlePrint() {
    if (!editableBody) {
      toast("Selecione um modelo antes de imprimir.", "error");
      return;
    }
    window.print();
  }

  async function handleCreateTemplate() {
    if (!newName.trim() || !newBody.trim()) {
      toast("Preencha o nome e o corpo do modelo.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiClient.templates.create({ name: newName.trim(), body: newBody.trim() });
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast(`Modelo "${newName.trim()}" criado com sucesso.`, "success");
      setNewName("");
      setNewBody("");
      setShowNew(false);
    } catch (err) {
      console.error(err);
      toast("Erro ao criar o modelo.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(id: string, name: string) {
    setDeleting(id);
    try {
      await apiClient.templates.remove(id);
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast(`Modelo "${name}" removido.`, "info");
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedName("");
        setEditableBody("");
      }
    } catch (err) {
      console.error(err);
      toast("Erro ao remover o modelo.", "error");
    } finally {
      setDeleting(null);
    }
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const hasSelection = !!editableBody;

  return (
    <StepShell
      title="Relatórios e Laudos"
      description="Geração de documentos a partir dos dados do exame."
    >
      {/* ── Dados do profissional ─────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader
          title="Dados do Profissional"
          subtitle="Preencha antes de selecionar um modelo para que os campos sejam substituídos automaticamente."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nome do médico / profissional">
            <Input
              value={medico}
              onChange={(e) => setMedico(e.target.value)}
              placeholder="Dr(a). Nome Completo"
            />
          </Field>
          <Field label="CRM">
            <Input
              value={crm}
              onChange={(e) => setCrm(e.target.value)}
              placeholder="CRM/UF 000000"
            />
          </Field>
        </div>
      </Card>

      {/* ── Lista de modelos ──────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader
          title="Selecione um Modelo"
          subtitle="Modelos pré-instalados e personalizados. Clique para preencher automaticamente com os dados do exame."
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Settings className="h-4 w-4" />}
                onClick={() => setShowManage(true)}
              >
                Gerenciar Modelos
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowNew(true)}
              >
                Criar Novo
              </Button>
            </div>
          }
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loadingTemplates && (
            <p className="flex items-center gap-2 px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
              <Spinner className="h-4 w-4" />
              Carregando modelos personalizados…
            </p>
          )}
          {!loadingTemplates && templates.length === 0 && (
            <div className="p-5">
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title="Nenhum modelo disponível"
                description='Crie um modelo personalizado clicando em "Criar Novo".'
              />
            </div>
          )}
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={[
                "flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left",
                "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60",
                selectedId === tpl.id
                  ? "bg-brand-50 dark:bg-brand-900/20"
                  : "",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors",
                    selectedId === tpl.id
                      ? "bg-brand-100 text-brand-600 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-900/50"
                      : "bg-slate-100 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700",
                  ].join(" ")}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                </span>
                <span
                  className={[
                    "truncate text-sm font-medium",
                    selectedId === tpl.id
                      ? "text-brand-700 dark:text-brand-300"
                      : "text-slate-700 dark:text-slate-200",
                  ].join(" ")}
                >
                  {tpl.name}
                </span>
                {tpl.recommended && (
                  <Badge color="brand">
                    <Star className="mr-1 h-3 w-3" />
                    Recomendado
                  </Badge>
                )}
                {!tpl.isBuiltin && (
                  <Badge color="slate">Personalizado</Badge>
                )}
              </div>
              {tpl.isBuiltin && (
                <Badge color="slate">Pré-instalado</Badge>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Área de edição do documento ───────────────────────────────── */}
      {hasSelection && (
        <Card className="mb-4">
          <CardHeader
            title={selectedName}
            subtitle="Texto gerado automaticamente. Revise e ajuste antes de exportar."
            actions={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Printer className="h-4 w-4" />}
                  onClick={handlePrint}
                >
                  Imprimir
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleDownloadPdf}
                >
                  Baixar PDF
                </Button>
              </div>
            }
          />
          <div className="p-5">
            <Field
              label="Documento (editável)"
              hint="Edite o texto conforme necessário. Campos marcados com ____ não foram preenchidos no exame."
            >
              <Textarea
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                rows={20}
                className="bg-slate-50/60 font-mono text-xs leading-relaxed dark:bg-slate-950/40"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Printer className="h-4 w-4" />}
                onClick={handlePrint}
              >
                Imprimir
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={handleDownloadPdf}
              >
                Baixar PDF
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!hasSelection && (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Nenhum modelo selecionado"
          description="Escolha um modelo acima para gerar o documento com os dados do exame."
        />
      )}

      {/* ── Modal: Criar Novo Modelo ──────────────────────────────────── */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Criar Novo Modelo"
        size="lg"
      >
        <div className="space-y-4">
          <Field label="Nome do modelo" required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Laudo para DETRAN"
            />
          </Field>
          <Field
            label="Corpo do modelo"
            hint={
              "Placeholders disponíveis: {{paciente}}, {{idExterno}}, {{data}}, {{contexto}}, " +
              "{{queixa}}, {{hda}}, {{diagnostico}}, {{nosologico}}, {{cid}}, " +
              "{{conduta}}, {{medico}}, {{crm}} · Cadastro: {{nascimento}}, {{idade}}, " +
              "{{sexo}}, {{cpf}}, {{rg}}, {{nomeMae}}, {{nacionalidade}}, {{naturalidade}}, " +
              "{{estadoCivil}}, {{profissao}}, {{escolaridade}}, {{endereco}}, {{telefone}}"
            }
            required
          >
            <Textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={14}
              className="font-mono text-xs"
              placeholder={"ATESTADO MÉDICO\n\nAtesto que {{paciente}}…"}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={() => void handleCreateTemplate()}
            >
              Salvar Modelo
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Gerenciar Modelos ──────────────────────────────────── */}
      <Modal
        open={showManage}
        onClose={() => setShowManage(false)}
        title="Gerenciar Modelos Personalizados"
        size="md"
      >
        <div className="space-y-2">
          {customTemplates.length === 0 && (
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="Nenhum modelo personalizado"
              description='Crie modelos clicando em "Criar Novo" na tela principal.'
            />
          )}
          {customTemplates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/40"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t.name}
                </span>
              </span>
              <Button
                variant="danger"
                size="sm"
                loading={deleting === t.id}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => void handleDeleteTemplate(t.id, t.name)}
              >
                Excluir
              </Button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setShowManage(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </StepShell>
  );
}
