import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { audit } from "../db.ts";
import {
  chatComplete,
  transcribe,
  AiNotConfiguredError,
  type ChatMessage,
} from "../openai.ts";

export const aiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

// Tarefas clínicas que se beneficiam das diretrizes do MOSP.
const MOSP_TASKS = new Set([
  "suggest_diagnosis",
  "suggest_differentials",
  "suggest_pts",
  "chat",
  "insights",
]);

// Disclaimers específicos por tarefa.
const DISCLAIMERS: Record<string, string> = {
  suggest_diagnosis:
    "Sugestões diagnósticas geradas por IA são apenas apoio. A conclusão diagnóstica é do profissional.",
  suggest_differentials:
    "Diferenciais sugeridos por IA podem estar incompletos ou incorretos. Revise criticamente.",
  suggest_pts:
    "Propostas terapêuticas geradas por IA exigem validação clínica, checagem de interações e adequação ao caso.",
  chat: "Conteúdo gerado por IA pode conter erros. Verifique informações críticas — a decisão é do profissional.",
};

const completeSchema = z.object({
  task: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ),
  context: z.record(z.string(), z.unknown()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  jsonMode: z.boolean().optional(),
});

aiRouter.post("/ai/complete", async (req, res, next) => {
  try {
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Payload de IA inválido." });
    const { task, messages, context, temperature, jsonMode } = parsed.data;

    const finalMessages: ChatMessage[] = [...messages];
    if (context && Object.keys(context).length > 0) {
      finalMessages.push({
        role: "user",
        content:
          "Contexto clínico estruturado (JSON):\n" +
          JSON.stringify(context, null, 2),
      });
    }

    const result = await chatComplete({
      messages: finalMessages,
      temperature,
      injectMosp: MOSP_TASKS.has(task),
      jsonMode,
      injectRole: true,
    });

    // LGPD: registra a transferência de conteúdo clínico à OpenAI (EUA) —
    // metadados apenas (tarefa, modelo, ator), nunca o conteúdo enviado.
    await audit("READ", "ai", null, `tarefa=${task}; modelo=${result.model}`, req.user?.email);

    res.json({
      text: result.text,
      model: result.model,
      disclaimer: DISCLAIMERS[task],
    });
  } catch (err) {
    if (err instanceof AiNotConfiguredError)
      return res.status(503).json({ error: err.message });
    next(err);
  }
});

aiRouter.post("/ai/transcribe", upload.single("audio"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Áudio ausente." });
    const result = await transcribe(req.file.buffer, req.file.originalname);
    await audit("READ", "ai", null, `transcrição; modelo=${result.model}`, req.user?.email);
    res.json({ text: result.text, model: result.model });
  } catch (err) {
    if (err instanceof AiNotConfiguredError)
      return res.status(503).json({ error: err.message });
    next(err);
  }
});
