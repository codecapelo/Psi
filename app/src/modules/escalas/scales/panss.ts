import { LIKERT_1_7, type ScaleDef } from "../types";

export const panss: ScaleDef = {
  id: "panss",
  acronym: "PANSS",
  name: "Positive and Negative Syndrome Scale",
  description:
    "Avaliação da síndrome positiva, negativa e psicopatologia geral em esquizofrenia. " +
    "Composta por 30 itens: 7 positivos (P), 7 negativos (N) e 16 de psicopatologia geral (G).",
  category: "Psicose",
  reference: "Kay, Fiszbein & Opler (1987)",
  defaultOptions: LIKERT_1_7,
  items: [
    // Subescala Positiva
    { id: "P1", text: "P1 — Delírios" },
    { id: "P2", text: "P2 — Desorganização conceitual" },
    { id: "P3", text: "P3 — Comportamento alucinatório" },
    { id: "P4", text: "P4 — Excitação" },
    { id: "P5", text: "P5 — Grandiosidade" },
    { id: "P6", text: "P6 — Desconfiança/persecutoriedade" },
    { id: "P7", text: "P7 — Hostilidade" },
    // Subescala Negativa
    { id: "N1", text: "N1 — Embotamento afetivo" },
    { id: "N2", text: "N2 — Retraimento emocional" },
    { id: "N3", text: "N3 — Contato pobre" },
    { id: "N4", text: "N4 — Retraimento social/passividade" },
    { id: "N5", text: "N5 — Dificuldade de pensamento abstrato" },
    { id: "N6", text: "N6 — Falta de espontaneidade e fluência na conversa" },
    { id: "N7", text: "N7 — Pensamento estereotipado" },
    // Psicopatologia Geral
    { id: "G1",  text: "G1 — Preocupações somáticas" },
    { id: "G2",  text: "G2 — Ansiedade" },
    { id: "G3",  text: "G3 — Sentimentos de culpa" },
    { id: "G4",  text: "G4 — Tensão" },
    { id: "G5",  text: "G5 — Maneirismos e posturas" },
    { id: "G6",  text: "G6 — Depressão" },
    { id: "G7",  text: "G7 — Retardo motor" },
    { id: "G8",  text: "G8 — Não-cooperação" },
    { id: "G9",  text: "G9 — Conteúdo incomum do pensamento" },
    { id: "G10", text: "G10 — Desorientação" },
    { id: "G11", text: "G11 — Atenção deficiente" },
    { id: "G12", text: "G12 — Falta de julgamento e insight" },
    { id: "G13", text: "G13 — Distúrbio da volição" },
    { id: "G14", text: "G14 — Controle deficiente dos impulsos" },
    { id: "G15", text: "G15 — Preocupação" },
    { id: "G16", text: "G16 — Esquiva social ativa" },
  ],
  bands: [
    { min: 30,  max: 58,  label: "Mínimo/ausente",        severity: "normal"     },
    { min: 59,  max: 75,  label: "Leve",                  severity: "leve"       },
    { min: 76,  max: 95,  label: "Moderado",              severity: "moderado"   },
    { min: 96,  max: 115, label: "Moderado-grave",        severity: "grave"      },
    { min: 116, max: 210, label: "Grave a extremo",       severity: "muito_grave"},
  ],
};

export default panss;
