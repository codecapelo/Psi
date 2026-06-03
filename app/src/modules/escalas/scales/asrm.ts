import { type ScaleDef } from "../types";

const opt04 = [
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
];

export const asrm: ScaleDef = {
  id: "asrm",
  acronym: "EACA-M / ASRM",
  name: "Altman Self-Rating Mania Scale",
  description:
    "Escala autoaplicada de 5 itens para triagem de mania e hipomania. " +
    "Cada item apresenta 5 afirmações graduadas (0-4); o paciente seleciona a que melhor o descreve nos últimos 7 dias.",
  category: "Mania/Bipolar",
  reference: "Altman et al. (1997)",
  items: [
    {
      id: "1",
      text: "Humor positivo e elevado — nível de autoconfiança e bem-estar",
      options: [
        { label: "0 — Não me sinto mais feliz ou confiante do que o habitual", value: 0 },
        { label: "1 — Às vezes sinto-me mais feliz ou mais confiante do que o habitual", value: 1 },
        { label: "2 — Frequentemente sinto-me mais feliz e confiante do que o habitual", value: 2 },
        { label: "3 — Sinto-me muito mais feliz e confiante do que o habitual a maior parte do tempo", value: 3 },
        { label: "4 — Sinto-me extremamente mais feliz e confiante do que o habitual todo o tempo", value: 4 },
      ],
    },
    {
      id: "2",
      text: "Hiperatividade e excitação motora",
      options: [
        { label: "0 — Não me sinto mais ativo(a) ou enérgico(a) do que o habitual", value: 0 },
        { label: "1 — Às vezes sinto-me mais ativo(a) do que o habitual", value: 1 },
        { label: "2 — Frequentemente sinto-me mais ativo(a) e com mais energia do que o habitual", value: 2 },
        { label: "3 — Sinto-me muito mais ativo(a) e enérgico(a) do que o habitual a maior parte do tempo", value: 3 },
        { label: "4 — Estou constantemente ativo(a) e tenho muito mais energia do que o habitual", value: 4 },
      ],
    },
    {
      id: "3",
      text: "Pressão do pensamento e do discurso",
      options: [
        { label: "0 — Não me sinto mais falante do que o habitual", value: 0 },
        { label: "1 — Às vezes sinto necessidade de falar mais do que o habitual", value: 1 },
        { label: "2 — Frequentemente sinto-me compelido(a) a falar mais; pensamentos correm mais rápido", value: 2 },
        { label: "3 — Sinto grande pressão para falar quase o tempo todo; pensamentos muito acelerados", value: 3 },
        { label: "4 — Sinto necessidade contínua de falar; pensamentos tão rápidos que não consigo expressá-los", value: 4 },
      ],
    },
    {
      id: "4",
      text: "Necessidade reduzida de sono",
      options: [
        { label: "0 — Não preciso de menos sono do que o habitual", value: 0 },
        { label: "1 — Às vezes preciso de um pouco menos de sono do que o habitual", value: 1 },
        { label: "2 — Frequentemente preciso de 1-2 horas a menos de sono do que o habitual", value: 2 },
        { label: "3 — Frequentemente preciso de 3-4 horas a menos de sono do que o habitual", value: 3 },
        { label: "4 — Preciso de menos de metade do meu sono habitual sem me sentir cansado(a)", value: 4 },
      ],
    },
    {
      id: "5",
      text: "Comportamento com envolvimento excessivo em atividades prazerosas",
      options: [
        { label: "0 — Não me comporto de modo mais impulsivo ou irresponsável do que o habitual", value: 0 },
        { label: "1 — Às vezes comporto-me de modo mais impulsivo do que o habitual", value: 1 },
        { label: "2 — Frequentemente ajo de modo impulsivo; às vezes envolvo-me em atividades que não são boas para mim", value: 2 },
        { label: "3 — Frequentemente envolvo-me em atividades que podem ter consequências negativas", value: 3 },
        { label: "4 — Envolvo-me impulsivamente e continuamente em atividades que têm consequências dolorosas", value: 4 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 5,  label: "Baixa probabilidade de mania/hipomania", severity: "normal"   },
    { min: 6, max: 20, label: "Alta probabilidade de mania/hipomania",  severity: "grave"    },
  ],
  note:
    "Escala autoaplicada. Pontuação ≥6 indica alta probabilidade de episódio maníaco ou hipomaníaco " +
    "e requer avaliação clínica presencial para confirmação diagnóstica e avaliação de risco.",
};

export default asrm;
