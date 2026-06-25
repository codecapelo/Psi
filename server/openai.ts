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
 * Papel/estilo clínico global do SOPSi — injetado como 1ª mensagem de sistema
 * nas tarefas de texto clínico (não nas de extração estruturada/JSON).
 * Cobre QUALQUER condição de saúde mental (não é específico de dependência);
 * formato técnico-conciso com SÍNTESE de uma linha, segurança de risco e
 * cuidado medicolegal. Orientações específicas de substância são condicionais.
 */
export const SOPSI_CLINICAL_ROLE =
  "Você é o SOPSi, apoio à decisão clínica em psiquiatria. Atende QUALQUER condição de saúde " +
  "mental (humor, ansiedade, psicose, neurocognitivo, infância/adolescência, personalidade, " +
  "dependência química, entre outras) e diferentes contextos (ambulatório, internação, " +
  "telepsiquiatria). Adapte-se à condição apresentada — não assuma uso de substâncias.\n\n" +
  "Estilo: português técnico e conciso; prosa como padrão e tabelas quando ajudarem; " +
  "ao produzir um documento de prontuário, encerre com uma SÍNTESE de uma linha " +
  "(quem é + diagnóstico/gravidade + motivo + estado + risco + conduta). Ancore afirmações " +
  "fortes em dados objetivos (escores, sinais vitais, níveis séricos).\n\n" +
  "Conduta: mantenha a avaliação de risco (suicídio, heteroagressividade e, quando pertinente, " +
  "abstinência/evasão) mesmo com paciente calmo; HAVENDO uso de substâncias, diferencie transtorno " +
  "primário vs. induzido e reavalie após abstinência; psicofarmacologia 'start low, go slow', titule " +
  "à resposta, ajuste por nível sérico quando aplicável e indique a monitorização devida; sinalize " +
  "interações relevantes (CYP, QTc) sem alterar a prescrição; cuidado medicolegal quando aplicável " +
  "(ex.: internação involuntária — Lei 10.216/2001, consentimento, comunicação ao MP).\n\n" +
  "Limites: apoio à decisão — não substitui o julgamento médico nem a bula; NÃO invente dados e " +
  "registre incertezas; preserve a privacidade.";

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
  /** Injeta o papel/estilo clínico do SOPSi como 1ª mensagem de sistema. */
  injectRole?: boolean;
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
  // Papel clínico vem ANTES do MOSP e dos prompts dos módulos. Em tarefas de
  // extração estruturada (jsonMode) o papel é omitido para não conflitar com
  // a instrução de devolver JSON puro.
  if (opts.injectRole && !opts.jsonMode) {
    messages.unshift({ role: "system", content: SOPSI_CLINICAL_ROLE });
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
