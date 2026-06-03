import { LIKERT_1_7, type ScaleDef } from "../types";

export const panssec: ScaleDef = {
  id: "panssec",
  acronym: "PANSS-EC",
  name: "PANSS Componente de Excitação (Excited Component)",
  description:
    "Subescala derivada da PANSS composta por 5 itens que avaliam agitação e excitação psicomotora: " +
    "P4 (excitação), P7 (hostilidade), G4 (tensão), G8 (não-cooperação) e G14 (controle deficiente dos impulsos). " +
    "Amplamente usada em situações de emergência psiquiátrica e agitação aguda.",
  category: "Psicose",
  reference: "Montoya et al. (2011); Kay et al. (1987)",
  defaultOptions: LIKERT_1_7,
  items: [
    { id: "P4",  text: "P4 — Excitação (hiperatividade, agitação psicomotora)" },
    { id: "P7",  text: "P7 — Hostilidade (raiva, animosidade, ameaças verbais/físicas)" },
    { id: "G4",  text: "G4 — Tensão (tensão física observada, postura rígida)" },
    { id: "G8",  text: "G8 — Não-cooperação (recusa ativa em colaborar com entrevista ou cuidados)" },
    { id: "G14", text: "G14 — Controle deficiente dos impulsos (explosividade, baixa tolerância à frustração)" },
  ],
  bands: [
    { min: 5,  max: 9,  label: "Agitação mínima/ausente", severity: "normal"      },
    { min: 10, max: 14, label: "Agitação leve",           severity: "leve"        },
    { min: 15, max: 19, label: "Agitação moderada",       severity: "moderado"    },
    { min: 20, max: 24, label: "Agitação grave",          severity: "grave"       },
    { min: 25, max: 35, label: "Agitação muito grave",    severity: "muito_grave" },
  ],
  note:
    "Instrumento indicado para monitoramento de agitação aguda em urgência psiquiátrica. " +
    "Pontuação ≥14 sugere agitação clinicamente significativa. " +
    "Em situações de risco imediato, priorizar a segurança do paciente e da equipe antes da aplicação formal.",
};

export default panssec;
