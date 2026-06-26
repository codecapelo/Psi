import { useRef, useState, useCallback, useEffect } from "react";
import { Sparkles, Paperclip, Send, Bot, User, MessageSquare } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Button, Textarea, Spinner, Badge, Card } from "@/components/ui";
import { useAi, AiDisclaimer } from "@/components/ai";
import { useExamSlice, useExam } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";
import { extractPdfText } from "@/lib/pdf";

// --------------------------------------------------------------------------
// Modelo de dados do Assistente (fatia data.assistente)
// --------------------------------------------------------------------------
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  label?: string; // ex.: "Insight", "Documento"
}

interface AssistenteSlice {
  messages: ChatMessage[];
}

const DEFAULTS: AssistenteSlice = {
  messages: [],
};

// --------------------------------------------------------------------------
// Componente de bolha de mensagem
// --------------------------------------------------------------------------
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex w-full gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
            : "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Bolha */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-brand-600 text-white dark:bg-brand-700"
            : "rounded-tl-sm border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        }`}
      >
        {msg.label && (
          <div className="mb-1.5">
            <Badge color={msg.label === "Insight" ? "brand" : "slate"}>
              {msg.label}
            </Badge>
          </div>
        )}
        <span className="whitespace-pre-wrap">{msg.content}</span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Módulo principal
// --------------------------------------------------------------------------
export default function AssistenteStep() {
  const [slice, patch] = useExamSlice<AssistenteSlice>(SLICE.assistente, DEFAULTS);
  const { data } = useExam();
  const { complete, loading } = useAi();

  const [inputText, setInputText] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rola para o fim sempre que as mensagens mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [slice.messages]);

  // Adiciona uma mensagem ao histórico
  const addMessages = useCallback(
    (newMessages: ChatMessage[]) => {
      patch({ messages: [...slice.messages, ...newMessages] });
    },
    [slice.messages, patch],
  );

  // Envia a mensagem do usuário e aguarda resposta da IA
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    setInputText("");

    const userMsg: ChatMessage = { role: "user", content: text };
    const historyWithUser = [...slice.messages, userMsg];
    patch({ messages: historyWithUser });

    const response = await complete({
      task: "chat",
      context: data,
      messages: [
        {
          role: "system",
          content:
            "Você é o SOPSi Assistant, um auditor clínico em psiquiatria. Discuta casos, valide hipóteses e forneça referências quando solicitado. Seja criterioso; aponte incertezas.",
        },
        ...historyWithUser.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    if (response != null) {
      patch({
        messages: [
          ...historyWithUser,
          { role: "assistant", content: response },
        ],
      });
    }
  }, [inputText, loading, slice.messages, patch, complete, data]);

  // Enter envia; Shift+Enter quebra linha
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  // Botão "Insights"
  const handleInsights = useCallback(async () => {
    if (loading) return;

    const response = await complete({
      task: "insights",
      context: data,
      messages: [
        {
          role: "system",
          content:
            "Gere insights clínicos contextuais e pontos de atenção a partir dos achados do exame atual.",
        },
        {
          role: "user",
          content: "Gere insights sobre este caso.",
        },
      ],
    });

    if (response != null) {
      addMessages([{ role: "assistant", content: response, label: "Insight" }]);
    }
  }, [loading, complete, data, addMessages]);

  // Botão "Anexar PDF"
  const handlePdfChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input para permitir re-seleção do mesmo arquivo
      e.target.value = "";

      setPdfLoading(true);
      try {
        const rawText = await extractPdfText(file);
        const truncated = rawText.slice(0, 8000);
        const pdfMsg: ChatMessage = {
          role: "user",
          content: `Documento anexado (${file.name}):\n${truncated}`,
          label: "Documento",
        };
        addMessages([pdfMsg]);
      } catch {
        // Falha silenciosa — poderia usar toast mas não temos acesso aqui sem hook extra
      } finally {
        setPdfLoading(false);
      }
    },
    [addMessages],
  );

  // Limpar histórico
  const handleClear = useCallback(() => {
    patch({ messages: [] });
  }, [patch]);

  const hasMessages = slice.messages.length > 0;

  return (
    <StepShell
      title="Psi Assistente (IA)"
      description="Auditor clínico: discuta casos, valide hipóteses e peça referências."
    >
      {/* Disclaimer fixo no topo */}
      <AiDisclaimer />

      {/* Área de chat */}
      <Card className="mt-4 flex h-[520px] flex-col overflow-hidden ring-1 ring-inset ring-violet-100 dark:ring-violet-900/30">
        {/* Cabeçalho com ações rápidas */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-violet-50/40 px-4 py-3 dark:border-slate-800 dark:bg-violet-900/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 ring-1 ring-inset ring-violet-200/70 dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-900/50">
              <Bot className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              SOPSi Assistant
            </span>
            <Badge color="brand">IA Clínica</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão Insights */}
            <Button
              type="button"
              variant="ai"
              size="sm"
              loading={loading}
              icon={<Sparkles className="h-4 w-4" />}
              onClick={() => void handleInsights()}
              title="Gerar insights clínicos contextuais com base nos dados do exame"
            >
              Insights
            </Button>

            {/* Botão Anexar PDF */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={pdfLoading}
              icon={<Paperclip className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
              title="Anexar documento PDF ao histórico de conversa"
            >
              Anexar PDF
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => void handlePdfChange(e)}
            />

            {/* Limpar histórico */}
            {hasMessages && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                title="Limpar histórico de conversa"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center animate-fade-in">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-500 ring-1 ring-inset ring-violet-200/70 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-900/40">
                <MessageSquare className="h-7 w-7" />
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Comece uma discussão clínica
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  Faça perguntas sobre o caso, valide hipóteses diagnósticas ou
                  solicite referências bibliográficas. Use "Insights" para
                  análise contextual automática.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {slice.messages.map((msg, idx) => (
                <MessageBubble key={idx} msg={msg} />
              ))}
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <Spinner className="h-4 w-4 text-violet-500" />
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                      Analisando…
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input de envio */}
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem… (Enter envia, Shift+Enter quebra linha)"
              rows={2}
              className="min-h-[64px] resize-none"
              disabled={loading}
            />
            <Button
              type="button"
              variant="primary"
              size="icon"
              loading={loading}
              onClick={() => void handleSend()}
              disabled={!inputText.trim() || loading}
              title="Enviar mensagem"
              className="mb-0.5 h-10 w-10 shrink-0"
            >
              {!loading && <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </Card>
    </StepShell>
  );
}
