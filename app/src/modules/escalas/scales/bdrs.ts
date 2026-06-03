import { type ScaleDef } from "../types";

const opt03 = [
  { label: "0 — Ausente",    value: 0 },
  { label: "1 — Leve",       value: 1 },
  { label: "2 — Moderado",   value: 2 },
  { label: "3 — Grave",      value: 3 },
];

export const bdrs: ScaleDef = {
  id: "bdrs",
  acronym: "BDRS",
  name: "Bipolar Depression Rating Scale",
  description:
    "Escala heteroaplicada de 20 itens projetada especificamente para avaliar a gravidade da depressão " +
    "bipolar, capturando características mistas e atípicas além dos sintomas depressivos clássicos. " +
    "Escore máximo: 60.",
  category: "Mania/Bipolar",
  reference: "Berk et al. (2007)",
  defaultOptions: opt03,
  items: [
    { id: "1",  text: "Tristeza (humor deprimido, sentir-se para baixo ou sem esperança)" },
    { id: "2",  text: "Prazer ou interesse reduzidos (anedonia)" },
    { id: "3",  text: "Apetite ou peso alterado (redução ou aumento)" },
    { id: "4",  text: "Sono perturbado (insônia ou hipersonia)" },
    { id: "5",  text: "Retardo psicomotor ou agitação observados" },
    { id: "6",  text: "Fadiga ou perda de energia" },
    { id: "7",  text: "Sentimentos de inutilidade ou culpa excessiva" },
    { id: "8",  text: "Dificuldade de concentração ou tomada de decisão" },
    { id: "9",  text: "Pensamentos de morte ou ideação suicida" },
    { id: "10", text: "Irritabilidade (raiva fácil, impaciência excessiva)" },
    { id: "11", text: "Reatividade de humor (humor melhora em resposta a eventos positivos)" },
    { id: "12", text: "Hipersensibilidade à rejeição interpessoal" },
    { id: "13", text: "Aumento de apetite ou ganho de peso (sintoma atípico)" },
    { id: "14", text: "Hipersonia (sono excessivo, dificuldade de acordar)" },
    { id: "15", text: "Sensação de peso nos membros (paralisia de chumbo)" },
    { id: "16", text: "Oscilações de humor ao longo do dia" },
    { id: "17", text: "Ansiedade (tensão, nervosismo, apreensão)" },
    { id: "18", text: "Pensamentos acelerados ou fuga de ideias (subjetivos)" },
    { id: "19", text: "Aumento de atividade, agitação ou energia" },
    { id: "20", text: "Comportamento de risco ou impulsividade" },
  ],
  bands: [
    { min: 0,  max: 9,  label: "Mínima/ausente",            severity: "normal"      },
    { min: 10, max: 19, label: "Depressão bipolar leve",    severity: "leve"        },
    { min: 20, max: 35, label: "Depressão bipolar moderada",severity: "moderado"    },
    { min: 36, max: 60, label: "Depressão bipolar grave",   severity: "grave"       },
  ],
  note:
    "Escala heteroaplicada. Os itens 18-20 capturam sintomas mistos (hipomaníacos sobrepostos à depressão). " +
    "O item 9 avalia ideação suicida — pontuação ≥2 requer avaliação de risco e segurança imediata.",
};

export default bdrs;
