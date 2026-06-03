import { LIKERT_1_7, type ScaleDef } from "../types";

export const bprs: ScaleDef = {
  id: "bprs",
  acronym: "BPRS",
  name: "Brief Psychiatric Rating Scale",
  description:
    "Escala breve de avaliação psiquiátrica com 18 itens cobrindo sintomas psicóticos, " +
    "afetivos e de agitação. Amplamente usada em estudos clínicos e monitoramento de resposta ao tratamento.",
  category: "Psicose",
  reference: "Overall & Gorham (1962); versão 18 itens: Rhoades & Overall (1988)",
  defaultOptions: LIKERT_1_7,
  items: [
    { id: "1",  text: "Preocupação somática — grau de preocupação com saúde física" },
    { id: "2",  text: "Ansiedade — preocupação, medo e apreensão subjetivos" },
    { id: "3",  text: "Retraimento emocional — déficit no contato espontâneo" },
    { id: "4",  text: "Desorganização conceitual — grau de desorganização do pensamento" },
    { id: "5",  text: "Autodepreciação e sentimentos de culpa" },
    { id: "6",  text: "Tensão — tensão física e agitação motora observadas" },
    { id: "7",  text: "Maneirismos e posturas — comportamentos motores incomuns" },
    { id: "8",  text: "Grandiosidade — autoestima exagerada e expansividade" },
    { id: "9",  text: "Humor depressivo — tristeza, abatimento, desespero" },
    { id: "10", text: "Hostilidade — animosidade, descaso, agressividade verbal" },
    { id: "11", text: "Desconfiança — crença de ser alvo de discriminação ou perseguição" },
    { id: "12", text: "Comportamento alucinatório — percepções sem estímulo externo" },
    { id: "13", text: "Retardo motor — lentidão dos movimentos e do discurso" },
    { id: "14", text: "Não-cooperação — resistência, falta de colaboração" },
    { id: "15", text: "Conteúdo incomum do pensamento — estranho, bizarro, irrealista" },
    { id: "16", text: "Embotamento afetivo — redução do alcance e da intensidade emocional" },
    { id: "17", text: "Excitação — hiperatividade e aumento do tônus motor" },
    { id: "18", text: "Desorientação — confusão temporal, espacial ou de identidade" },
  ],
  bands: [
    { min: 18, max: 30,  label: "Mínimo/ausente",   severity: "normal"      },
    { min: 31, max: 48,  label: "Leve",              severity: "leve"        },
    { min: 49, max: 72,  label: "Moderado",          severity: "moderado"    },
    { min: 73, max: 95,  label: "Grave",             severity: "grave"       },
    { min: 96, max: 126, label: "Muito grave",       severity: "muito_grave" },
  ],
};

export default bprs;
