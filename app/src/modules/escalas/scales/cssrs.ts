import { type ScaleDef } from "../types";

const simNao = [
  { label: "Sim", value: 1 },
  { label: "Não", value: 0 },
];

export const cssrs: ScaleDef = {
  id: "cssrs",
  acronym: "C-SSRS",
  name: "Columbia Suicide Severity Rating Scale (Triagem)",
  description:
    "Versão de triagem da C-SSRS com 6 perguntas sobre ideação suicida e comportamento suicida. " +
    "Usada para estratificação de risco. Resposta 'Sim' em qualquer item requer avaliação clínica imediata.",
  category: "Risco",
  reference: "Posner et al. (2011)",
  items: [
    {
      id: "1",
      text: "Desejo de morte — Você desejou estar morto(a) ou adormecer e não acordar mais?",
      options: simNao,
    },
    {
      id: "2",
      text: "Pensamentos suicidas inespecíficos — Você teve pensamentos de se matar, sem um método específico?",
      options: simNao,
    },
    {
      id: "3",
      text: "Pensamentos suicidas com método — Você pensou em como poderia se matar (método)?",
      options: simNao,
    },
    {
      id: "4",
      text: "Intenção suicida — Você teve pensamentos de se matar e alguma intenção de agir?",
      options: simNao,
    },
    {
      id: "5",
      text: "Plano suicida — Você teve pensamentos de se matar com plano, tempo, local ou forma de fazê-lo?",
      options: simNao,
    },
    {
      id: "6",
      text: "Comportamento suicida — Você já fez algo, começou a fazer algo ou se preparou para fazer algo para acabar com sua vida? (inclui tentativas, atos preparatórios, comportamento interrompido ou abortado)",
      options: simNao,
    },
  ],
  bands: [
    { min: 0, max: 0, label: "Sem risco aparente identificado nesta triagem", severity: "normal"      },
    { min: 1, max: 2, label: "Risco baixo — avaliação clínica necessária",    severity: "leve"        },
    { min: 3, max: 4, label: "Risco moderado — avaliação clínica urgente",    severity: "moderado"    },
    { min: 5, max: 6, label: "Risco alto — avaliação de segurança imediata",  severity: "muito_grave" },
  ],
  note:
    "⚠️ AVISO DE SEGURANÇA CRÍTICO: Esta escala não substitui a avaliação clínica de risco suicida. " +
    "QUALQUER resposta 'Sim' — independentemente do escore total — REQUER avaliação clínica imediata e " +
    "completa de risco e segurança. Em especial: 'Sim' nos itens 3-6 indica risco elevado e pode exigir " +
    "intervenção de emergência, hospitalização ou medidas de proteção. " +
    "Esta ferramenta é exclusivamente um suporte de triagem — a decisão clínica é sempre do profissional responsável. " +
    "Em caso de risco imediato, acionar serviços de emergência (SAMU 192 / CVV 188).",
};

export default cssrs;
