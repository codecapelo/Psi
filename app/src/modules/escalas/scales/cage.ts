import { type ScaleDef } from "../types";

export const cage: ScaleDef = {
  "id": "cage",
  "acronym": "CAGE",
  "name": "Questionário CAGE",
  "description": "Instrumento breve de triagem para uso problemático de álcool, composto por 4 perguntas de resposta dicotômica (Sim/Não). O acrônimo CAGE deriva das palavras-chave em inglês das quatro perguntas: Cut down (reduzir), Annoyed (irritado), Guilty (culpado) e Eye-opener (beber pela manhã). Cada resposta \"Sim\" pontua 1 e cada \"Não\" pontua 0, com escore total de 0 a 4. É uma ferramenta de rastreamento rápido à beira-leito, sensível para identificar a necessidade de avaliação mais aprofundada, não sendo instrumento diagnóstico.",
  "category": "Dependência",
  "reference": "Ewing JA. Detecting alcoholism: the CAGE questionnaire. JAMA. 1984;252(14):1905-1907. Validação brasileira: Masur J, Monteiro MG. Validation of the CAGE alcoholism screening test in a Brazilian psychiatric inpatient hospital setting. Braz J Med Biol Res. 1983;16(3):215-218.",
  "defaultOptions": [
    {
      "label": "Não (0)",
      "value": 0
    },
    {
      "label": "Sim (1)",
      "value": 1
    }
  ],
  "items": [
    {
      "id": "1",
      "text": "Alguma vez o(a) senhor(a) sentiu que deveria diminuir a quantidade de bebida ou parar de beber?"
    },
    {
      "id": "2",
      "text": "As pessoas o(a) aborrecem porque criticam o seu modo de beber?"
    },
    {
      "id": "3",
      "text": "O(a) senhor(a) se sente culpado(a) pela maneira como costuma beber?"
    },
    {
      "id": "4",
      "text": "O(a) senhor(a) costuma beber pela manhã para diminuir o nervosismo ou a ressaca?"
    }
  ],
  "bands": [
    {
      "min": 0,
      "max": 1,
      "label": "Triagem negativa (0–1): baixa probabilidade de uso problemático de álcool",
      "severity": "normal"
    },
    {
      "min": 2,
      "max": 4,
      "label": "Triagem positiva (2–4): sugere uso problemático de álcool; aprofundar com AUDIT/avaliação clínica",
      "severity": "grave"
    }
  ],
  "note": "Versão de trabalho à beira-leito para triagem rápida. Escore total máximo = 4. Não substitui avaliação clínica nem estabelece diagnóstico de transtorno por uso de álcool; um escore positivo (≥2) indica necessidade de aprofundamento (ex.: AUDIT) e avaliação por profissional. Mesmo um único \"Sim\" pode justificar atenção clínica conforme o contexto."
};

export default cage;
