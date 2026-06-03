import { LIKERT_0_4_FREQ, type ScaleDef } from "../types";

export const gad7: ScaleDef = {
  id: "gad7",
  acronym: "GAD-7",
  name: "Generalized Anxiety Disorder-7",
  description: "Triagem e gravidade de ansiedade generalizada (últimas 2 semanas).",
  category: "Ansiedade",
  reference: "Spitzer, Kroenke, Williams & Löwe (2006)",
  defaultOptions: LIKERT_0_4_FREQ,
  items: [
    { id: "1", text: "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)" },
    { id: "2", text: "Não conseguir parar ou controlar as preocupações" },
    { id: "3", text: "Preocupar-se muito com diversas coisas" },
    { id: "4", text: "Dificuldade para relaxar" },
    { id: "5", text: "Ficar tão agitado(a) que se torna difícil permanecer parado(a)" },
    { id: "6", text: "Ficar facilmente aborrecido(a) ou irritado(a)" },
    { id: "7", text: "Sentir medo como se algo terrível fosse acontecer" },
  ],
  bands: [
    { min: 0, max: 4, label: "Mínima/ausente", severity: "normal" },
    { min: 5, max: 9, label: "Leve", severity: "leve" },
    { min: 10, max: 14, label: "Moderada", severity: "moderado" },
    { min: 15, max: 21, label: "Grave", severity: "grave" },
  ],
};

export default gad7;
