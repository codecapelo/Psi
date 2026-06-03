import { type ScaleDef } from "../types";

// Cada item representa o produto Frequência (0-4) × Gravidade (0-3) = 0-12
const opt0_12 = [
  { label: "0 — Ausente (domínio não presente)",                                             value: 0  },
  { label: "1 — Frequência rara × Gravidade leve",                                          value: 1  },
  { label: "2 — Frequência ocasional × Gravidade leve",                                     value: 2  },
  { label: "3 — Frequência moderada × Gravidade leve  OU  rara × moderada",                 value: 3  },
  { label: "4 — Frequência frequente × Gravidade leve  OU  ocasional × moderada",           value: 4  },
  { label: "6 — Frequência moderada × Gravidade moderada  OU  ocasional × grave",           value: 6  },
  { label: "8 — Frequência frequente × Gravidade moderada",                                 value: 8  },
  { label: "9 — Frequência moderada × Gravidade grave",                                     value: 9  },
  { label: "12 — Frequência frequente × Gravidade grave (máximo)",                          value: 12 },
];

export const npi: ScaleDef = {
  id: "npi",
  acronym: "NPI",
  name: "Neuropsychiatric Inventory",
  description:
    "Avalia sintomas neuropsiquiátricos em demências. Cobre 12 domínios; em cada domínio, " +
    "o escore = Frequência (1-4) × Gravidade (1-3). Escore máximo por domínio: 12. " +
    "Escore total máximo: 144. Informante-chave (familiar/cuidador) responde as questões.",
  category: "Geriatria",
  reference: "Cummings et al. (1994)",
  defaultOptions: opt0_12,
  items: [
    { id: "delirios",       text: "Delírios — crenças falsas fixas (ex.: alguém rouba objetos, a casa não é a sua)" },
    { id: "alucinacoes",    text: "Alucinações — percepções sem estímulo externo (ouve vozes, vê pessoas/animais)" },
    { id: "agitacao",       text: "Agitação/Agressividade — resistência a cuidados, explosões verbais ou físicas" },
    { id: "depressao",      text: "Depressão/Disforia — tristeza, choro, desespero, pessimismo" },
    { id: "ansiedade",      text: "Ansiedade — tensão, preocupação, medo, sintomas físicos de ansiedade" },
    { id: "euforia",        text: "Euforia/Elação — alegria excessiva inapropriada, risos sem motivo" },
    { id: "apatia",         text: "Apatia/Indiferença — perda de motivação, interesse e espontaneidade" },
    { id: "desinibicao",    text: "Desinibição — comportamento impulsivo, socialmente inadequado, sem autocrítica" },
    { id: "irritabilidade", text: "Irritabilidade/Labilidade — impaciência, mudanças de humor rápidas, irritação fácil" },
    { id: "motor",          text: "Comportamento motor aberrante — repetitivo, sem objetivo (andar a esmo, mexer objetos)" },
    { id: "sono",           text: "Distúrbios do sono/comportamento noturno — despertar, deambular, acordar cuidador" },
    { id: "apetite",        text: "Alterações do apetite/alimentação — mudança em quantidade, preferências ou comportamento à mesa" },
  ],
  bands: [
    { min: 0,   max: 11,  label: "Mínimo/ausente",   severity: "normal"      },
    { min: 12,  max: 35,  label: "Leve",              severity: "leve"        },
    { min: 36,  max: 71,  label: "Moderado",          severity: "moderado"    },
    { min: 72,  max: 107, label: "Grave",             severity: "grave"       },
    { min: 108, max: 144, label: "Muito grave",       severity: "muito_grave" },
  ],
  note:
    "Cálculo por domínio: Escore = Frequência × Gravidade, onde Frequência: 1=raramente (<1×/semana), " +
    "2=às vezes (≈1×/semana), 3=frequentemente (várias vezes/semana), 4=muito frequentemente (diário/quase diário); " +
    "e Gravidade: 1=leve (perturbação mínima), 2=moderada (perturbação significativa), 3=grave (perturbação muito marcada). " +
    "Selecione o valor mais próximo do produto real observado. " +
    "O informante deve ser o familiar/cuidador que convive com o paciente; " +
    "avaliar sintomas presentes no ÚLTIMO MÊS.",
};

export default npi;
