import { type ScaleDef } from "../types";

const opt05 = [
  { label: "0 — Ausente",     value: 0 },
  { label: "1 — Questionável",value: 1 },
  { label: "2 — Leve",        value: 2 },
  { label: "3 — Moderado",    value: 3 },
  { label: "4 — Grave",       value: 4 },
  { label: "5 — Muito grave", value: 5 },
];

export const sans: ScaleDef = {
  id: "sans",
  acronym: "SANS",
  name: "Scale for the Assessment of Negative Symptoms",
  description:
    "Avalia sintomas negativos em esquizofrenia em cinco domínios: embotamento afetivo, alogia, " +
    "avolição-apatia, anedonia-associabilidade e atenção. Cada item pontuado de 0 a 5. " +
    "Inclui um item de avaliação global por domínio.",
  category: "Psicose",
  reference: "Andreasen (1982)",
  defaultOptions: opt05,
  items: [
    // Embotamento Afetivo (EA)
    { id: "EA1", text: "EA1 — Imobilidade e pobreza de expressão facial" },
    { id: "EA2", text: "EA2 — Diminuição dos movimentos espontâneos" },
    { id: "EA3", text: "EA3 — Escassez de movimentos expressivos dos gestos" },
    { id: "EA4", text: "EA4 — Pouco contato visual" },
    { id: "EA5", text: "EA5 — Afeto não-responsivo (ausência de resposta emocional a estímulos)" },
    { id: "EA6", text: "EA6 — Afeto inapropriado" },
    { id: "EA7", text: "EA7 — Ausência de inflexões vocais (voz monótona)" },
    { id: "EA_G", text: "EA-G — Avaliação global: embotamento afetivo" },
    // Alogia (AL)
    { id: "AL1", text: "AL1 — Pobreza do discurso" },
    { id: "AL2", text: "AL2 — Pobreza do conteúdo do discurso" },
    { id: "AL3", text: "AL3 — Bloqueio do pensamento" },
    { id: "AL4", text: "AL4 — Latência aumentada das respostas" },
    { id: "AL_G", text: "AL-G — Avaliação global: alogia" },
    // Avolição-Apatia (AV)
    { id: "AV1", text: "AV1 — Falta de cuidado com higiene e aparência pessoal" },
    { id: "AV2", text: "AV2 — Anergia — falta de persistência no trabalho/escola" },
    { id: "AV3", text: "AV3 — Lentidão e sedentarismo" },
    { id: "AV_G", text: "AV-G — Avaliação global: avolição-apatia" },
    // Anedonia-Associabilidade (AN)
    { id: "AN1", text: "AN1 — Ausência de atividades recreativas e de lazer" },
    { id: "AN2", text: "AN2 — Atividade sexual reduzida" },
    { id: "AN3", text: "AN3 — Incapacidade de sentir intimidade e proximidade" },
    { id: "AN4", text: "AN4 — Relacionamentos com pares diminuídos" },
    { id: "AN_G", text: "AN-G — Avaliação global: anedonia-associabilidade" },
    // Atenção (AT)
    { id: "AT1", text: "AT1 — Distração social — falha em prestar atenção à conversa" },
    { id: "AT2", text: "AT2 — Dificuldade de manter atenção durante testes formais" },
    { id: "AT_G", text: "AT-G — Avaliação global: atenção" },
  ],
  bands: [
    { min: 0,  max: 20,  label: "Mínimo/ausente",   severity: "normal"      },
    { min: 21, max: 40,  label: "Leve",              severity: "leve"        },
    { min: 41, max: 80,  label: "Moderado",          severity: "moderado"    },
    { min: 81, max: 120, label: "Grave",             severity: "grave"       },
    { min: 121,max: 130, label: "Muito grave",       severity: "muito_grave" },
  ],
  note:
    "Escala heteroaplicada, preenchida pelo clínico após entrevista e observação. " +
    "As avaliações globais por domínio (EA-G, AL-G, AV-G, AN-G, AT-G) são os principais indicadores clínicos; " +
    "a soma total é usada com finalidade de pesquisa.",
};

export default sans;
