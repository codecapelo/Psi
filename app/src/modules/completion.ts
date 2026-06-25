// ==========================================================================
// Define quando uma etapa do wizard está "completa" (preenchida).
//
// Usado pelo rail lateral para decidir o ícone de status:
//   completa        → check verde
//   passou + vazia  → X vermelho (ainda falta preencher)
//   futura + vazia  → número neutro
//
// Regra geral: a fatia de dados da etapa tem conteúdo significativo
// (qualquer string não vazia, array não vazio, número ou booleano true).
// As etapas 3–18 vivem em data.psicopatologia[domainId]; "auditoria-pdf"
// usa a chave de fatia "auditoriaPdf"; as demais batem com o id da etapa.
// ==========================================================================

import type { ExamData } from "@/lib/types";
import { DOMAINS } from "./psicopatologia/domains";

const DOMAIN_IDS = new Set(DOMAINS.map((d) => d.id));

/** id da etapa → chave da fatia em Exam.data (quando diferem). */
const SLICE_KEY_OVERRIDE: Record<string, string> = {
  "auditoria-pdf": "auditoriaPdf",
};

/** Verdadeiro se o valor (recursivamente) contém algum conteúdo preenchido. */
function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.some(hasContent);
  if (typeof value === "object") return Object.values(value).some(hasContent);
  return false;
}

/** Indica se a etapa `stepId` foi preenchida o suficiente para contar como completa. */
export function isStepComplete(stepId: string, data: ExamData): boolean {
  if (DOMAIN_IDS.has(stepId)) {
    const psico = data.psicopatologia as Record<string, unknown> | undefined;
    return hasContent(psico?.[stepId]);
  }
  const sliceKey = SLICE_KEY_OVERRIDE[stepId] ?? stepId;
  return hasContent(data[sliceKey]);
}
