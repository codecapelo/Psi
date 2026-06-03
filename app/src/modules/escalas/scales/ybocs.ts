import { type ScaleDef } from "../types";

const opt04 = [
  { label: "0 — Nenhum",      value: 0 },
  { label: "1 — Leve",        value: 1 },
  { label: "2 — Moderado",    value: 2 },
  { label: "3 — Grave",       value: 3 },
  { label: "4 — Extremo",     value: 4 },
];

export const ybocs: ScaleDef = {
  id: "ybocs",
  acronym: "Y-BOCS",
  name: "Yale-Brown Obsessive Compulsive Scale (Gravidade)",
  description:
    "Avalia a gravidade de obsessões e compulsões em 10 itens (5 para obsessões e 5 para compulsões), " +
    "cada um pontuado de 0 a 4. Escore máximo: 40. Aplicada por clínico após identificação de sintomas-alvo.",
  category: "TOC",
  reference: "Goodman et al. (1989)",
  items: [
    // Obsessões
    {
      id: "O1",
      text: "O1 — Tempo ocupado por obsessões (horas por dia)",
      options: [
        { label: "0 — Nenhuma", value: 0 },
        { label: "1 — Leve: <1 hora/dia", value: 1 },
        { label: "2 — Moderado: 1-3 horas/dia", value: 2 },
        { label: "3 — Grave: >3-8 horas/dia", value: 3 },
        { label: "4 — Extremo: >8 horas/dia, quase constante", value: 4 },
      ],
    },
    {
      id: "O2",
      text: "O2 — Interferência das obsessões no funcionamento social/ocupacional",
      options: opt04,
    },
    {
      id: "O3",
      text: "O3 — Sofrimento causado pelas obsessões",
      options: opt04,
    },
    {
      id: "O4",
      text: "O4 — Resistência às obsessões (esforço para ignorá-las)",
      options: [
        { label: "0 — Sempre resiste", value: 0 },
        { label: "1 — Resiste na maioria das vezes", value: 1 },
        { label: "2 — Faz algum esforço para resistir", value: 2 },
        { label: "3 — Cede à maioria das obsessões", value: 3 },
        { label: "4 — Cede completamente; controle totalmente ausente", value: 4 },
      ],
    },
    {
      id: "O5",
      text: "O5 — Controle sobre as obsessões (capacidade de afastá-las)",
      options: [
        { label: "0 — Controle total", value: 0 },
        { label: "1 — Bom controle, consegue afastar com esforço", value: 1 },
        { label: "2 — Controle moderado", value: 2 },
        { label: "3 — Pouco controle", value: 3 },
        { label: "4 — Nenhum controle", value: 4 },
      ],
    },
    // Compulsões
    {
      id: "C1",
      text: "C1 — Tempo ocupado por compulsões (horas por dia)",
      options: [
        { label: "0 — Nenhuma", value: 0 },
        { label: "1 — Leve: <1 hora/dia", value: 1 },
        { label: "2 — Moderado: 1-3 horas/dia", value: 2 },
        { label: "3 — Grave: >3-8 horas/dia", value: 3 },
        { label: "4 — Extremo: >8 horas/dia, quase constante", value: 4 },
      ],
    },
    {
      id: "C2",
      text: "C2 — Interferência das compulsões no funcionamento social/ocupacional",
      options: opt04,
    },
    {
      id: "C3",
      text: "C3 — Sofrimento se as compulsões forem interrompidas ou impedidas",
      options: opt04,
    },
    {
      id: "C4",
      text: "C4 — Resistência às compulsões (esforço para não realizá-las)",
      options: [
        { label: "0 — Sempre resiste", value: 0 },
        { label: "1 — Resiste na maioria das vezes", value: 1 },
        { label: "2 — Faz algum esforço para resistir", value: 2 },
        { label: "3 — Cede à maioria das compulsões", value: 3 },
        { label: "4 — Cede completamente; controle totalmente ausente", value: 4 },
      ],
    },
    {
      id: "C5",
      text: "C5 — Controle sobre as compulsões (capacidade de adiá-las ou interrompê-las)",
      options: [
        { label: "0 — Controle total", value: 0 },
        { label: "1 — Bom controle", value: 1 },
        { label: "2 — Controle moderado", value: 2 },
        { label: "3 — Pouco controle", value: 3 },
        { label: "4 — Nenhum controle", value: 4 },
      ],
    },
  ],
  bands: [
    { min: 0,  max: 7,  label: "Subclínico",  severity: "normal"      },
    { min: 8,  max: 15, label: "Leve",         severity: "leve"        },
    { min: 16, max: 23, label: "Moderado",     severity: "moderado"    },
    { min: 24, max: 31, label: "Grave",        severity: "grave"       },
    { min: 32, max: 40, label: "Extremo",      severity: "muito_grave" },
  ],
  note:
    "Escala heteroaplicada. Requer identificação prévia dos sintomas obsessivo-compulsivos específicos do paciente. " +
    "Redução ≥35% no escore é frequentemente usada como critério de resposta ao tratamento.",
};

export default ybocs;
