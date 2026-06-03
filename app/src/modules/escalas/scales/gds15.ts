import { type ScaleDef } from "../types";

// Opções para itens onde "Sim" = 1 (depressivo) e "Não" = 0
const simDepressivo = [
  { label: "Sim", value: 1 },
  { label: "Não", value: 0 },
];

// Opções para itens reversos onde "Não" = 1 (depressivo) e "Sim" = 0
const naoDepressivo = [
  { label: "Sim", value: 0 },
  { label: "Não", value: 1 },
];

export const gds15: ScaleDef = {
  id: "gds15",
  acronym: "GDS-15",
  name: "Escala de Depressão Geriátrica (Versão Breve)",
  description:
    "Escala autoaplicada de triagem de depressão em idosos, com 15 perguntas de resposta Sim/Não. " +
    "A pontuação máxima é 15; itens reversos já estão codificados (resposta depressiva = 1 ponto).",
  category: "Geriatria",
  reference: "Sheikh & Yesavage (1986)",
  items: [
    {
      id: "1",
      text: "Você está basicamente satisfeito(a) com sua vida?",
      options: naoDepressivo,
    },
    {
      id: "2",
      text: "Você abandonou muitos de seus interesses e atividades?",
      options: simDepressivo,
    },
    {
      id: "3",
      text: "Você sente que sua vida está vazia?",
      options: simDepressivo,
    },
    {
      id: "4",
      text: "Você frequentemente se aborrece?",
      options: simDepressivo,
    },
    {
      id: "5",
      text: "Você está de bom humor na maior parte do tempo?",
      options: naoDepressivo,
    },
    {
      id: "6",
      text: "Você tem medo de que algo de mau lhe aconteça?",
      options: simDepressivo,
    },
    {
      id: "7",
      text: "Você se sente feliz na maior parte do tempo?",
      options: naoDepressivo,
    },
    {
      id: "8",
      text: "Você frequentemente se sente sem esperança?",
      options: simDepressivo,
    },
    {
      id: "9",
      text: "Você prefere ficar em casa a sair e fazer coisas novas?",
      options: simDepressivo,
    },
    {
      id: "10",
      text: "Você sente que tem mais problemas de memória do que a maioria das pessoas?",
      options: simDepressivo,
    },
    {
      id: "11",
      text: "Você acha que é maravilhoso estar vivo(a)?",
      options: naoDepressivo,
    },
    {
      id: "12",
      text: "Você se sente inútil?",
      options: simDepressivo,
    },
    {
      id: "13",
      text: "Você se sente cheio(a) de energia?",
      options: naoDepressivo,
    },
    {
      id: "14",
      text: "Você sente que sua situação é sem esperança?",
      options: simDepressivo,
    },
    {
      id: "15",
      text: "Você acha que a maioria das pessoas passa melhor do que você?",
      options: simDepressivo,
    },
  ],
  bands: [
    { min: 0,  max: 4,  label: "Normal",                         severity: "normal"   },
    { min: 5,  max: 9,  label: "Sugestivo de depressão",         severity: "moderado" },
    { min: 10, max: 15, label: "Indicativo de depressão grave",  severity: "grave"    },
  ],
  note:
    "Escala de triagem — pontuação elevada requer entrevista clínica confirmatória. " +
    "Não substitui avaliação diagnóstica. Indicada para idosos com capacidade cognitiva preservada ou levemente comprometida.",
};

export default gds15;
