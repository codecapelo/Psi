import { type ScaleDef } from "../types";

// Opções de 0-3 como aproximação para escore bruto de cada subteste (faixa clínica)
const opt0_3 = [
  { label: "0 — Muito abaixo do esperado (>2 DP abaixo da norma)", value: 0 },
  { label: "1 — Abaixo do esperado (1-2 DP abaixo da norma)",      value: 1 },
  { label: "2 — Dentro do esperado (±1 DP da norma)",              value: 2 },
  { label: "3 — Acima do esperado (>1 DP acima da norma)",         value: 3 },
];

export const bacs: ScaleDef = {
  id: "bacs",
  acronym: "BACS",
  name: "Brief Assessment of Cognition in Schizophrenia",
  description:
    "Bateria breve de 6 subtestes cognitivos para avaliação da cognição em esquizofrenia: " +
    "memória verbal (lista de palavras), memória de trabalho (sequência de dígitos), " +
    "velocidade motora (fichas em recipiente), fluência verbal semântica, " +
    "velocidade de processamento (codificação de símbolos) e função executiva (Torre de Londres). " +
    "Requer aplicação presencial por profissional treinado com o kit formal.",
  category: "Cognição",
  reference: "Keefe et al. (2004)",
  items: [
    {
      id: "verbal",
      text: "Memória verbal — Aprendizado de lista de palavras (escore bruto: 0-75 tentativas; inserir classificação abaixo)",
      options: opt0_3,
    },
    {
      id: "trabalho",
      text: "Memória de trabalho — Sequência de dígitos (direto + inverso; escore bruto: 0-14; inserir classificação abaixo)",
      options: opt0_3,
    },
    {
      id: "motor",
      text: "Velocidade motora — Fichas em recipiente (número de fichas em 60 s; escore bruto varia; inserir classificação abaixo)",
      options: opt0_3,
    },
    {
      id: "fluencia",
      text: "Fluência verbal semântica — Animais em 60 s (escore bruto = número de animais; inserir classificação abaixo)",
      options: opt0_3,
    },
    {
      id: "velocidade",
      text: "Velocidade de processamento — Codificação de símbolos (escore bruto: 0-110; inserir classificação abaixo)",
      options: opt0_3,
    },
    {
      id: "executivo",
      text: "Função executiva — Torre de Londres (escore bruto: 0-22; inserir classificação abaixo)",
      options: opt0_3,
    },
  ],
  bands: [
    { min: 0,  max: 3,  label: "Déficit grave (maioria dos domínios muito abaixo da norma)", severity: "muito_grave" },
    { min: 4,  max: 8,  label: "Déficit moderado",                                            severity: "grave"       },
    { min: 9,  max: 13, label: "Déficit leve",                                                severity: "moderado"    },
    { min: 14, max: 16, label: "Dentro da normalidade",                                       severity: "normal"      },
    { min: 17, max: 18, label: "Acima da média",                                              severity: "normal"      },
  ],
  note:
    "ATENÇÃO: O BACS é um teste de desempenho neuropsicológico que requer aplicação presencial com o kit formal " +
    "(materiais padronizados), treinamento específico e tabelas normativas por idade/sexo/escolaridade. " +
    "Este formulário utiliza uma classificação simplificada (0-3 por subteste) apenas para registro de " +
    "resultados já obtidos — NÃO substitui a aplicação e pontuação formal da bateria. " +
    "O escore composto padronizado (Z-score) é o índice primário de interpretação.",
};

export default bacs;
