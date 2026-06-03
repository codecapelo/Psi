import { type ScaleDef } from "../types";

// Itens com peso simples (0-4): 2,3,4,6,7,9,10 → 7 itens (max 28)
const opt0_4 = [
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
];

// Itens com peso duplo (0,2,4,6,8): itens 1,5,8,10 da YMRS original
// 1 = humor elevado, 5 = irritabilidade, 8 = grandiosidade, 10 = comportamento disruptivo-agressivo
// Os valores já refletem a escala 0-2-4-6-8 (max 8 × 4 itens = 32; + 7×4 = 28; total = 60)
const opt0_8 = [
  { label: "0", value: 0 },
  { label: "2", value: 2 },
  { label: "4", value: 4 },
  { label: "6", value: 6 },
  { label: "8", value: 8 },
];

export const ymrs: ScaleDef = {
  id: "ymrs",
  acronym: "YMRS",
  name: "Young Mania Rating Scale",
  description:
    "Escala heteroaplicada de 11 itens para avaliação da gravidade de episódios maníacos. " +
    "Sete itens são pontuados de 0 a 4; quatro itens (humor elevado, irritabilidade, " +
    "grandiosidade e comportamento disruptivo-agressivo) são pontuados de 0 a 8 (peso duplo). " +
    "Escore máximo: 60.",
  category: "Mania/Bipolar",
  reference: "Young et al. (1978)",
  items: [
    {
      id: "1",
      text: "Humor elevado (euforia, otimismo anormal, expansividade)",
      options: opt0_8,
    },
    {
      id: "2",
      text: "Aumento de atividade motora e energia",
      options: opt0_4,
    },
    {
      id: "3",
      text: "Interesse sexual aumentado",
      options: opt0_4,
    },
    {
      id: "4",
      text: "Sono reduzido (horas dormidas em relação ao habitual)",
      options: opt0_4,
    },
    {
      id: "5",
      text: "Irritabilidade",
      options: opt0_8,
    },
    {
      id: "6",
      text: "Velocidade e quantidade do discurso (pressão do pensamento/fala)",
      options: opt0_4,
    },
    {
      id: "7",
      text: "Distúrbio formal do pensamento (fuga de ideias, tangencialidade, incoerência)",
      options: opt0_4,
    },
    {
      id: "8",
      text: "Grandiosidade (autoestima inflada, grandiosidade)",
      options: opt0_8,
    },
    {
      id: "9",
      text: "Conteúdo do pensamento (delírios, grandiosidade, projetos grandiosos, religiosidade, hostilidade)",
      options: opt0_4,
    },
    {
      id: "10",
      text: "Comportamento disruptivo-agressivo (barulhento, hostil, ameaçador, agressivo)",
      options: opt0_8,
    },
    {
      id: "11",
      text: "Aparência (vestimenta, adornos, asseio, postura)",
      options: opt0_4,
    },
  ],
  bands: [
    { min: 0,  max: 12, label: "Remissão/eutimia",           severity: "normal"      },
    { min: 13, max: 19, label: "Mania leve/hipomania",       severity: "leve"        },
    { min: 20, max: 25, label: "Mania moderada",             severity: "moderado"    },
    { min: 26, max: 60, label: "Mania grave",                severity: "grave"       },
  ],
  note:
    "Escala heteroaplicada. Quatro itens possuem peso dobrado (valores 0/2/4/6/8): " +
    "humor elevado (1), irritabilidade (5), grandiosidade (8) e comportamento disruptivo-agressivo (10) — " +
    "os valores selecionados já refletem esse peso; a soma direta resulta no escore correto (máximo 60). " +
    "Pontuação ≥20 é amplamente usada como critério de inclusão para ensaios clínicos de mania.",
};

export default ymrs;
