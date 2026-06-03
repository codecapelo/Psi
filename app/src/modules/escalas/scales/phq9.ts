import { LIKERT_0_4_FREQ, type ScaleDef } from "../types";

export const phq9: ScaleDef = {
  id: "phq9",
  acronym: "PHQ-9",
  name: "Patient Health Questionnaire-9",
  description: "Triagem e gravidade de sintomas depressivos (últimas 2 semanas).",
  category: "Depressão",
  reference: "Kroenke, Spitzer & Williams (2001)",
  defaultOptions: LIKERT_0_4_FREQ,
  note: "O item 9 avalia ideação suicida — em caso de resposta positiva, conduzir avaliação de risco (ver C-SSRS).",
  items: [
    { id: "1", text: "Pouco interesse ou prazer em fazer as coisas" },
    { id: "2", text: "Sentir-se para baixo, deprimido(a) ou sem esperança" },
    { id: "3", text: "Dificuldade para pegar no sono, continuar dormindo ou dormir demais" },
    { id: "4", text: "Sentir-se cansado(a) ou com pouca energia" },
    { id: "5", text: "Falta de apetite ou comer demais" },
    { id: "6", text: "Sentir-se mal consigo mesmo(a) — ou achar que é um fracasso ou que decepcionou a família" },
    { id: "7", text: "Dificuldade de concentração (ler, ver TV)" },
    { id: "8", text: "Lentidão ou agitação perceptíveis a outras pessoas" },
    { id: "9", text: "Pensar que seria melhor estar morto(a) ou se ferir de alguma forma" },
  ],
  bands: [
    { min: 0, max: 4, label: "Mínima/ausente", severity: "normal" },
    { min: 5, max: 9, label: "Leve", severity: "leve" },
    { min: 10, max: 14, label: "Moderada", severity: "moderado" },
    { min: 15, max: 19, label: "Moderadamente grave", severity: "grave" },
    { min: 20, max: 27, label: "Grave", severity: "muito_grave" },
  ],
};

export default phq9;
