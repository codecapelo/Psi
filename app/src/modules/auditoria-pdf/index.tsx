import { useRef, useState } from "react";
import {
  FileText,
  Trash2,
  Upload,
  MessageSquare,
  ChevronDown,
  FolderOpen,
  Sparkles,
  History,
  CornerDownRight,
} from "lucide-react";
import { StepShell } from "@/components/StepShell";
import {
  Card,
  CardHeader,
  Button,
  Textarea,
  Spinner,
  Badge,
  EmptyState,
} from "@/components/ui";
import { useAi, AiDisclaimer } from "@/components/ai";
import { useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";
import { extractPdfText } from "@/lib/pdf";

// --------------------------------------------------------------------------
// Modelo de dados
// --------------------------------------------------------------------------
interface DocEntry {
  name: string;
  text: string;
}

interface QaEntry {
  question: string;
  answer: string;
}

interface AuditoriaSlice {
  docs: DocEntry[];
  qa: QaEntry[];
}

const DEFAULTS: AuditoriaSlice = {
  docs: [],
  qa: [],
};

// Limite de caracteres enviados para a IA por segurança
const MAX_CHARS = 12000;

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------
export default function AuditoriaPdfStep() {
  const [slice, patch] = useExamSlice<AuditoriaSlice>(SLICE.auditoriaPdf, DEFAULTS);
  const { complete, loading: aiLoading } = useAi();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [truncated, setTruncated] = useState(false);

  // -------------------------------------------------------------------------
  // Upload e extração de PDFs
  // -------------------------------------------------------------------------
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const newDocs: DocEntry[] = [];
    for (const file of files) {
      try {
        const text = await extractPdfText(file);
        newDocs.push({ name: file.name, text });
      } catch (err) {
        setUploadError(
          `Falha ao processar "${file.name}": ${err instanceof Error ? err.message : "erro desconhecido"}.`,
        );
      }
    }

    if (newDocs.length > 0) {
      patch({ docs: [...slice.docs, ...newDocs] });
    }

    // Limpa o input para permitir re-seleção do mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  }

  function removeDoc(index: number) {
    patch({ docs: slice.docs.filter((_, i) => i !== index) });
  }

  // -------------------------------------------------------------------------
  // Pergunta à IA
  // -------------------------------------------------------------------------
  async function handleAsk() {
    if (!question.trim()) return;
    if (slice.docs.length === 0) return;

    const fullText = slice.docs.map((d) => `=== ${d.name} ===\n${d.text}`).join("\n\n");

    let contentText = fullText;
    let wasTruncated = false;
    if (fullText.length > MAX_CHARS) {
      contentText = fullText.slice(0, MAX_CHARS);
      wasTruncated = true;
    }
    setTruncated(wasTruncated);

    const answer = await complete({
      task: "audit_pdf",
      messages: [
        {
          role: "system",
          content:
            "Você é um auditor clínico especializado em saúde mental. Responda com base APENAS no conteúdo dos documentos fornecidos; se a informação não estiver presente nos documentos, diga isso claramente.",
        },
        {
          role: "user",
          content:
            (wasTruncated
              ? `[AVISO: O conteúdo foi truncado em ${MAX_CHARS} caracteres por limite de segurança. Algumas partes dos documentos podem não ter sido enviadas.]\n\n`
              : "") +
            contentText +
            "\n\nPergunta: " +
            question.trim(),
        },
      ],
    });

    if (answer != null) {
      patch({
        qa: [{ question: question.trim(), answer }, ...slice.qa],
      });
      setQuestion("");
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <StepShell
      title="Auditoria de PDFs (IA)"
      description="Carregue documentos externos e faça perguntas técnicas; a IA responde com base no conteúdo."
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. Upload de documentos                                             */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                <FolderOpen className="h-4 w-4" />
              </span>
              Documentos
            </span>
          }
          subtitle="Relatórios, encaminhamentos, exames e laudos multiprofissionais."
          actions={
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <Button
                variant="secondary"
                size="sm"
                icon={uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {uploading ? "Processando…" : "Adicionar PDFs"}
              </Button>
            </label>
          }
        />

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />

        <div className="p-5">
          {uploadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {uploadError}
            </div>
          )}

          {slice.docs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Nenhum documento carregado"
              description="Clique em 'Adicionar PDFs' para carregar relatórios, encaminhamentos ou exames em formato PDF."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Selecionar arquivos
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {slice.docs.map((doc, i) => (
                <li
                  key={i}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
                >
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {doc.name}
                        </p>
                        <div className="mt-1">
                          <Badge color="slate">{doc.text.length.toLocaleString("pt-BR")} caracteres</Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label="Remover documento"
                      onClick={() => removeDoc(i)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                    </Button>
                  </div>

                  {/* Texto extraído em details recolhível */}
                  <details className="group border-t border-slate-200 dark:border-slate-700">
                    <summary className="flex cursor-pointer select-none items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                      Ver texto extraído
                    </summary>
                    <div className="max-h-48 overflow-y-auto px-4 pb-3">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {doc.text || "(Nenhum texto extraído)"}
                      </pre>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Perguntar à IA                                                   */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4 ring-1 ring-inset ring-violet-100 dark:ring-violet-900/30">
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-900/40">
                <Sparkles className="h-4 w-4" />
              </span>
              Perguntar à IA
            </span>
          }
          subtitle="A IA responde com base exclusivamente nos documentos carregados acima."
        />
        <div className="p-5">
          {slice.docs.length === 0 && (
            <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">
              Carregue ao menos um documento antes de fazer perguntas.
            </p>
          )}

          {truncated && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
              Aviso: o conteúdo enviado foi truncado em {MAX_CHARS.toLocaleString("pt-BR")} caracteres. Documentos muito extensos podem ter partes omitidas.
            </div>
          )}

          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Ex.: Quais medicamentos estão listados no relatório do psiquiatra? Existe menção a histórico de internações?"
            disabled={aiLoading || slice.docs.length === 0}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                void handleAsk();
              }
            }}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ctrl+Enter para enviar.</p>

          <div className="mt-3">
            <Button
              variant="ai"
              size="md"
              type="button"
              loading={aiLoading}
              disabled={!question.trim() || slice.docs.length === 0}
              onClick={() => void handleAsk()}
            >
              Perguntar à IA
            </Button>
          </div>

          <AiDisclaimer />
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Histórico de perguntas e respostas                               */}
      {/* ------------------------------------------------------------------ */}
      {slice.qa.length > 0 && (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                  <History className="h-4 w-4" />
                </span>
                Histórico de consultas
              </span>
            }
            subtitle={`${slice.qa.length} pergunta${slice.qa.length !== 1 ? "s" : ""} realizada${slice.qa.length !== 1 ? "s" : ""}.`}
          />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {slice.qa.map((entry, i) => (
              <div key={i} className="p-5">
                {/* Pergunta */}
                <div className="mb-3 flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {entry.question}
                  </p>
                </div>

                {/* Resposta */}
                <div className="ml-8 flex items-start gap-2.5">
                  <CornerDownRight className="mt-2.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                  <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                      {entry.answer}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </StepShell>
  );
}
