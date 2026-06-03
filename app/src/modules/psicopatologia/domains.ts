// ==========================================================================
// Exame Psicopatológico Estruturado — 16 domínios semiológicos.
// Conteúdo data-driven: um componente genérico (DomainStep) renderiza
// qualquer domínio a partir destas definições.
// ==========================================================================

export interface DomainItem {
  label: string;
  tooltip?: string;
  /** Marca o achado como "normal" (usado por 'Preencher Exame Normal'). */
  normal?: boolean;
}
export interface DomainCategory {
  name?: string;
  items: DomainItem[];
}
export interface DomainDef {
  id: string;
  title: string;
  shortTitle?: string;
  description?: string;
  categories: DomainCategory[];
}

export const DOMAINS: DomainDef[] = [
  {
    id: "consciencia",
    title: "Consciência (Vigília)",
    shortTitle: "Consciência",
    description: "Nível e qualidade do estado de vigília.",
    categories: [
      {
        items: [
          { label: "Consciência clara", tooltip: "Vigília plena, lucidez normal.", normal: true },
          { label: "Obnubilação", tooltip: "Rebaixamento leve a moderado, lentificação." },
          { label: "Sonolência / Torpor", tooltip: "Tendência ao sono, desperta a estímulos." },
          { label: "Estupor", tooltip: "Ausência de resposta com vigília aparente." },
          { label: "Coma", tooltip: "Ausência total de resposta a estímulos." },
          { label: "Delirium", tooltip: "Alteração flutuante da consciência e atenção, de início agudo." },
          { label: "Estado crepuscular", tooltip: "Estreitamento do campo da consciência." },
          { label: "Dissociação", tooltip: "Descontinuidade na integração de consciência/memória/identidade." },
        ],
      },
    ],
  },
  {
    id: "aparencia",
    title: "Aparência",
    description: "Apresentação geral, cuidados e vestimenta.",
    categories: [
      {
        items: [
          { label: "Cuidada / Adequada", tooltip: "Higiene e vestuário apropriados ao contexto.", normal: true },
          { label: "Descuidada", tooltip: "Autonegligência, higiene precária." },
          { label: "Bizarra / Extravagante", tooltip: "Vestimenta ou adornos incongruentes." },
          { label: "Aparenta idade maior que a real" },
          { label: "Aparenta idade menor que a real" },
          { label: "Sinais de desnutrição / emagrecimento" },
          { label: "Marcas/lesões autoprovocadas", tooltip: "Cicatrizes, escarificações." },
        ],
      },
    ],
  },
  {
    id: "atitude",
    title: "Atitude",
    description: "Postura do paciente frente ao examinador e à entrevista.",
    categories: [
      {
        items: [
          { label: "Cooperativa", tooltip: "Colabora com a entrevista.", normal: true },
          { label: "Hostil / Oposicionista" },
          { label: "Desconfiada / Querelante", tooltip: "Atitude suspicaz, reivindicatória." },
          { label: "Sedutora / Manipuladora" },
          { label: "Indiferente / Apática" },
          { label: "Dependente / Regressiva" },
          { label: "Dramática / Teatral" },
          { label: "Evasiva / Reticente" },
        ],
      },
    ],
  },
  {
    id: "psicomotricidade",
    title: "Psicomotricidade",
    description: "Atividade motora e expressão psicomotora.",
    categories: [
      {
        items: [
          { label: "Normocinética", tooltip: "Atividade motora dentro da normalidade.", normal: true },
          { label: "Hipocinesia / Lentificação", tooltip: "Redução global dos movimentos." },
          { label: "Hipercinesia / Agitação", tooltip: "Aumento da atividade motora." },
          { label: "Inquietação psicomotora" },
          { label: "Estupor", tooltip: "Imobilidade com ausência de reatividade." },
          { label: "Catatonia", tooltip: "Síndrome psicomotora: imobilidade, negativismo, flexibilidade cérea." },
          { label: "Estereotipias", tooltip: "Movimentos repetitivos, sem finalidade." },
          { label: "Maneirismos", tooltip: "Movimentos bizarros sobre atos intencionais." },
          { label: "Tiques" },
          { label: "Tremores" },
        ],
      },
    ],
  },
  {
    id: "contato",
    title: "Contato / Rapport",
    shortTitle: "Contato",
    description: "Qualidade do vínculo estabelecido na entrevista.",
    categories: [
      {
        items: [
          { label: "Rapport adequado / Sintônico", tooltip: "Bom estabelecimento de contato afetivo.", normal: true },
          { label: "Contato superficial" },
          { label: "Distante / Frio" },
          { label: "Hostil" },
          { label: "Praecox", tooltip: "Sensação de estranheza/impenetrabilidade no contato (esquizofrenia)." },
          { label: "Pegajoso / Viscoso" },
        ],
      },
    ],
  },
  {
    id: "afetividade",
    title: "Afetividade",
    description: "Humor (estado afetivo basal) e afeto (expressão).",
    categories: [
      {
        name: "Humor",
        items: [
          { label: "Eutímico", tooltip: "Humor normal.", normal: true },
          { label: "Hipotímico / Deprimido" },
          { label: "Hipertímico / Eufórico" },
          { label: "Irritável / Disfórico" },
          { label: "Ansioso" },
          { label: "Anedonia", tooltip: "Incapacidade de sentir prazer." },
        ],
      },
      {
        name: "Afeto",
        items: [
          { label: "Afeto ressonante / congruente", normal: true },
          { label: "Embotamento afetivo", tooltip: "Redução acentuada da expressão emocional." },
          { label: "Labilidade afetiva", tooltip: "Mudanças rápidas e bruscas do afeto." },
          { label: "Incontinência afetiva" },
          { label: "Afeto inadequado / incongruente" },
          { label: "Ambivalência afetiva" },
        ],
      },
    ],
  },
  {
    id: "sensopercepcao",
    title: "Sensopercepção",
    description: "Alterações da percepção.",
    categories: [
      {
        items: [
          { label: "Sem alterações", normal: true },
          { label: "Alucinação auditiva", tooltip: "Percepção sem objeto, modalidade auditiva (vozes)." },
          { label: "Alucinação visual" },
          { label: "Alucinação tátil / cenestésica" },
          { label: "Alucinação olfativa / gustativa" },
          { label: "Alucinose", tooltip: "Alucinação com crítica preservada." },
          { label: "Ilusão", tooltip: "Percepção distorcida de objeto real." },
          { label: "Despersonalização" },
          { label: "Desrealização" },
        ],
      },
    ],
  },
  {
    id: "pensamento",
    title: "Pensamento",
    description: "Curso, forma e conteúdo do pensamento.",
    categories: [
      {
        name: "Curso / Forma",
        items: [
          { label: "Curso normal", normal: true },
          { label: "Aceleração / Taquipsiquismo" },
          { label: "Lentificação / Bradipsiquismo" },
          { label: "Fuga de ideias" },
          { label: "Bloqueio / Interceptação" },
          { label: "Afrouxamento de associações" },
          { label: "Tangencialidade" },
          { label: "Circunstancialidade" },
          { label: "Prolixidade" },
          { label: "Perseveração" },
        ],
      },
      {
        name: "Conteúdo",
        items: [
          { label: "Sem alterações de conteúdo", normal: true },
          { label: "Delírio persecutório", tooltip: "Crença falsa de perseguição, irredutível." },
          { label: "Delírio de grandeza" },
          { label: "Delírio de ruína / culpa" },
          { label: "Delírio de referência" },
          { label: "Delírio místico/religioso" },
          { label: "Ideação obsessiva" },
          { label: "Ideias supervalorizadas" },
          { label: "Ideação suicida", tooltip: "Investigar planejamento e risco (ver C-SSRS)." },
          { label: "Ideação homicida / heteroagressiva" },
        ],
      },
    ],
  },
  {
    id: "linguagem",
    title: "Linguagem",
    description: "Expressão e compreensão verbal.",
    categories: [
      {
        items: [
          { label: "Linguagem normal", normal: true },
          { label: "Logorreia", tooltip: "Fluxo verbal aumentado." },
          { label: "Mutismo" },
          { label: "Disartria" },
          { label: "Afasia" },
          { label: "Neologismos", tooltip: "Criação de palavras novas." },
          { label: "Ecolalia", tooltip: "Repetição das palavras do interlocutor." },
          { label: "Parafasias" },
          { label: "Salada de palavras", tooltip: "Desorganização grave da linguagem." },
        ],
      },
    ],
  },
  {
    id: "memoria-orientacao",
    title: "Memória e Orientação",
    shortTitle: "Memória/Orientação",
    description: "Funções mnêmicas e orientação temporoespacial.",
    categories: [
      {
        name: "Orientação",
        items: [
          { label: "Orientado em tempo e espaço", normal: true },
          { label: "Desorientação temporal" },
          { label: "Desorientação espacial" },
          { label: "Desorientação autopsíquica", tooltip: "Quanto à própria identidade." },
        ],
      },
      {
        name: "Memória",
        items: [
          { label: "Memória preservada", normal: true },
          { label: "Amnésia anterógrada", tooltip: "Dificuldade de fixar novas memórias." },
          { label: "Amnésia retrógrada" },
          { label: "Hipomnésia" },
          { label: "Confabulação", tooltip: "Preenchimento de lacunas com falsas memórias." },
          { label: "Déjà vu / Jamais vu" },
        ],
      },
    ],
  },
  {
    id: "vontade",
    title: "Vontade (Conação)",
    shortTitle: "Vontade",
    description: "Capacidade de iniciar e sustentar atos voluntários.",
    categories: [
      {
        items: [
          { label: "Eubulia", tooltip: "Vontade normal.", normal: true },
          { label: "Hipobulia", tooltip: "Redução da vontade/iniciativa." },
          { label: "Abulia", tooltip: "Ausência de vontade." },
          { label: "Hiperbulia", tooltip: "Aumento da atividade volitiva." },
          { label: "Compulsões", tooltip: "Atos repetitivos para aliviar ansiedade." },
          { label: "Atos impulsivos" },
          { label: "Negativismo" },
        ],
      },
    ],
  },
  {
    id: "pragmatismo",
    title: "Pragmatismo",
    description: "Capacidade de atuar de forma prática e produtiva no cotidiano.",
    categories: [
      {
        items: [
          { label: "Pragmatismo preservado", tooltip: "Mantém atividades cotidianas e funcionais.", normal: true },
          { label: "Prejuízo leve do pragmatismo" },
          { label: "Prejuízo moderado" },
          { label: "Prejuízo grave / Incapacidade funcional" },
          { label: "Isolamento social" },
          { label: "Abandono de atividades laborais/estudo" },
        ],
      },
    ],
  },
  {
    id: "atencao",
    title: "Atenção / Concentração",
    shortTitle: "Atenção",
    description: "Capacidade de direcionar e sustentar a atenção.",
    categories: [
      {
        items: [
          { label: "Atenção preservada", normal: true },
          { label: "Hipoprosexia", tooltip: "Redução da atenção." },
          { label: "Hiperprosexia" },
          { label: "Distraibilidade", tooltip: "Atenção facilmente desviada (tenacidade baixa)." },
          { label: "Aprosexia", tooltip: "Abolição da atenção." },
          { label: "Dificuldade de concentração" },
        ],
      },
    ],
  },
  {
    id: "inteligencia",
    title: "Inteligência",
    description: "Estimativa global do funcionamento intelectual.",
    categories: [
      {
        items: [
          { label: "Aparentemente preservada / média", normal: true },
          { label: "Acima da média" },
          { label: "Abaixo da média" },
          { label: "Suspeita de deficiência intelectual", tooltip: "Considerar avaliação neuropsicológica formal." },
          { label: "Declínio cognitivo (suspeita)", tooltip: "Considerar rastreio (MEEM/MoCA)." },
        ],
      },
    ],
  },
  {
    id: "personalidade",
    title: "Personalidade",
    description: "Traços e padrões persistentes de funcionamento.",
    categories: [
      {
        items: [
          { label: "Sem traços disfuncionais evidentes", normal: true },
          { label: "Traços paranoides" },
          { label: "Traços esquizoides / esquizotípicos" },
          { label: "Traços borderline / emocionalmente instáveis" },
          { label: "Traços histriônicos" },
          { label: "Traços narcisistas" },
          { label: "Traços antissociais" },
          { label: "Traços evitativos / dependentes" },
          { label: "Traços anancásticos / obsessivos" },
        ],
      },
    ],
  },
  {
    id: "consciencia-morbidade",
    title: "Consciência de Morbidade (Insight)",
    shortTitle: "Insight",
    description: "Grau de reconhecimento do próprio adoecimento.",
    categories: [
      {
        items: [
          { label: "Insight preservado", tooltip: "Reconhece o adoecimento e a necessidade de tratamento.", normal: true },
          { label: "Insight parcial", tooltip: "Reconhecimento incompleto/ambivalente." },
          { label: "Insight ausente" },
          { label: "Anosognosia", tooltip: "Ausência de reconhecimento do déficit/doença." },
          { label: "Juízo crítico prejudicado" },
        ],
      },
    ],
  },
];

export function getDomain(id: string): DomainDef | undefined {
  return DOMAINS.find((d) => d.id === id);
}
