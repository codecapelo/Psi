import { type ScaleDef } from "../types";

export const fagerstrom: ScaleDef = {
  "id": "fagerstrom",
  "acronym": "FTND",
  "name": "Teste de Fagerström para Dependência de Nicotina",
  "description": "Instrumento autoaplicável de 6 itens que avalia a intensidade da dependência física de nicotina em fumantes. Os itens têm escalas de pontuação próprias (valores mistos), e a soma das respostas varia de 0 a 10: quanto maior o escore, maior o grau de dependência. Útil para orientar a intensidade da intervenção e o suporte farmacológico na cessação do tabagismo.",
  "category": "Dependência",
  "reference": "Heatherton, Kozlowski, Frecker & Fagerström (1991) — Fagerström Test for Nicotine Dependence (FTND)",
  "items": [
    {
      "id": "1",
      "text": "Quanto tempo após acordar você fuma o seu primeiro cigarro?",
      "options": [
        {
          "label": "Dentro de 5 minutos (3)",
          "value": 3
        },
        {
          "label": "Entre 6 e 30 minutos (2)",
          "value": 2
        },
        {
          "label": "Entre 31 e 60 minutos (1)",
          "value": 1
        },
        {
          "label": "Após 60 minutos (0)",
          "value": 0
        }
      ]
    },
    {
      "id": "2",
      "text": "Você acha difícil não fumar em locais onde é proibido (igreja, biblioteca, cinema, etc.)?",
      "options": [
        {
          "label": "Sim (1)",
          "value": 1
        },
        {
          "label": "Não (0)",
          "value": 0
        }
      ]
    },
    {
      "id": "3",
      "text": "Qual cigarro do dia traz mais satisfação (custaria mais largar)?",
      "options": [
        {
          "label": "O primeiro da manhã (1)",
          "value": 1
        },
        {
          "label": "Qualquer outro (0)",
          "value": 0
        }
      ]
    },
    {
      "id": "4",
      "text": "Quantos cigarros você fuma por dia?",
      "options": [
        {
          "label": "10 ou menos (0)",
          "value": 0
        },
        {
          "label": "Entre 11 e 20 (1)",
          "value": 1
        },
        {
          "label": "Entre 21 e 30 (2)",
          "value": 2
        },
        {
          "label": "Mais de 30 (3)",
          "value": 3
        }
      ]
    },
    {
      "id": "5",
      "text": "Você fuma mais frequentemente nas primeiras horas após acordar do que durante o resto do dia?",
      "options": [
        {
          "label": "Sim (1)",
          "value": 1
        },
        {
          "label": "Não (0)",
          "value": 0
        }
      ]
    },
    {
      "id": "6",
      "text": "Você fuma mesmo estando tão doente que precisa ficar de cama a maior parte do dia?",
      "options": [
        {
          "label": "Sim (1)",
          "value": 1
        },
        {
          "label": "Não (0)",
          "value": 0
        }
      ]
    }
  ],
  "bands": [
    {
      "min": 0,
      "max": 2,
      "label": "Dependência muito baixa",
      "severity": "normal"
    },
    {
      "min": 3,
      "max": 4,
      "label": "Dependência baixa",
      "severity": "leve"
    },
    {
      "min": 5,
      "max": 5,
      "label": "Dependência média",
      "severity": "moderado"
    },
    {
      "min": 6,
      "max": 7,
      "label": "Dependência elevada",
      "severity": "grave"
    },
    {
      "min": 8,
      "max": 10,
      "label": "Dependência muito elevada",
      "severity": "muito_grave"
    }
  ],
  "note": "Versão de trabalho à beira-leito para apoio à decisão clínica. Escore elevado sugere maior dependência física e necessidade de suporte farmacológico na cessação. Não substitui a avaliação clínica nem o diagnóstico de transtorno por uso de tabaco."
};

export default fagerstrom;
