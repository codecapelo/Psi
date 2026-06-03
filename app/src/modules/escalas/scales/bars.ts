import { type ScaleDef } from "../types";

export const bars: ScaleDef = {
  id: "bars",
  acronym: "BARS",
  name: "Barnes Akathisia Rating Scale",
  description:
    "Avalia a gravidade da acatisia induzida por medicamentos (geralmente antipsicóticos). " +
    "Composta por avaliação objetiva (comportamento observado), subjetiva (consciência e angústia do paciente) " +
    "e avaliação clínica global.",
  category: "Geral",
  reference: "Barnes (1989)",
  items: [
    {
      id: "obj",
      text: "Acatisia objetiva — movimentos observados: inquietação motora nos pés/pernas, marcha no lugar, incapacidade de ficar parado",
      options: [
        { label: "0 — Ausente", value: 0 },
        { label: "1 — Presença mínima de movimentos inquietos (não necessariamente reconhecidos pelo paciente)", value: 1 },
        { label: "2 — Movimentos inquietos observados com frequência (pelo menos metade do tempo de observação)", value: 2 },
        { label: "3 — Movimentos constantes e marcados; o paciente é incapaz de permanecer sentado", value: 3 },
      ],
    },
    {
      id: "subj_consciencia",
      text: "Consciência subjetiva de inquietação — o paciente relata sensação interna de inquietação ou necessidade de se mover",
      options: [
        { label: "0 — Ausente", value: 0 },
        { label: "1 — Inquietação interna relatada de forma não-espontânea quando questionado diretamente", value: 1 },
        { label: "2 — Necessidade de se mover relatada espontaneamente", value: 2 },
        { label: "3 — Relato de incapacidade de sentar-se por mais de alguns minutos", value: 3 },
      ],
    },
    {
      id: "subj_angustia",
      text: "Angústia subjetiva relacionada à inquietação — sofrimento causado pelos sintomas",
      options: [
        { label: "0 — Ausente", value: 0 },
        { label: "1 — Leve", value: 1 },
        { label: "2 — Moderada — claramente perturbadora para o paciente", value: 2 },
        { label: "3 — Grave — causa sofrimento intenso", value: 3 },
      ],
    },
    {
      id: "global",
      text: "Avaliação clínica global de acatisia",
      options: [
        { label: "0 — Ausente", value: 0 },
        { label: "1 — Questionável — dificuldade de distinguir de simples inquietação", value: 1 },
        { label: "2 — Leve — presença clara de acatisia; não causa grande sofrimento", value: 2 },
        { label: "3 — Moderada — sofrimento significativo e/ou prejuízo funcional", value: 3 },
        { label: "4 — Grave — sofrimento severo; o paciente é incapaz de permanecer sentado", value: 4 },
        { label: "5 — Muito grave — incapacitante; pode colocar o paciente em risco", value: 5 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 1,  label: "Ausente/questionável", severity: "normal"      },
    { min: 2, max: 4,  label: "Leve",                 severity: "leve"        },
    { min: 5, max: 8,  label: "Moderada",             severity: "moderado"    },
    { min: 9, max: 14, label: "Grave",                severity: "grave"       },
  ],
  note:
    "Avaliação baseada em observação clínica e entrevista. A pontuação global (item 4) é o principal indicador clínico; " +
    "a soma total serve como referência adicional. Diferenciar de discinesia tardia e de agitação psicótica.",
};

export default bars;
