// ==========================================================================
// Sugestão e pré-pontuação de escalas a partir da transcrição/anotações.
//
// Dois recursos, ambos best-effort e SEMPRE revisados pelo profissional:
//  1) buildSuggestRequest / parseSuggestions — destaca as escalas mais
//     pertinentes ao material clínico (sem pontuar).
//  2) buildPrefillRequest / parsePrefill — propõe a pontuação item-a-item de
//     UMA escala quando o material contém elementos que pontuam.
// ==========================================================================

import type { AiCompletionRequest } from "@/lib/types";
import { SCALES, getScale } from "./registry";
import type { ScaleDef } from "./types";

/** Fatia data.escalasSugeridas — ids destacados + motivo curto por escala. */
export interface SuggestedScales {
  ids: string[];
  reasons?: Record<string, string>;
  /** ISO da última sugestão (para invalidar quando o material muda). */
  at?: string;
}

/** Limita o material enviado à IA (transcrições podem ser longas). */
const MAX_MATERIAL = 12000;

/** Catálogo compacto das escalas disponíveis (id — sigla (categoria): descrição). */
const SCALE_CATALOG = SCALES.map(
  (s) => `- ${s.id} — ${s.acronym} (${s.category}): ${s.description}`,
).join("\n");

const SUGGEST_SYSTEM =
  "Você é psiquiatra. A partir do MATERIAL CLÍNICO (transcrição e/ou anotações), indique quais ESCALAS " +
  "psicométricas, dentre as disponíveis abaixo, seriam mais úteis aplicar neste caso — considerando os " +
  "sintomas e sinais efetivamente presentes no material. Não invente: só sugira uma escala quando houver " +
  "indício claro no texto. Selecione no máximo 6, da mais pertinente para a menos.\n\n" +
  'Responda SOMENTE com um objeto JSON: {"escalas":[{"id":"<id da lista>","motivo":"<frase curta citando o indício no material>"}]}. ' +
  "Use exatamente os id da lista. Se nada se aplicar, devolva a lista vazia.\n\n" +
  "ESCALAS DISPONÍVEIS:\n" +
  SCALE_CATALOG;

/** Monta a requisição de sugestão de escalas. */
export function buildSuggestRequest(material: string): AiCompletionRequest {
  return {
    task: "suggest_scales",
    jsonMode: true,
    messages: [
      { role: "system", content: SUGGEST_SYSTEM },
      { role: "user", content: `MATERIAL CLÍNICO:\n${material.slice(0, MAX_MATERIAL)}` },
    ],
  };
}

/** Interpreta a resposta da sugestão, validando os id contra o registro. */
export function parseSuggestions(text: string): {
  ids: string[];
  reasons: Record<string, string>;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ids: [], reasons: {} };
  }
  const list = Array.isArray((parsed as { escalas?: unknown })?.escalas)
    ? ((parsed as { escalas: unknown[] }).escalas as unknown[])
    : [];
  const ids: string[] = [];
  const reasons: Record<string, string> = {};
  for (const item of list) {
    const o = (item ?? {}) as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    if (!id || !getScale(id) || ids.includes(id)) continue;
    ids.push(id);
    const motivo = String(o.motivo ?? "").trim();
    if (motivo) reasons[id] = motivo;
  }
  return { ids: ids.slice(0, 8), reasons };
}

/** Opções (valor=rótulo) válidas de um item — usa as próprias ou as default. */
function itemOptions(def: ScaleDef, itemId: string) {
  const item = def.items.find((i) => i.id === itemId);
  return item?.options ?? def.defaultOptions ?? [];
}

/** Monta a requisição de pré-pontuação item-a-item de UMA escala. */
export function buildPrefillRequest(def: ScaleDef, material: string): AiCompletionRequest {
  const itens = def.items
    .map((it) => {
      const opts = it.options ?? def.defaultOptions ?? [];
      const valores = opts.map((o) => `${o.value}=${o.label}`).join("; ");
      return `- "${it.id}": ${it.text} | valores: ${valores}`;
    })
    .join("\n");

  const system =
    `Você é psiquiatra aplicando a escala ${def.acronym} (${def.name}) a partir de um material clínico. ` +
    "Para CADA item, atribua a pontuação SOMENTE quando houver indício claro e específico no material. " +
    "Se o item não for abordado ou a evidência for insuficiente, OMITA o item — não chute nem use 0 por padrão. " +
    "Escolha sempre um dos valores numéricos permitidos para aquele item.\n\n" +
    'Responda SOMENTE com um objeto JSON: {"respostas":{"<id do item>":<valor>},"observacao":"<o que baseou as escolhas>"}.\n\n' +
    "ITENS DA ESCALA:\n" +
    itens;

  return {
    task: "suggest_scales",
    jsonMode: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `MATERIAL CLÍNICO:\n${material.slice(0, MAX_MATERIAL)}` },
    ],
  };
}

/** Interpreta a pré-pontuação, mantendo só itens com valor permitido. */
export function parsePrefill(
  def: ScaleDef,
  text: string,
): { answers: Record<string, number>; observacao: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { answers: {}, observacao: "" };
  }
  const root = (parsed ?? {}) as Record<string, unknown>;
  const raw = (root.respostas ?? root.answers ?? {}) as Record<string, unknown>;
  const answers: Record<string, number> = {};
  for (const it of def.items) {
    if (!(it.id in raw)) continue;
    const allowed = itemOptions(def, it.id).map((o) => o.value);
    const v = Number(raw[it.id]);
    if (Number.isFinite(v) && allowed.includes(v)) answers[it.id] = v;
  }
  return { answers, observacao: String(root.observacao ?? "").trim() };
}
