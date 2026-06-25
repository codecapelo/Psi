import { type ScaleDef } from "../types";

export const audit: ScaleDef = {
  "id": "audit",
  "acronym": "AUDIT",
  "name": "Teste de Identificação de Transtornos por Uso de Álcool (AUDIT)",
  "description": "Instrumento de rastreamento desenvolvido pela Organização Mundial da Saúde (OMS) para identificar padrões de consumo de álcool de risco, uso nocivo e provável dependência. Composto por 10 itens: os itens 1 a 3 avaliam o consumo (frequência, quantidade habitual e frequência de consumo elevado); os itens 4 a 6 avaliam sintomas de dependência; e os itens 7 a 10 avaliam consequências e problemas relacionados ao uso. Refere-se, em geral, aos últimos 12 meses. Pontuação total de 0 a 40.",
  "category": "Dependência",
  "reference": "Babor TF, Higgins-Biddle JC, Saunders JB, Monteiro MG. AUDIT — The Alcohol Use Disorders Identification Test: Guidelines for Use in Primary Care. 2ª ed. Genebra: Organização Mundial da Saúde (OMS); 2001. Versão brasileira validada: Lima CT et al. (2005); Méndez EB (1999).",
  "items": [
    {
      "id": "1",
      "text": "Com que frequência você consome bebidas alcoólicas?",
      "options": [
        {
          "label": "Nunca (0)",
          "value": 0
        },
        {
          "label": "Uma vez por mês ou menos (1)",
          "value": 1
        },
        {
          "label": "2 a 4 vezes por mês (2)",
          "value": 2
        },
        {
          "label": "2 a 3 vezes por semana (3)",
          "value": 3
        },
        {
          "label": "4 ou mais vezes por semana (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "2",
      "text": "Nas ocasiões em que bebe, quantas doses você consome tipicamente ao beber?",
      "options": [
        {
          "label": "1 ou 2 doses (0)",
          "value": 0
        },
        {
          "label": "3 ou 4 doses (1)",
          "value": 1
        },
        {
          "label": "5 ou 6 doses (2)",
          "value": 2
        },
        {
          "label": "7 a 9 doses (3)",
          "value": 3
        },
        {
          "label": "10 ou mais doses (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "3",
      "text": "Com que frequência você consome 6 ou mais doses em uma única ocasião?",
      "options": [
        {
          "label": "Nunca (0)",
          "value": 0
        },
        {
          "label": "Menos de uma vez por mês (1)",
          "value": 1
        },
        {
          "label": "Mensalmente (2)",
          "value": 2
        },
        {
          "label": "Semanalmente (3)",
          "value": 3
        },
        {
          "label": "Diariamente ou quase todos os dias (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "4",
      "text": "Quantas vezes, ao longo do último ano, você percebeu que não conseguia parar de beber uma vez que havia começado?",
      "options": [
        {
          "label": "Nunca (0)",
          "value": 0
        },
        {
          "label": "Menos de uma vez por mês (1)",
          "value": 1
        },
        {
          "label": "Mensalmente (2)",
          "value": 2
        },
        {
          "label": "Semanalmente (3)",
          "value": 3
        },
        {
          "label": "Diariamente ou quase todos os dias (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "5",
      "text": "Quantas vezes, ao longo do último ano, você deixou de fazer o que era esperado de você por causa da bebida?",
      "options": [
        {
          "label": "Nunca (0)",
          "value": 0
        },
        {
          "label": "Menos de uma vez por mês (1)",
          "value": 1
        },
        {
          "label": "Mensalmente (2)",
          "value": 2
        },
        {
          "label": "Semanalmente (3)",
          "value": 3
        },
        {
          "label": "Diariamente ou quase todos os dias (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "6",
      "text": "Quantas vezes, ao longo do último ano, você precisou beber pela manhã para se sentir bem ao longo do dia após ter bebido bastante no dia anterior?",
      "options": [
        {
          "label": "Nunca (0)",
          "value": 0
        },
        {
          "label": "Menos de uma vez por mês (1)",
          "value": 1
        },
        {
          "label": "Mensalmente (2)",
          "value": 2
        },
        {
          "label": "Semanalmente (3)",
          "value": 3
        },
        {
          "label": "Diariamente ou quase todos os dias (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "7",
      "text": "Quantas vezes, ao longo do último ano, você se sentiu culpado ou com remorso depois de ter bebido?",
      "options": [
        {
          "label": "Nunca (0)",
          "value": 0
        },
        {
          "label": "Menos de uma vez por mês (1)",
          "value": 1
        },
        {
          "label": "Mensalmente (2)",
          "value": 2
        },
        {
          "label": "Semanalmente (3)",
          "value": 3
        },
        {
          "label": "Diariamente ou quase todos os dias (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "8",
      "text": "Quantas vezes, ao longo do último ano, você foi incapaz de lembrar o que aconteceu na noite anterior por causa da bebida?",
      "options": [
        {
          "label": "Nunca (0)",
          "value": 0
        },
        {
          "label": "Menos de uma vez por mês (1)",
          "value": 1
        },
        {
          "label": "Mensalmente (2)",
          "value": 2
        },
        {
          "label": "Semanalmente (3)",
          "value": 3
        },
        {
          "label": "Diariamente ou quase todos os dias (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "9",
      "text": "Você já causou ferimentos a si mesmo ou a outras pessoas em decorrência do consumo de álcool?",
      "options": [
        {
          "label": "Não (0)",
          "value": 0
        },
        {
          "label": "Sim, mas não no último ano (2)",
          "value": 2
        },
        {
          "label": "Sim, durante o último ano (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "10",
      "text": "Algum parente, amigo, médico ou profissional de saúde já se preocupou com o seu consumo de álcool ou sugeriu que você reduzisse a bebida?",
      "options": [
        {
          "label": "Não (0)",
          "value": 0
        },
        {
          "label": "Sim, mas não no último ano (2)",
          "value": 2
        },
        {
          "label": "Sim, durante o último ano (4)",
          "value": 4
        }
      ]
    }
  ],
  "bands": [
    {
      "min": 0,
      "max": 7,
      "label": "Baixo risco — consumo de baixo risco ou abstinência; orientação educativa",
      "severity": "normal"
    },
    {
      "min": 8,
      "max": 15,
      "label": "Uso de risco — indicar intervenção breve (aconselhamento)",
      "severity": "leve"
    },
    {
      "min": 16,
      "max": 19,
      "label": "Uso nocivo — intervenção breve mais intensa e monitoramento continuado",
      "severity": "moderado"
    },
    {
      "min": 20,
      "max": 40,
      "label": "Provável dependência — encaminhar para avaliação diagnóstica e tratamento especializado",
      "severity": "grave"
    }
  ],
  "note": "Versão de trabalho à beira-leito para rastreamento; não substitui avaliação clínica nem fecha diagnóstico. Pontuações elevadas (especialmente itens 4-6 ou total ≥ 20) exigem avaliação de dependência e do risco de síndrome de abstinência. Uma dose-padrão equivale a aproximadamente 10-14 g de álcool puro. Considerar pontos de corte ajustados por sexo e contexto."
};

export default audit;
