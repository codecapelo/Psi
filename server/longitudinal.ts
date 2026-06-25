// ==========================================================================
// Camada longitudinal — helpers PUROS (sem I/O), testáveis isoladamente.
//   - stableStringify / computeExamHash: assinatura imutável de um atendimento.
//   - buildEvolucaoSeed: semeia a evolução (SOAP + mini-EEM) com carry-forward
//     da evolução anterior ou, na 1ª, a partir da admissão.
// ==========================================================================

import { createHash } from "node:crypto";

export const ENCOUNTER_TIPOS = ["admissao", "evolucao", "alta", "consulta"] as const;
export type EncounterTipo = (typeof ENCOUNTER_TIPOS)[number];

export const EPISODE_TIPOS = ["internacao", "ambulatorial", "consulta"] as const;
export type EpisodeTipo = (typeof EPISODE_TIPOS)[number];

/** JSON determinístico: chaves de objeto ordenadas recursivamente. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export interface HashInput {
  id: string;
  patientId: string;
  tipo: string;
  seq?: number | null;
  data: unknown;
  lockedAt: string;
}

/** SHA-256 (hex) do conteúdo canônico do atendimento — prova de integridade. */
export function computeExamHash(input: HashInput): string {
  const canonical = stableStringify({
    id: input.id,
    patientId: input.patientId,
    tipo: input.tipo,
    seq: input.seq ?? null,
    lockedAt: input.lockedAt,
    data: input.data,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

// --------------------------------------------------------------------------
// SOAP + mini-EEM
// --------------------------------------------------------------------------

/** Achados do exame do estado mental por domínio (labels selecionados). */
export type EemMap = Record<string, string[]>;

export interface SoapSnapshot {
  s: string;
  o: string;
  a: string;
  p: string;
  eem: EemMap;
  /** De onde veio esta linha de base (admissao|evolucao|consulta). */
  sourceTipo: string;
  /** Data do atendimento-fonte (ISO), quando disponível. */
  sourceDate: string;
}

export interface EvolucaoData extends Omit<SoapSnapshot, "sourceTipo" | "sourceDate"> {
  /** Linha de base imutável (a evolução anterior ou a admissão). */
  prev: SoapSnapshot | null;
}

const EMPTY_PREV: SoapSnapshot = {
  s: "",
  o: "",
  a: "",
  p: "",
  eem: {},
  sourceTipo: "",
  sourceDate: "",
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Extrai o EEM (achados por domínio) da fatia de psicopatologia da admissão. */
function eemFromPsicopatologia(data: Record<string, unknown> | undefined): EemMap {
  const psico = (data?.psicopatologia ?? {}) as Record<string, unknown>;
  const eem: EemMap = {};
  for (const [domainId, raw] of Object.entries(psico)) {
    const sel = (raw as { selected?: unknown })?.selected;
    if (Array.isArray(sel) && sel.length > 0) {
      eem[domainId] = sel.filter((x): x is string => typeof x === "string");
    }
  }
  return eem;
}

/**
 * Monta os dados iniciais de uma evolução.
 *
 * - source = última evolução do episódio → copia o SOAP+EEM dela (carry-forward).
 * - source = admissão/consulta → semeia: EEM ← psicopatologia; A ← diagnóstico;
 *   P ← orientações do PTS; S/O começam vazios.
 * - source = null (1ª evolução sem âncora) → tudo vazio.
 *
 * A evolução do dia NASCE igual à linha de base (`prev`); o médico edita a
 * partir dela e o diff (atual × prev) revela o que melhorou/piorou.
 */
export function buildEvolucaoSeed(
  source: { tipo: string; data: Record<string, unknown> | undefined; date?: string } | null,
): EvolucaoData {
  let prev: SoapSnapshot = { ...EMPTY_PREV };

  if (source) {
    const date = source.date ?? "";
    if (source.tipo === "evolucao") {
      const e = (source.data?.evolucao ?? {}) as Partial<SoapSnapshot>;
      prev = {
        s: str(e.s),
        o: str(e.o),
        a: str(e.a),
        p: str(e.p),
        eem: (e.eem as EemMap) ?? {},
        sourceTipo: "evolucao",
        sourceDate: date,
      };
    } else {
      // admissao | consulta — semeia a partir das fatias clínicas.
      const diag = (source.data?.diagnostico ?? {}) as Record<string, unknown>;
      const pts = (source.data?.pts ?? {}) as Record<string, unknown>;
      const a = [str(diag.sindromico), str(diag.nosologico)].filter(Boolean).join(" — ");
      prev = {
        s: "",
        o: "",
        a,
        p: str(pts.orientacoes),
        eem: eemFromPsicopatologia(source.data),
        sourceTipo: source.tipo,
        sourceDate: date,
      };
    }
  }

  // Carry-forward: a evolução do dia começa idêntica à linha de base.
  return {
    s: prev.s,
    o: prev.o,
    a: prev.a,
    p: prev.p,
    eem: JSON.parse(JSON.stringify(prev.eem)) as EemMap,
    prev: source ? prev : null,
  };
}
