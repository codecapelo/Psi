import { type ScaleDef } from "../types";

export const mmse: ScaleDef = {
  id: "mmse",
  acronym: "MEEM/MMSE",
  name: "Mini Exame do Estado Mental",
  description:
    "Avaliação cognitiva breve estruturada em domínios: orientação temporal, orientação espacial, " +
    "registro, atenção e cálculo, evocação e linguagem/praxia. Escore máximo: 30 pontos. " +
    "Administrado pelo clínico por meio de perguntas e tarefas padronizadas.",
  category: "Cognição",
  reference: "Folstein, Folstein & McHugh (1975); versão brasileira: Bertolucci et al. (1994)",
  items: [
    {
      id: "orientacao_temporal",
      text: "Orientação temporal — Ano, mês, dia do mês, dia da semana, hora aproximada (1 ponto cada = 0-5)",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
        { label: "5", value: 5 },
      ],
    },
    {
      id: "orientacao_espacial",
      text: "Orientação espacial — País, estado, cidade, local, andar/setor (1 ponto cada = 0-5)",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
        { label: "5", value: 5 },
      ],
    },
    {
      id: "registro",
      text: "Registro (memória imediata) — Repetição de 3 palavras: 1 ponto por palavra = 0-3",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
      ],
    },
    {
      id: "atencao_calculo",
      text: "Atenção e cálculo — Serial de 7s (100-7-7-7-7-7) ou soletrar MUNDO ao contrário: 0-5",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
        { label: "5", value: 5 },
      ],
    },
    {
      id: "evocacao",
      text: "Evocação (memória diferida) — Recordação das 3 palavras do registro: 1 ponto cada = 0-3",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
      ],
    },
    {
      id: "linguagem_praxia",
      text: "Linguagem e praxia — Nomeação (2), repetição de frase (1), comando de 3 etapas (3), leitura (1), escrita (1), cópia do pentágono (1) = 0-9",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
        { label: "5", value: 5 },
        { label: "6", value: 6 },
        { label: "7", value: 7 },
        { label: "8", value: 8 },
        { label: "9", value: 9 },
      ],
    },
  ],
  bands: [
    { min: 0,  max: 17, label: "Comprometimento cognitivo importante",       severity: "grave"    },
    { min: 18, max: 23, label: "Comprometimento cognitivo leve a moderado",  severity: "moderado" },
    { min: 24, max: 30, label: "Normal (dentro dos limites esperados)",       severity: "normal"   },
  ],
  note:
    "Os pontos de corte variam conforme o nível de escolaridade. Referências comuns (Brasil): " +
    "analfabetos ≥13; 1-4 anos ≥18; 5-8 anos ≥26; 9-11 anos ≥26; ≥12 anos ≥27 (Bertolucci et al., 1994). " +
    "Escala de triagem — resultado alterado requer avaliação neuropsicológica complementar. " +
    "Escore máximo: 30 (5+5+3+5+3+9).",
};

export default mmse;
