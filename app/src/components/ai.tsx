import { useCallback, useRef, useState } from "react";
import { Mic, Square, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import apiClient from "@/lib/api";
import type { AiCompletionRequest } from "@/lib/types";

/**
 * Botão de "Transcrição Inteligente": grava áudio do microfone e devolve o
 * texto transcrito (OpenAI Whisper via backend). Faz append ao texto atual.
 */
export function TranscribeButton({
  onTranscript,
  label = "Transcrição Inteligente",
  size = "sm",
}: {
  onTranscript: (text: string) => void;
  label?: string;
  size?: "sm" | "md";
}) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBusy(true);
        try {
          const res = await apiClient.ai.transcribe(blob);
          onTranscript(res.text);
          toast("Transcrição concluída.", "success");
        } catch (err) {
          toast(
            err instanceof Error ? err.message : "Falha na transcrição.",
            "error",
          );
        } finally {
          setBusy(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      toast("Não foi possível acessar o microfone.", "error");
    }
  }, [onTranscript, toast]);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return (
    <Button
      type="button"
      variant={recording ? "danger" : "ai"}
      size={size}
      loading={busy}
      icon={recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      onClick={recording ? stop : start}
    >
      {recording ? "Parar gravação" : label}
    </Button>
  );
}

/** Hook genérico para chamadas de completação de IA. */
export function useAi() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const complete = useCallback(
    async (req: AiCompletionRequest): Promise<string | null> => {
      setLoading(true);
      try {
        const res = await apiClient.ai.complete(req);
        return res.text;
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "Falha na IA.",
          "error",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return { complete, loading };
}

/** Botão genérico que dispara uma ação de IA e entrega o texto resultante. */
export function AiAssistButton({
  label,
  request,
  onResult,
  size = "sm",
  variant = "ai",
}: {
  label: string;
  request: () => AiCompletionRequest;
  onResult: (text: string) => void;
  size?: "sm" | "md";
  variant?: "ai" | "secondary" | "outline";
}) {
  const { complete, loading } = useAi();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      loading={loading}
      icon={<Sparkles className="h-4 w-4" />}
      onClick={async () => {
        const text = await complete(request());
        if (text != null) onResult(text);
      }}
    >
      {label}
    </Button>
  );
}

/** Aviso padrão de que a IA pode errar e a decisão é do profissional. */
export function AiDisclaimer({ text }: { text?: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {text ||
          "Conteúdo gerado por IA pode conter erros. Revise criticamente — a decisão clínica é sempre do profissional responsável."}
      </span>
    </div>
  );
}
