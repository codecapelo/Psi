// ==========================================================================
// Registro de escalas psicométricas.
// Para adicionar uma escala: crie scales/<id>.ts exportando um ScaleDef e
// importe-a aqui. (Este arquivo é mantido pelo módulo de Escalas.)
// ==========================================================================

import type { ScaleDef } from "./types";
import phq9 from "./scales/phq9";
import gad7 from "./scales/gad7";

export const SCALES: ScaleDef[] = [phq9, gad7];

export function getScale(id: string): ScaleDef | undefined {
  return SCALES.find((s) => s.id === id);
}
