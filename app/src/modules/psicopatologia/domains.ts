// ==========================================================================
// Exame Psicopatológico Estruturado — 16 domínios semiológicos.
// Conteúdo data-driven: um componente genérico (DomainStep) renderiza
// qualquer domínio a partir destas definições.
//
// Cada achado técnico traz um `tooltip` com definição clínica concisa (PT-BR),
// exibido ao passar o mouse sobre o ícone "?" ao lado do rótulo.
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
          { label: "Aparenta idade maior que a real", tooltip: "Aparência sugere idade superior à cronológica." },
          { label: "Aparenta idade menor que a real", tooltip: "Aparência sugere idade inferior à cronológica." },
          { label: "Sinais de desnutrição / emagrecimento", tooltip: "Perda ponderal, hipotrofia, sinais de privação alimentar." },
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
          { label: "Hostil / Oposicionista", tooltip: "Antagonismo ou recusa ativa à entrevista." },
          { label: "Desconfiada / Querelante", tooltip: "Atitude suspicaz, reivindicatória." },
          { label: "Sedutora / Manipuladora", tooltip: "Tenta seduzir ou influenciar o examinador em proveito próprio." },
          { label: "Indiferente / Apática", tooltip: "Falta de interesse ou engajamento com a avaliação." },
          { label: "Dependente / Regressiva", tooltip: "Busca excessiva de amparo, conduta infantilizada." },
          { label: "Dramática / Teatral", tooltip: "Expressão exagerada, com teatralidade." },
          { label: "Evasiva / Reticente", tooltip: "Esquiva-se das perguntas, responde de forma incompleta." },
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
          { label: "Inquietação psicomotora", tooltip: "Incapacidade de permanecer parado; agitação leve." },
          { label: "Estupor", tooltip: "Imobilidade com ausência de reatividade." },
          { label: "Catatonia", tooltip: "Síndrome psicomotora: imobilidade, negativismo, flexibilidade cérea." },
          { label: "Estereotipias", tooltip: "Movimentos repetitivos, sem finalidade." },
          { label: "Maneirismos", tooltip: "Movimentos bizarros sobre atos intencionais." },
          { label: "Tiques", tooltip: "Movimentos súbitos, rápidos e recorrentes, involuntários." },
          { label: "Tremores", tooltip: "Oscilações rítmicas involuntárias de um segmento corporal." },
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
          { label: "Contato superficial", tooltip: "Vínculo raso, sem engajamento afetivo real." },
          { label: "Distante / Frio", tooltip: "Afastamento afetivo, pouca reciprocidade no contato." },
          { label: "Hostil", tooltip: "Contato marcado por antagonismo ou agressividade." },
          { label: "Praecox", tooltip: "Sensação de estranheza/impenetrabilidade no contato (esquizofrenia)." },
          { label: "Pegajoso / Viscoso", tooltip: "Contato aderente; dificuldade de encerrar a interação (viscosidade)." },
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
          { label: "Hipotímico / Deprimido", tooltip: "Rebaixamento do humor, tristeza patológica." },
          { label: "Hipertímico / Eufórico", tooltip: "Elevação do humor, alegria desproporcional." },
          { label: "Irritável / Disfórico", tooltip: "Humor irritável, tenso ou desagradável." },
          { label: "Ansioso", tooltip: "Apreensão e tensão com antecipação de ameaça." },
          { label: "Anedonia", tooltip: "Incapacidade de sentir prazer." },
        ],
      },
      {
        name: "Afeto",
        items: [
          { label: "Afeto ressonante / congruente", tooltip: "Expressão afetiva sintônica com o conteúdo e o contexto.", normal: true },
          { label: "Embotamento afetivo", tooltip: "Redução acentuada da expressão emocional." },
          { label: "Labilidade afetiva", tooltip: "Mudanças rápidas e bruscas do afeto." },
          { label: "Incontinência afetiva", tooltip: "Descontrole da expressão emocional, com descargas súbitas." },
          { label: "Afeto inadequado / incongruente", tooltip: "Expressão afetiva dissociada do conteúdo do discurso." },
          { label: "Ambivalência afetiva", tooltip: "Sentimentos opostos coexistindo sobre o mesmo objeto." },
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
          { label: "Sem alterações", tooltip: "Sensopercepção sem alterações.", normal: true },
          { label: "Alucinação auditiva", tooltip: "Percepção sem objeto, modalidade auditiva (vozes)." },
          { label: "Alucinação visual", tooltip: "Percepção sem objeto, modalidade visual." },
          { label: "Alucinação tátil / cenestésica", tooltip: "Percepção sem objeto na pele (tátil) ou nos órgãos internos (cenestésica)." },
          { label: "Alucinação olfativa / gustativa", tooltip: "Percepção sem objeto de cheiros ou sabores." },
          { label: "Alucinose", tooltip: "Alucinação com crítica preservada." },
          { label: "Ilusão", tooltip: "Percepção distorcida de objeto real." },
          { label: "Despersonalização", tooltip: "Sensação de estranheza/irrealidade em relação a si mesmo." },
          { label: "Desrealização", tooltip: "Sensação de estranheza/irrealidade em relação ao ambiente." },
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
          { label: "Curso normal", tooltip: "Curso e forma do pensamento sem alterações.", normal: true },
          { label: "Aceleração / Taquipsiquismo", tooltip: "Pensamento acelerado, fluxo de ideias aumentado." },
          { label: "Lentificação / Bradipsiquismo", tooltip: "Pensamento lento e empobrecido." },
          { label: "Fuga de ideias", tooltip: "Sucessão rápida de ideias com associações frouxas (típico de mania)." },
          { label: "Bloqueio / Interceptação", tooltip: "Interrupção súbita do curso do pensamento." },
          { label: "Afrouxamento de associações", tooltip: "Perda dos nexos lógicos entre as ideias." },
          { label: "Tangencialidade", tooltip: "Respostas que se desviam e não retornam ao ponto." },
          { label: "Circunstancialidade", tooltip: "Excesso de detalhes, mas atinge o objetivo ao final." },
          { label: "Prolixidade", tooltip: "Discurso excessivamente longo e detalhado." },
          { label: "Perseveração", tooltip: "Repetição persistente da mesma ideia ou resposta." },
        ],
      },
      {
        name: "Conteúdo",
        items: [
          { label: "Sem alterações de conteúdo", tooltip: "Conteúdo do pensamento sem alterações.", normal: true },
          { label: "Delírio persecutório", tooltip: "Crença falsa de perseguição, irredutível." },
          { label: "Delírio de grandeza", tooltip: "Crença falsa de poder, riqueza ou importância excepcionais." },
          { label: "Delírio de ruína / culpa", tooltip: "Crença falsa de catástrofe, miséria ou culpa (típico da depressão grave)." },
          { label: "Delírio de referência", tooltip: "Crença de que fatos neutros se referem a si mesmo." },
          { label: "Delírio místico/religioso", tooltip: "Crença falsa de conteúdo religioso ou messiânico." },
          { label: "Ideação obsessiva", tooltip: "Ideias intrusivas, repetitivas e indesejadas, reconhecidas como próprias." },
          { label: "Ideias supervalorizadas", tooltip: "Crença sustentada com intensidade excessiva, mas não francamente delirante." },
          { label: "Ideação suicida", tooltip: "Investigar planejamento e risco (ver C-SSRS)." },
          { label: "Ideação homicida / heteroagressiva", tooltip: "Pensamentos de causar dano a terceiros — avaliar risco." },
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
          { label: "Linguagem normal", tooltip: "Expressão e compreensão verbais preservadas.", normal: true },
          { label: "Logorreia", tooltip: "Fluxo verbal aumentado." },
          { label: "Mutismo", tooltip: "Ausência de fala, sem causa orgânica que a explique." },
          { label: "Disartria", tooltip: "Dificuldade de articulação por alteração motora." },
          { label: "Afasia", tooltip: "Perda da capacidade de produzir/compreender linguagem (lesão cerebral)." },
          { label: "Neologismos", tooltip: "Criação de palavras novas." },
          { label: "Ecolalia", tooltip: "Repetição das palavras do interlocutor." },
          { label: "Parafasias", tooltip: "Troca de sons ou de palavras na fala." },
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
          { label: "Orientado em tempo e espaço", tooltip: "Orientação temporal e espacial preservadas.", normal: true },
          { label: "Desorientação temporal", tooltip: "Dificuldade em situar-se quanto a data, hora e dia." },
          { label: "Desorientação espacial", tooltip: "Dificuldade em situar-se quanto ao local onde está." },
          { label: "Desorientação autopsíquica", tooltip: "Quanto à própria identidade." },
        ],
      },
      {
        name: "Memória",
        items: [
          { label: "Memória preservada", tooltip: "Funções de fixação e evocação preservadas.", normal: true },
          { label: "Amnésia anterógrada", tooltip: "Dificuldade de fixar novas memórias." },
          { label: "Amnésia retrógrada", tooltip: "Perda de memórias anteriores ao evento/doença." },
          { label: "Hipomnésia", tooltip: "Redução global da capacidade de memória." },
          { label: "Confabulação", tooltip: "Preenchimento de lacunas com falsas memórias." },
          { label: "Déjà vu / Jamais vu", tooltip: "Falsos reconhecimentos: sensação de já ter vivido (déjà vu) ou de estranheza do familiar (jamais vu)." },
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
          { label: "Atos impulsivos", tooltip: "Atos súbitos, sem deliberação, com falha do controle." },
          { label: "Negativismo", tooltip: "Resistência ou oposição ativa a comandos e estímulos." },
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
          { label: "Prejuízo leve do pragmatismo", tooltip: "Discreta redução do desempenho funcional cotidiano." },
          { label: "Prejuízo moderado", tooltip: "Comprometimento significativo das atividades cotidianas." },
          { label: "Prejuízo grave / Incapacidade funcional", tooltip: "Incapacidade de manter atividades básicas e funcionais." },
          { label: "Isolamento social", tooltip: "Retração do convívio e das relações interpessoais." },
          { label: "Abandono de atividades laborais/estudo", tooltip: "Interrupção do trabalho ou dos estudos." },
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
          { label: "Atenção preservada", tooltip: "Tenacidade e vigilância da atenção preservadas.", normal: true },
          { label: "Hipoprosexia", tooltip: "Redução da atenção." },
          { label: "Hiperprosexia", tooltip: "Atenção exacerbada, focada de forma excessiva." },
          { label: "Distraibilidade", tooltip: "Atenção facilmente desviada (tenacidade baixa)." },
          { label: "Aprosexia", tooltip: "Abolição da atenção." },
          { label: "Dificuldade de concentração", tooltip: "Redução da capacidade de sustentar o foco." },
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
          { label: "Aparentemente preservada / média", tooltip: "Funcionamento intelectual estimado na média.", normal: true },
          { label: "Acima da média", tooltip: "Funcionamento intelectual estimado acima da média." },
          { label: "Abaixo da média", tooltip: "Funcionamento intelectual estimado abaixo da média." },
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
          { label: "Sem traços disfuncionais evidentes", tooltip: "Sem padrões de personalidade disfuncionais aparentes.", normal: true },
          { label: "Traços paranoides", tooltip: "Desconfiança e suspeição persistentes." },
          { label: "Traços esquizoides / esquizotípicos", tooltip: "Distanciamento afetivo e/ou excentricidade e isolamento." },
          { label: "Traços borderline / emocionalmente instáveis", tooltip: "Instabilidade afetiva, impulsividade e medo de abandono." },
          { label: "Traços histriônicos", tooltip: "Busca de atenção e emotividade excessivas." },
          { label: "Traços narcisistas", tooltip: "Grandiosidade, necessidade de admiração e baixa empatia." },
          { label: "Traços antissociais", tooltip: "Desrespeito a normas e aos direitos alheios." },
          { label: "Traços evitativos / dependentes", tooltip: "Inibição por medo de rejeição e/ou necessidade excessiva de amparo." },
          { label: "Traços anancásticos / obsessivos", tooltip: "Perfeccionismo, rigidez e preocupação com ordem e controle." },
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
          { label: "Insight ausente", tooltip: "Não reconhece estar doente nem a necessidade de tratamento." },
          { label: "Anosognosia", tooltip: "Ausência de reconhecimento do déficit/doença." },
          { label: "Juízo crítico prejudicado", tooltip: "Falha na capacidade de avaliar a realidade e tomar decisões adequadas." },
        ],
      },
    ],
  },
];

export function getDomain(id: string): DomainDef | undefined {
  return DOMAINS.find((d) => d.id === id);
}
