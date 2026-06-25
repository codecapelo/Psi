// ==========================================================================
// Serviço de IA — OpenAI.
// Boot gracioso: sem OPENAI_API_KEY, hasAi()=false e as chamadas lançam
// AiNotConfiguredError (tratada como 503 com mensagem clara nas rotas).
// ==========================================================================

import OpenAI, { toFile } from "openai";
import { pool } from "./db.ts";

const apiKey = process.env.OPENAI_API_KEY;
export const TEXT_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
export const TRANSCRIBE_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";

const client = apiKey ? new OpenAI({ apiKey }) : null;

export function hasAi(): boolean {
  return client !== null;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "IA não configurada. Defina OPENAI_API_KEY nas variáveis de ambiente.",
    );
    this.name = "AiNotConfiguredError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Busca memórias do MOSP cujos gatilhos aparecem no texto e monta um bloco
 * de diretrizes clínicas para injetar no prompt do sistema.
 */
export async function buildMospContext(text: string): Promise<string> {
  if (!pool) return "";
  try {
    const lower = text.toLowerCase();
    const { rows } = await pool.query<{
      title: string;
      content_md: string;
      triggers: string[];
    }>(`SELECT title, content_md, triggers FROM mosp_memories ORDER BY "order" ASC`);
    const matched = rows.filter((m) =>
      (m.triggers || []).some((t) => t && lower.includes(t.toLowerCase())),
    );
    if (matched.length === 0) return "";
    return (
      "DIRETRIZES CLÍNICAS (MOSP) aplicáveis a este caso:\n\n" +
      matched
        .map((m) => `## ${m.title}\n${m.content_md}`)
        .join("\n\n---\n\n")
    );
  } catch {
    return "";
  }
}

/** Completação de chat. Injeta MOSP quando `injectMosp` é true. */
export async function chatComplete(opts: {
  messages: ChatMessage[];
  temperature?: number;
  injectMosp?: boolean;
  /** Força a resposta a ser um objeto JSON (response_format json_object). */
  jsonMode?: boolean;
}): Promise<{ text: string; model: string }> {
  if (!client) throw new AiNotConfiguredError();

  const messages = [...opts.messages];
  if (opts.injectMosp) {
    const userText = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");
    const mosp = await buildMospContext(userText);
    if (mosp) {
      messages.unshift({ role: "system", content: mosp });
    }
  }

  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.3,
    ...(opts.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  });

  return {
    text: res.choices[0]?.message?.content ?? "",
    model: TEXT_MODEL,
  };
}

/** Transcrição de áudio (Whisper / gpt-4o-transcribe). */
export async function transcribe(
  buffer: Buffer,
  filename = "audio.webm",
): Promise<{ text: string; model: string }> {
  if (!client) throw new AiNotConfiguredError();
  const file = await toFile(buffer, filename);
  const res = await client.audio.transcriptions.create({
    file,
    model: TRANSCRIBE_MODEL,
  });
  return { text: res.text, model: TRANSCRIBE_MODEL };
}
