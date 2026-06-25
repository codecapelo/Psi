import { type ScaleDef } from "../types";

export const cows: ScaleDef = {
  "id": "cows",
  "acronym": "COWS",
  "name": "Escala Clínica de Abstinência de Opioides (Clinical Opiate Withdrawal Scale)",
  "description": "Instrumento heteroaplicado por clínico para quantificar a gravidade da síndrome de abstinência de opioides em 11 itens, combinando sinais observados (frequência cardíaca, sudorese, inquietação, diâmetro pupilar, tremor, bocejos, piloereção/pele arrepiada) e sintomas relatados (dores ósseas/articulares, corrimento nasal/lacrimejamento, sintomas gastrointestinais, ansiedade/irritabilidade). Cada item tem faixa própria de pontuação. Escore total de 0 a 48, somando os valores selecionados. Útil para guiar a indução com agonistas (ex.: buprenorfina) e monitorar a evolução da abstinência.",
  "category": "Dependência",
  "reference": "Wesson DR, Ling W. The Clinical Opiate Withdrawal Scale (COWS). J Psychoactive Drugs. 2003;35(2):253-9.",
  "items": [
    {
      "id": "1",
      "text": "Frequência cardíaca em repouso (FC por minuto, aferida após o paciente sentado ou deitado por 1 minuto)",
      "options": [
        {
          "label": "FC ≤ 80 bpm (0)",
          "value": 0
        },
        {
          "label": "FC 81–100 bpm (1)",
          "value": 1
        },
        {
          "label": "FC 101–120 bpm (2)",
          "value": 2
        },
        {
          "label": "FC > 120 bpm (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "2",
      "text": "Sudorese (na última meia hora, não relacionada à temperatura ambiente ou à atividade)",
      "options": [
        {
          "label": "Sem calafrios nem rubor relatados (0)",
          "value": 0
        },
        {
          "label": "Relato subjetivo de calafrios ou rubor (1)",
          "value": 1
        },
        {
          "label": "Rubor ou umidade visível na face (2)",
          "value": 2
        },
        {
          "label": "Gotículas de suor na fronte ou na face (3)",
          "value": 3
        },
        {
          "label": "Suor escorrendo pela face (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "3",
      "text": "Inquietação (observação durante a avaliação)",
      "options": [
        {
          "label": "Capaz de permanecer parado (0)",
          "value": 0
        },
        {
          "label": "Refere dificuldade para ficar parado, mas consegue (1)",
          "value": 1
        },
        {
          "label": "Movimentação/realocação frequente de braços e pernas (3)",
          "value": 3
        },
        {
          "label": "Incapaz de permanecer parado por mais de poucos segundos (5)",
          "value": 5
        }
      ]
    },
    {
      "id": "4",
      "text": "Diâmetro pupilar (avaliado sob iluminação ambiente normal)",
      "options": [
        {
          "label": "Pupilas puntiformes ou de tamanho normal para a luz (0)",
          "value": 0
        },
        {
          "label": "Pupilas possivelmente um pouco maiores que o normal (1)",
          "value": 1
        },
        {
          "label": "Pupilas moderadamente dilatadas (2)",
          "value": 2
        },
        {
          "label": "Pupilas tão dilatadas que apenas a borda da íris é visível (5)",
          "value": 5
        }
      ]
    },
    {
      "id": "5",
      "text": "Dores ósseas ou articulares (caso já presentes antes, considerar apenas o componente adicional da abstinência)",
      "options": [
        {
          "label": "Sem desconforto (0)",
          "value": 0
        },
        {
          "label": "Desconforto leve e difuso (1)",
          "value": 1
        },
        {
          "label": "Paciente relata dor difusa intensa em articulações/músculos (2)",
          "value": 2
        },
        {
          "label": "Paciente esfrega articulações/músculos e tem dificuldade de ficar parado pela dor (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "6",
      "text": "Corrimento nasal ou lacrimejamento (não atribuível a resfriado ou alergia)",
      "options": [
        {
          "label": "Ausente (0)",
          "value": 0
        },
        {
          "label": "Congestão nasal ou olhos incomumente úmidos (1)",
          "value": 1
        },
        {
          "label": "Coriza ou lacrimejamento (2)",
          "value": 2
        },
        {
          "label": "Coriza constante ou lágrimas escorrendo pela face (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "7",
      "text": "Sintomas gastrointestinais (na última meia hora)",
      "options": [
        {
          "label": "Sem sintomas gastrointestinais (0)",
          "value": 0
        },
        {
          "label": "Cólicas abdominais (1)",
          "value": 1
        },
        {
          "label": "Náusea ou fezes amolecidas (2)",
          "value": 2
        },
        {
          "label": "Vômito ou diarreia (3)",
          "value": 3
        },
        {
          "label": "Múltiplos episódios de vômito ou diarreia (5)",
          "value": 5
        }
      ]
    },
    {
      "id": "8",
      "text": "Tremor (observado com os braços estendidos)",
      "options": [
        {
          "label": "Sem tremor (0)",
          "value": 0
        },
        {
          "label": "Tremor perceptível ao toque, mas não visível (1)",
          "value": 1
        },
        {
          "label": "Tremor leve visível (2)",
          "value": 2
        },
        {
          "label": "Tremor grosseiro ou contrações musculares (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "9",
      "text": "Bocejos (observados durante a avaliação)",
      "options": [
        {
          "label": "Sem bocejos (0)",
          "value": 0
        },
        {
          "label": "Boceja uma ou duas vezes durante a avaliação (1)",
          "value": 1
        },
        {
          "label": "Boceja três ou mais vezes durante a avaliação (2)",
          "value": 2
        },
        {
          "label": "Boceja várias vezes por minuto (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "10",
      "text": "Ansiedade ou irritabilidade",
      "options": [
        {
          "label": "Ausente (0)",
          "value": 0
        },
        {
          "label": "Paciente refere irritabilidade ou ansiedade crescente (1)",
          "value": 1
        },
        {
          "label": "Paciente claramente ansioso ou irritável (2)",
          "value": 2
        },
        {
          "label": "Tão ansioso/irritável que a participação na avaliação é dificultada (4)",
          "value": 4
        }
      ]
    },
    {
      "id": "11",
      "text": "Piloereção (pele arrepiada / arrepios)",
      "options": [
        {
          "label": "Pele lisa (0)",
          "value": 0
        },
        {
          "label": "Pelos da pele eriçados; relato subjetivo de arrepios (3)",
          "value": 3
        },
        {
          "label": "Piloereção evidente e proeminente (5)",
          "value": 5
        }
      ]
    }
  ],
  "bands": [
    {
      "min": 0,
      "max": 4,
      "label": "Abstinência mínima",
      "severity": "normal"
    },
    {
      "min": 5,
      "max": 12,
      "label": "Abstinência leve",
      "severity": "leve"
    },
    {
      "min": 13,
      "max": 24,
      "label": "Abstinência moderada",
      "severity": "moderado"
    },
    {
      "min": 25,
      "max": 36,
      "label": "Abstinência moderadamente grave",
      "severity": "grave"
    },
    {
      "min": 37,
      "max": 48,
      "label": "Abstinência grave",
      "severity": "muito_grave"
    }
  ],
  "note": "Versão de trabalho à beira-leito, heteroaplicada por clínico. Não substitui a avaliação clínica nem decisões individualizadas de tratamento. Útil para orientar o momento da indução com agonista (ex.: buprenorfina geralmente requer escore indicativo de abstinência objetiva, comumente ≥ 8–12) e o monitoramento seriado; confirme valores de corte conforme o protocolo institucional."
};

export default cows;
