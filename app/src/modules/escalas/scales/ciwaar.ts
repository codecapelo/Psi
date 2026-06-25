import { type ScaleDef } from "../types";

export const ciwaar: ScaleDef = {
  "id": "ciwaar",
  "acronym": "CIWA-Ar",
  "name": "Escala de Avaliação de Abstinência Alcoólica do Clinical Institute (CIWA-Ar)",
  "description": "Instrumento clínico para avaliar a gravidade da síndrome de abstinência alcoólica e orientar o tratamento (regime sintoma-guiado com benzodiazepínicos). Composto por 10 itens: nove itens pontuam de 0 a 7 (náusea/vômitos, tremor, sudorese paroxística, ansiedade, agitação, distúrbios táteis, distúrbios auditivos, distúrbios visuais e cefaleia/peso na cabeça) e um item de orientação/sensório que pontua de 0 a 4. O escore total varia de 0 a 67; quanto maior o escore, mais grave a abstinência e maior o risco de complicações como convulsões e delirium tremens.",
  "category": "Dependência",
  "reference": "Sullivan JT, Sykora K, Schneiderman J, Naranjo CA, Sellers EM. Assessment of alcohol withdrawal: the revised Clinical Institute Withdrawal Assessment for Alcohol scale (CIWA-Ar). Br J Addict. 1989;84(11):1353-1357.",
  "items": [
    {
      "id": "1",
      "text": "Náusea e vômitos — Pergunte: \"Você está enjoado(a)? Tem vomitado?\" Observe.",
      "options": [
        {
          "label": "Sem náusea, sem vômitos (0)",
          "value": 0
        },
        {
          "label": "Náusea leve, sem vômitos (1)",
          "value": 1
        },
        {
          "label": "Náusea leve a moderada (2)",
          "value": 2
        },
        {
          "label": "Náusea moderada (3)",
          "value": 3
        },
        {
          "label": "Náusea intermitente com ânsia de vômito (4)",
          "value": 4
        },
        {
          "label": "Náusea acentuada com ânsia frequente (5)",
          "value": 5
        },
        {
          "label": "Náusea intensa com ânsia persistente (6)",
          "value": 6
        },
        {
          "label": "Náusea constante, ânsia de vômito e vômitos (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "2",
      "text": "Tremor — Braços estendidos e dedos afastados. Observe.",
      "options": [
        {
          "label": "Sem tremor (0)",
          "value": 0
        },
        {
          "label": "Tremor imperceptível, sentido na ponta dos dedos (1)",
          "value": 1
        },
        {
          "label": "Tremor leve, palpável (2)",
          "value": 2
        },
        {
          "label": "Tremor leve a moderado (3)",
          "value": 3
        },
        {
          "label": "Tremor moderado com braços estendidos (4)",
          "value": 4
        },
        {
          "label": "Tremor moderado a intenso (5)",
          "value": 5
        },
        {
          "label": "Tremor intenso (6)",
          "value": 6
        },
        {
          "label": "Tremor intenso, visível mesmo sem estender os braços (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "3",
      "text": "Sudorese paroxística — Observe.",
      "options": [
        {
          "label": "Sem sudorese visível (0)",
          "value": 0
        },
        {
          "label": "Sudorese discreta, palmas úmidas (1)",
          "value": 1
        },
        {
          "label": "Sudorese leve a moderada (2)",
          "value": 2
        },
        {
          "label": "Sudorese perceptível na fronte (3)",
          "value": 3
        },
        {
          "label": "Sudorese moderada, gotas na fronte (4)",
          "value": 4
        },
        {
          "label": "Sudorese moderada a intensa (5)",
          "value": 5
        },
        {
          "label": "Sudorese intensa (6)",
          "value": 6
        },
        {
          "label": "Sudorese profusa, encharcamento (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "4",
      "text": "Ansiedade — Pergunte: \"Você se sente nervoso(a)/ansioso(a)?\" Observe.",
      "options": [
        {
          "label": "Sem ansiedade, tranquilo(a) (0)",
          "value": 0
        },
        {
          "label": "Levemente ansioso(a) (1)",
          "value": 1
        },
        {
          "label": "Ansiedade leve a moderada (2)",
          "value": 2
        },
        {
          "label": "Ansiedade moderada (3)",
          "value": 3
        },
        {
          "label": "Moderadamente ansioso(a) ou em guarda (4)",
          "value": 4
        },
        {
          "label": "Ansiedade acentuada (5)",
          "value": 5
        },
        {
          "label": "Ansiedade intensa (6)",
          "value": 6
        },
        {
          "label": "Ansiedade extrema, equivalente a pânico ou estado delirante agudo (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "5",
      "text": "Agitação — Observe.",
      "options": [
        {
          "label": "Atividade normal (0)",
          "value": 0
        },
        {
          "label": "Atividade um pouco aumentada (1)",
          "value": 1
        },
        {
          "label": "Inquietação leve (2)",
          "value": 2
        },
        {
          "label": "Inquietação leve a moderada (3)",
          "value": 3
        },
        {
          "label": "Moderadamente inquieto(a) e agitado(a) (4)",
          "value": 4
        },
        {
          "label": "Inquietação acentuada (5)",
          "value": 5
        },
        {
          "label": "Agitação intensa (6)",
          "value": 6
        },
        {
          "label": "Anda de um lado para o outro ou se debate constantemente (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "6",
      "text": "Distúrbios táteis — Pergunte: \"Sente coceira, formigamento, queimação, dormência ou sensação de insetos sobre/sob a pele?\"",
      "options": [
        {
          "label": "Nenhum (0)",
          "value": 0
        },
        {
          "label": "Prurido, formigamento, queimação ou dormência muito leve (1)",
          "value": 1
        },
        {
          "label": "Prurido, formigamento, queimação ou dormência leve (2)",
          "value": 2
        },
        {
          "label": "Prurido, formigamento, queimação ou dormência moderado (3)",
          "value": 3
        },
        {
          "label": "Alucinações táteis moderadas (4)",
          "value": 4
        },
        {
          "label": "Alucinações táteis intensas (5)",
          "value": 5
        },
        {
          "label": "Alucinações táteis muito intensas (6)",
          "value": 6
        },
        {
          "label": "Alucinações táteis contínuas (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "7",
      "text": "Distúrbios auditivos — Pergunte: \"Está mais consciente dos sons ao redor? Eles parecem ásperos ou assustadores? Ouve algo que o(a) perturba ou que sabe não estar presente?\"",
      "options": [
        {
          "label": "Ausentes (0)",
          "value": 0
        },
        {
          "label": "Aspereza ou capacidade de assustar muito leve (1)",
          "value": 1
        },
        {
          "label": "Aspereza ou capacidade de assustar leve (2)",
          "value": 2
        },
        {
          "label": "Aspereza ou capacidade de assustar moderada (3)",
          "value": 3
        },
        {
          "label": "Alucinações auditivas moderadas (4)",
          "value": 4
        },
        {
          "label": "Alucinações auditivas intensas (5)",
          "value": 5
        },
        {
          "label": "Alucinações auditivas muito intensas (6)",
          "value": 6
        },
        {
          "label": "Alucinações auditivas contínuas (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "8",
      "text": "Distúrbios visuais — Pergunte: \"A luz parece muito intensa? De cor diferente? Machuca os olhos? Vê algo que o(a) perturba ou que sabe não estar presente?\"",
      "options": [
        {
          "label": "Ausentes (0)",
          "value": 0
        },
        {
          "label": "Sensibilidade à luz muito leve (1)",
          "value": 1
        },
        {
          "label": "Sensibilidade à luz leve (2)",
          "value": 2
        },
        {
          "label": "Sensibilidade à luz moderada (3)",
          "value": 3
        },
        {
          "label": "Alucinações visuais moderadas (4)",
          "value": 4
        },
        {
          "label": "Alucinações visuais intensas (5)",
          "value": 5
        },
        {
          "label": "Alucinações visuais muito intensas (6)",
          "value": 6
        },
        {
          "label": "Alucinações visuais contínuas (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "9",
      "text": "Cefaleia / peso na cabeça — Pergunte: \"Sente a cabeça diferente? Como uma faixa apertando a cabeça?\" Não pontue tontura/vertigem.",
      "options": [
        {
          "label": "Ausente (0)",
          "value": 0
        },
        {
          "label": "Muito leve (1)",
          "value": 1
        },
        {
          "label": "Leve (2)",
          "value": 2
        },
        {
          "label": "Moderada (3)",
          "value": 3
        },
        {
          "label": "Moderadamente intensa (4)",
          "value": 4
        },
        {
          "label": "Intensa (5)",
          "value": 5
        },
        {
          "label": "Muito intensa (6)",
          "value": 6
        },
        {
          "label": "Extremamente intensa (7)",
          "value": 7
        }
      ]
    },
    {
      "id": "10",
      "text": "Orientação e obnubilação do sensório — Pergunte: \"Que dia é hoje? Onde você está? Quem sou eu?\"",
      "options": [
        {
          "label": "Orientado(a), faz somas seriadas (0)",
          "value": 0
        },
        {
          "label": "Não consegue fazer somas seriadas ou tem dúvida quanto à data (1)",
          "value": 1
        },
        {
          "label": "Desorientado(a) para a data em até 2 dias do calendário (2)",
          "value": 2
        },
        {
          "label": "Desorientado(a) para a data em mais de 2 dias do calendário (3)",
          "value": 3
        },
        {
          "label": "Desorientado(a) para lugar e/ou pessoa (4)",
          "value": 4
        }
      ]
    }
  ],
  "bands": [
    {
      "min": 0,
      "max": 8,
      "label": "Abstinência mínima ou ausente — geralmente não requer medicação",
      "severity": "normal"
    },
    {
      "min": 9,
      "max": 15,
      "label": "Abstinência leve a moderada — considerar tratamento com benzodiazepínico",
      "severity": "leve"
    },
    {
      "min": 16,
      "max": 20,
      "label": "Abstinência moderada a grave — tratamento com benzodiazepínico indicado",
      "severity": "moderado"
    },
    {
      "min": 21,
      "max": 67,
      "label": "Abstinência grave — alto risco de convulsão e delirium tremens; tratar e monitorar de perto",
      "severity": "grave"
    }
  ],
  "note": "Versão de trabalho à beira-leito. Não substitui avaliação clínica. Reavalie em intervalos curtos no regime sintoma-guiado; escores elevados (≥ 16-21) indicam risco de convulsão e delirium tremens e exigem monitorização e conduta médica imediatas."
};

export default ciwaar;
