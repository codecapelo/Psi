import { type ScaleDef } from "../types";

const opt06 = [
  { label: "0 — Ausente/normal",  value: 0 },
  { label: "1",                   value: 1 },
  { label: "2 — Leve",            value: 2 },
  { label: "3",                   value: 3 },
  { label: "4 — Moderado",        value: 4 },
  { label: "5",                   value: 5 },
  { label: "6 — Grave/contínuo",  value: 6 },
];

export const madrs: ScaleDef = {
  id: "madrs",
  acronym: "MADRS",
  name: "Montgomery-Åsberg Depression Rating Scale",
  description:
    "Escala heteroaplicada de 10 itens para avaliação da gravidade de depressão. " +
    "Especialmente sensível à mudança com tratamento. Cada item pontuado de 0 a 6 (escore máximo: 60). " +
    "Os valores pares representam pontos-âncora; os ímpares são interpolados pelo avaliador.",
  category: "Depressão",
  reference: "Montgomery & Åsberg (1979)",
  defaultOptions: opt06,
  items: [
    { id: "1",  text: "Tristeza aparente — tristeza, desânimo, expressão facial e postura" },
    { id: "2",  text: "Tristeza relatada — relato subjetivo de humor deprimido" },
    { id: "3",  text: "Tensão interna — sentimentos de mal-estar, angústia, sofrimento interno" },
    { id: "4",  text: "Sono reduzido — quantidade e profundidade do sono em relação ao habitual" },
    { id: "5",  text: "Apetite reduzido — sensação de apetite e vontade de comer" },
    { id: "6",  text: "Dificuldade de concentração — capacidade de manter o pensamento e a atenção" },
    { id: "7",  text: "Lassidão — dificuldade para começar atividades; lentidão para iniciá-las" },
    { id: "8",  text: "Incapacidade para sentir — ausência de reação emocional a situações ou pessoas" },
    { id: "9",  text: "Pensamentos pessimistas — sentimentos de culpa, inferioridade, autoacusação, remorso" },
    { id: "10", text: "Pensamentos suicidas — ideação, planos ou tentativas de suicídio" },
  ],
  bands: [
    { min: 0,  max: 6,  label: "Normal/remissão",   severity: "normal"      },
    { min: 7,  max: 19, label: "Depressão leve",     severity: "leve"        },
    { min: 20, max: 34, label: "Depressão moderada", severity: "moderado"    },
    { min: 35, max: 60, label: "Depressão grave",    severity: "grave"       },
  ],
  note:
    "Escala heteroaplicada — deve ser preenchida pelo clínico. " +
    "O item 10 avalia ideação suicida; pontuação ≥4 requer avaliação de risco e segurança imediata. " +
    "Redução ≥50% no escore basal é frequentemente usada como critério de resposta ao tratamento.",
};

export default madrs;
