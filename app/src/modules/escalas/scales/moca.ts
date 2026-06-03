import { type ScaleDef } from "../types";

export const moca: ScaleDef = {
  id: "moca",
  acronym: "MoCA",
  name: "Montreal Cognitive Assessment",
  description:
    "Avaliação cognitiva breve estruturada em 7 domínios: visuoespacial/executivo, nomeação, " +
    "atenção, linguagem, abstração, evocação tardia e orientação. Escore máximo: 30 pontos. " +
    "Mais sensível que o MEEM para comprometimento cognitivo leve.",
  category: "Cognição",
  reference: "Nasreddine et al. (2005); versão brasileira validada por Memória et al. (2013)",
  items: [
    {
      id: "visuoespacial",
      text: "Visuoespacial/Executivo — Trilha alternada (1), cubo (1), relógio (3): 0-5",
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
      id: "nomeacao",
      text: "Nomeação — Leão, rinoceronte, camelo/dromedário: 1 ponto cada = 0-3",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
      ],
    },
    {
      id: "atencao",
      text: "Atenção — Dígitos direto (1), inverso (1), vigilância/batida (1), serial de 7s (3): 0-6",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
        { label: "5", value: 5 },
        { label: "6", value: 6 },
      ],
    },
    {
      id: "linguagem",
      text: "Linguagem — Repetição de frases (2), fluência semântica/fonêmica ≥11 palavras (1): 0-3",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
      ],
    },
    {
      id: "abstracao",
      text: "Abstração — Semelhança entre dois pares de palavras: 1 ponto cada = 0-2",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
      ],
    },
    {
      id: "evocacao",
      text: "Evocação tardia — Recordação sem pistas das 5 palavras aprendidas: 1 ponto cada = 0-5",
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
      id: "orientacao",
      text: "Orientação — Data, mês, ano, dia da semana, local, cidade: 1 ponto cada = 0-6",
      options: [
        { label: "0", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
        { label: "5", value: 5 },
        { label: "6", value: 6 },
      ],
    },
  ],
  bands: [
    { min: 0,  max: 25, label: "Comprometimento cognitivo (possível CCL ou demência)", severity: "moderado" },
    { min: 26, max: 30, label: "Normal",                                                severity: "normal"   },
  ],
  note:
    "Adicionar 1 ponto ao escore total se o paciente tiver 12 anos ou menos de escolaridade formal " +
    "(exceto se o escore já for 30). Ponto de corte ≥26 = normal (Nasreddine et al., 2005). " +
    "Escore máximo: 30 (5+3+6+3+2+5+6). " +
    "Resultado alterado requer avaliação neuropsicológica e investigação etiológica complementar.",
};

export default moca;
