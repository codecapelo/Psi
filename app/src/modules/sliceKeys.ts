// ==========================================================================
// Chaves de fatia do JSON do exame (Exam.data).
// Cada módulo é dono de UMA chave. Use sempre estas constantes com
// useExamSlice(...) para evitar colisão entre módulos.
// ==========================================================================

export const SLICE = {
  anamnese: "anamnese",
  fenomenologia: "fenomenologia",
  /** Objeto: { [domainId]: { selected: string[]; notes: string } } */
  psicopatologia: "psicopatologia",
  sumula: "sumula",
  /** Objeto: { [scaleId]: { answers: Record<string, number>; ... } } */
  escalas: "escalas",
  /** Escalas sugeridas pela IA a partir da transcrição/anotações: { ids, reasons } */
  escalasSugeridas: "escalasSugeridas",
  diagnostico: "diagnostico",
  pts: "pts",
  laudos: "laudos",
  auditoriaPdf: "auditoriaPdf",
  assistente: "assistente",
} as const;

export type SliceKey = (typeof SLICE)[keyof typeof SLICE];
