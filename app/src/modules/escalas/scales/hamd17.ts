import { type ScaleDef } from "../types";

// Opções reutilizáveis para o HAM-D
const opt04 = [
  { label: "0 — Ausente",         value: 0 },
  { label: "1 — Leve",            value: 1 },
  { label: "2 — Moderado",        value: 2 },
  { label: "3 — Grave",           value: 3 },
  { label: "4 — Muito grave",     value: 4 },
];

const opt02 = [
  { label: "0 — Ausente",         value: 0 },
  { label: "1 — Leve/provável",   value: 1 },
  { label: "2 — Presente/grave",  value: 2 },
];

export const hamd17: ScaleDef = {
  id: "hamd17",
  acronym: "HAM-D 17",
  name: "Hamilton Depression Rating Scale (17 itens)",
  description:
    "Escala heteroaplicada de avaliação da gravidade de depressão. Aplicada por clínico treinado " +
    "com base em entrevista clínica. 17 itens com escalas de 0-4 ou 0-2 conforme o instrumento original.",
  category: "Depressão",
  reference: "Hamilton (1960); versão 17 itens amplamente adotada",
  items: [
    { id: "1",  text: "Humor depressivo (tristeza, desesperança, desamparo, inutilidade)",
      options: opt04 },
    { id: "2",  text: "Sentimentos de culpa",
      options: opt04 },
    { id: "3",  text: "Suicídio (ideação, planos, tentativas)",
      options: opt04 },
    { id: "4",  text: "Insônia inicial (dificuldade para adormecer)",
      options: opt02 },
    { id: "5",  text: "Insônia intermediária (despertar durante a noite)",
      options: opt02 },
    { id: "6",  text: "Insônia tardia (acordar precocemente de manhã)",
      options: opt02 },
    { id: "7",  text: "Trabalho e atividades (perda de interesse, produtividade)",
      options: opt04 },
    { id: "8",  text: "Retardo psicomotor (lentidão do pensamento e da fala)",
      options: opt04 },
    { id: "9",  text: "Agitação psicomotora (inquietação, mexer as mãos, cabelos)",
      options: opt04 },
    { id: "10", text: "Ansiedade psíquica (tensão subjetiva, irritabilidade, preocupação)",
      options: opt04 },
    { id: "11", text: "Ansiedade somática (queixas físicas de ansiedade: palpitações, tremores, GI)",
      options: opt04 },
    { id: "12", text: "Sintomas somáticos gastrintestinais (apetite, constipação)",
      options: opt02 },
    { id: "13", text: "Sintomas somáticos gerais (fadiga, peso nos membros, dores musculares)",
      options: opt02 },
    { id: "14", text: "Sintomas genitais (perda de libido, distúrbios menstruais)",
      options: opt02 },
    { id: "15", text: "Hipocondria (preocupação exagerada com saúde física)",
      options: opt04 },
    { id: "16", text: "Perda de peso (por história ou observação clínica)",
      options: opt02 },
    { id: "17", text: "Insight (reconhece estar doente? atribui sintomas a doença?)",
      options: opt02 },
  ],
  bands: [
    { min: 0,  max: 7,  label: "Normal/sem depressão", severity: "normal"      },
    { min: 8,  max: 13, label: "Depressão leve",        severity: "leve"        },
    { min: 14, max: 18, label: "Depressão moderada",    severity: "moderado"    },
    { min: 19, max: 22, label: "Depressão grave",       severity: "grave"       },
    { min: 23, max: 52, label: "Depressão muito grave", severity: "muito_grave" },
  ],
  note:
    "Escala heteroaplicada — deve ser aplicada por profissional treinado com base em entrevista clínica estruturada. " +
    "O item 3 avalia risco de suicídio; pontuação ≥2 requer avaliação de segurança imediata.",
};

export default hamd17;
