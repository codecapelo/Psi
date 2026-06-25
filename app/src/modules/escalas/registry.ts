// ==========================================================================
// Registro de escalas psicométricas.
// Para adicionar uma escala: crie scales/<id>.ts exportando um ScaleDef e
// importe-a aqui. (Este arquivo é mantido pelo módulo de Escalas.)
// ==========================================================================

import type { ScaleDef } from "./types";
import phq9 from "./scales/phq9";
import gad7 from "./scales/gad7";
import panss from "./scales/panss";
import bprs from "./scales/bprs";
import hamd17 from "./scales/hamd17";
import bars from "./scales/bars";
import panss6 from "./scales/panss6";
import sans from "./scales/sans";
import saps from "./scales/saps";
import asrm from "./scales/asrm";
import panssec from "./scales/panssec";
import ybocs from "./scales/ybocs";
import gds15 from "./scales/gds15";
import madrs from "./scales/madrs";
import ymrs from "./scales/ymrs";
import bdrs from "./scales/bdrs";
import bacs from "./scales/bacs";
import cssrs from "./scales/cssrs";
import mmse from "./scales/mmse";
import moca from "./scales/moca";
import npi from "./scales/npi";
import audit from "./scales/audit";
import cage from "./scales/cage";
import fagerstrom from "./scales/fagerstrom";
import ciwaar from "./scales/ciwaar";
import cows from "./scales/cows";

export const SCALES: ScaleDef[] = [
  phq9,
  gad7,
  panss,
  bprs,
  hamd17,
  bars,
  panss6,
  sans,
  saps,
  asrm,
  panssec,
  ybocs,
  gds15,
  madrs,
  ymrs,
  bdrs,
  bacs,
  cssrs,
  mmse,
  moca,
  npi,
  audit,
  cage,
  fagerstrom,
  ciwaar,
  cows,
];

export function getScale(id: string): ScaleDef | undefined {
  return SCALES.find((s) => s.id === id);
}
