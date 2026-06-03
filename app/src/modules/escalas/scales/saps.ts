import { type ScaleDef } from "../types";

const opt05 = [
  { label: "0 — Ausente",      value: 0 },
  { label: "1 — Questionável", value: 1 },
  { label: "2 — Leve",         value: 2 },
  { label: "3 — Moderado",     value: 3 },
  { label: "4 — Grave",        value: 4 },
  { label: "5 — Muito grave",  value: 5 },
];

export const saps: ScaleDef = {
  id: "saps",
  acronym: "SAPS",
  name: "Scale for the Assessment of Positive Symptoms",
  description:
    "Avalia sintomas positivos em esquizofrenia em quatro domínios: alucinações, delírios, " +
    "comportamento bizarro e distúrbio formal do pensamento. Cada item pontuado de 0 a 5. " +
    "Inclui avaliação global por domínio.",
  category: "Psicose",
  reference: "Andreasen (1984)",
  defaultOptions: opt05,
  items: [
    // Alucinações (A)
    { id: "A1", text: "A1 — Vozes que comentam o comportamento do paciente" },
    { id: "A2", text: "A2 — Vozes que conversam entre si" },
    { id: "A3", text: "A3 — Alucinações somáticas ou táteis" },
    { id: "A4", text: "A4 — Alucinações olfativas" },
    { id: "A5", text: "A5 — Alucinações visuais" },
    { id: "A_G", text: "A-G — Avaliação global: alucinações" },
    // Delírios (D)
    { id: "D1",  text: "D1 — Delírios persecutórios" },
    { id: "D2",  text: "D2 — Delírios de ciúme" },
    { id: "D3",  text: "D3 — Delírios de culpa ou pecado" },
    { id: "D4",  text: "D4 — Delírios de grandiosidade" },
    { id: "D5",  text: "D5 — Delírios religiosos" },
    { id: "D6",  text: "D6 — Delírios somáticos" },
    { id: "D7",  text: "D7 — Delírios de referência" },
    { id: "D8",  text: "D8 — Delírios de controle (passividade)" },
    { id: "D9",  text: "D9 — Leitura, transmissão ou inserção de pensamento" },
    { id: "D_G", text: "D-G — Avaliação global: delírios" },
    // Comportamento Bizarro (CB)
    { id: "CB1", text: "CB1 — Vestuário e aparência bizarros" },
    { id: "CB2", text: "CB2 — Comportamento social e sexual inadequado" },
    { id: "CB3", text: "CB3 — Comportamento agressivo e agitado" },
    { id: "CB4", text: "CB4 — Comportamento repetitivo ou estereotipado" },
    { id: "CB_G", text: "CB-G — Avaliação global: comportamento bizarro" },
    // Distúrbio Formal do Pensamento (DFP)
    { id: "DFP1", text: "DFP1 — Associações frouxas (descarrilamento)" },
    { id: "DFP2", text: "DFP2 — Tangencialidade" },
    { id: "DFP3", text: "DFP3 — Incoerência" },
    { id: "DFP4", text: "DFP4 — Ilógica" },
    { id: "DFP5", text: "DFP5 — Circunstancialidade" },
    { id: "DFP6", text: "DFP6 — Pressão do pensamento" },
    { id: "DFP7", text: "DFP7 — Distraibilidade" },
    { id: "DFP8", text: "DFP8 — Associações por assonância (clang associations)" },
    { id: "DFP_G", text: "DFP-G — Avaliação global: distúrbio formal do pensamento" },
  ],
  bands: [
    { min: 0,  max: 15,  label: "Mínimo/ausente", severity: "normal"      },
    { min: 16, max: 40,  label: "Leve",            severity: "leve"        },
    { min: 41, max: 80,  label: "Moderado",        severity: "moderado"    },
    { min: 81, max: 130, label: "Grave",           severity: "grave"       },
    { min: 131,max: 150, label: "Muito grave",     severity: "muito_grave" },
  ],
  note:
    "Escala heteroaplicada, preenchida pelo clínico após entrevista e observação. " +
    "As avaliações globais por domínio são os principais indicadores clínicos; " +
    "a soma total serve primariamente para fins de pesquisa.",
};

export default saps;
