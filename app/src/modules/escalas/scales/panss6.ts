import { LIKERT_1_7, type ScaleDef } from "../types";

export const panss6: ScaleDef = {
  id: "panss6",
  acronym: "PANSS-6",
  name: "PANSS Versão Breve (6 itens)",
  description:
    "Versão abreviada da PANSS com 6 itens selecionados: P1 (delírios), P2 (desorganização conceitual), " +
    "P3 (comportamento alucinatório) da subescala positiva; e N1 (embotamento afetivo), " +
    "N4 (retraimento social/passividade), N6 (falta de espontaneidade) da subescala negativa. " +
    "Útil para triagem rápida e monitoramento.",
  category: "Psicose",
  reference: "Østergaard et al. (2016)",
  defaultOptions: LIKERT_1_7,
  items: [
    { id: "P1", text: "P1 — Delírios" },
    { id: "P2", text: "P2 — Desorganização conceitual" },
    { id: "P3", text: "P3 — Comportamento alucinatório" },
    { id: "N1", text: "N1 — Embotamento afetivo" },
    { id: "N4", text: "N4 — Retraimento social/passividade" },
    { id: "N6", text: "N6 — Falta de espontaneidade e fluência na conversa" },
  ],
  bands: [
    { min: 6,  max: 11, label: "Mínimo/ausente",   severity: "normal"      },
    { min: 12, max: 17, label: "Leve",              severity: "leve"        },
    { min: 18, max: 24, label: "Moderado",          severity: "moderado"    },
    { min: 25, max: 31, label: "Grave",             severity: "grave"       },
    { min: 32, max: 42, label: "Muito grave",       severity: "muito_grave" },
  ],
};

export default panss6;
