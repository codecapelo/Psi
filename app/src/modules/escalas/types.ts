// ==========================================================================
// Modelo data-driven de escalas psicométricas.
// Um runner genérico (ScaleRunner) aplica/pontua qualquer escala definida
// neste formato. Para adicionar uma escala, crie um arquivo em scales/ que
// exporte um ScaleDef e registre-o em registry.ts.
// ==========================================================================

export interface ScaleOption {
  label: string;
  value: number;
}

export interface ScaleItem {
  id: string;
  text: string;
  /** Opções específicas do item; se ausente, usa defaultOptions da escala. */
  options?: ScaleOption[];
}

export type Severity = "normal" | "leve" | "moderado" | "grave" | "muito_grave";

export interface ScaleBand {
  min: number;
  max: number;
  label: string;
  severity?: Severity;
}

export interface ScaleDef {
  id: string;
  acronym: string;
  name: string;
  description: string;
  category:
    | "Depressão"
    | "Ansiedade"
    | "Mania/Bipolar"
    | "Psicose"
    | "Cognição"
    | "TOC"
    | "Risco"
    | "Geriatria"
    | "Geral";
  reference?: string;
  /** Opções padrão aplicadas a itens sem opções próprias. */
  defaultOptions?: ScaleOption[];
  items: ScaleItem[];
  /** Faixas de interpretação sobre o escore total. */
  bands: ScaleBand[];
  /** Função de pontuação custom; default = soma simples das respostas. */
  score?: (answers: Record<string, number>) => number;
  /** Observação clínica/segurança exibida ao aplicar a escala. */
  note?: string;
}

export interface ScaleResult {
  answers: Record<string, number>;
  score: number;
  band?: ScaleBand;
  completedAt?: string;
}

/** Soma simples das respostas (pontuação padrão). */
export function sumScore(answers: Record<string, number>): number {
  return Object.values(answers).reduce((a, b) => a + (Number(b) || 0), 0);
}

/** Encontra a faixa de interpretação correspondente ao escore. */
export function bandFor(def: ScaleDef, score: number): ScaleBand | undefined {
  return def.bands.find((b) => score >= b.min && score <= b.max);
}

export const SEVERITY_COLOR: Record<Severity, "green" | "amber" | "red" | "slate"> = {
  normal: "green",
  leve: "amber",
  moderado: "amber",
  grave: "red",
  muito_grave: "red",
};

/** Opções Likert reutilizáveis. */
export const LIKERT_0_4_FREQ: ScaleOption[] = [
  { label: "Nenhuma vez (0)", value: 0 },
  { label: "Vários dias (1)", value: 1 },
  { label: "Mais da metade dos dias (2)", value: 2 },
  { label: "Quase todos os dias (3)", value: 3 },
];

export const LIKERT_1_7: ScaleOption[] = [
  { label: "1 — Ausente", value: 1 },
  { label: "2 — Mínimo", value: 2 },
  { label: "3 — Leve", value: 3 },
  { label: "4 — Moderado", value: 4 },
  { label: "5 — Moderado-grave", value: 5 },
  { label: "6 — Grave", value: 6 },
  { label: "7 — Extremo", value: 7 },
];
