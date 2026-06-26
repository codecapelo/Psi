// ==========================================================================
// SOPsi 2.0 — Modelos de Laudo Pré-instalados (Builtins)
//
// Placeholders disponíveis:
//   {{paciente}}    — Nome completo do paciente
//   {{idExterno}}   — ID externo / prontuário
//   {{data}}        — Data atual formatada (dd/mm/yyyy)
//   {{contexto}}    — Local do atendimento (ex.: Consultório Particular)
//   {{queixa}}      — Queixa principal (QP)
//   {{hda}}         — História da doença atual (HDA)
//   {{diagnostico}} — Hipótese diagnóstica sindrômica
//   {{nosologico}}  — Hipótese nosológica (DSM/CID) com código
//   {{cid}}         — Mesmo que {{nosologico}} (código CID/DSM-5-TR)
//   {{conduta}}     — Orientações / conduta (PTS)
//   {{medico}}      — Nome do profissional responsável (editável no topo)
//   {{crm}}         — CRM do profissional responsável (editável no topo)
//   --- Dados cadastrais do paciente (cadastro) ---
//   {{nascimento}}  — Data de nascimento (dd/mm/yyyy)
//   {{idade}}       — Idade em anos (derivada do nascimento)
//   {{sexo}}        — Sexo / gênero
//   {{cpf}} {{rg}}  — Documentos
//   {{nomeMae}}     — Filiação (nome da mãe)
//   {{nacionalidade}} {{naturalidade}} {{estadoCivil}}
//   {{profissao}} {{escolaridade}} {{endereco}} {{telefone}}
// ==========================================================================

export interface BuiltinTemplate {
  id: string;
  name: string;
  recommended?: boolean;
  body: string;
}

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  // --------------------------------------------------------------------------
  // 1. Atestado Padrão (RECOMENDADO)
  // --------------------------------------------------------------------------
  {
    id: "atestado_padrao",
    name: "Atestado de Saúde Mental",
    recommended: true,
    body: `ATESTADO DE SAÚDE MENTAL

Atesto, para os devidos fins, que o(a) paciente {{paciente}} (prontuário / ID: {{idExterno}}) encontra-se sob meus cuidados psiquiátricos na(o) {{contexto}}, sendo acompanhado(a) regularmente.

Com base na avaliação clínica realizada em {{data}}, constata-se que o(a) paciente apresenta {{diagnostico}}, classificado(a) segundo a CID-11 / DSM-5-TR como:

{{nosologico}}

Em decorrência do quadro clínico descrito, recomenda-se:

{{conduta}}

Este atestado é emitido a pedido do(a) próprio(a) paciente, com finalidade médico-legal, e deve ser avaliado pelo órgão ou instituição competente.

{{contexto}}, {{data}}.

_________________________________________
{{medico}}
CRM: {{crm}}
Médico(a) Psiquiatra`,
  },

  // --------------------------------------------------------------------------
  // 2. Atestado Simples
  // --------------------------------------------------------------------------
  {
    id: "atestado_simples",
    name: "Atestado de Saúde Mental (Simples)",
    body: `ATESTADO MÉDICO

Atesto que {{paciente}} (ID: {{idExterno}}) esteve sob avaliação psiquiátrica em {{data}}, na(o) {{contexto}}.

Diagnóstico: {{nosologico}}.

{{contexto}}, {{data}}.

_________________________________________
{{medico}}
CRM: {{crm}}`,
  },

  // --------------------------------------------------------------------------
  // 3. Laudo Médico Pericial (INSS — Modelo Completo)
  // --------------------------------------------------------------------------
  {
    id: "laudo_pericial",
    name: "Laudo Médico Pericial (Modelo Completo)",
    body: `LAUDO MÉDICO PERICIAL — PSIQUIATRIA

I — IDENTIFICAÇÃO DO PERICIANDO
Nome: {{paciente}}
Data de nascimento: {{nascimento}} ({{idade}} anos)    Sexo: {{sexo}}
CPF: {{cpf}}    RG: {{rg}}    Estado civil: {{estadoCivil}}
Filiação (mãe): {{nomeMae}}
Naturalidade: {{naturalidade}}    Nacionalidade: {{nacionalidade}}
Profissão: {{profissao}}    Escolaridade: {{escolaridade}}
Endereço: {{endereco}}    Telefone: {{telefone}}
Prontuário / ID: {{idExterno}}
Data da Perícia: {{data}}
Local: {{contexto}}

II — MÉDICO RESPONSÁVEL PELA PERÍCIA
Nome: {{medico}}
CRM: {{crm}}

III — MOTIVO DO PEDIDO
Avaliação pericial de capacidade laborativa para fins previdenciários (INSS / BPC-LOAS), a pedido do próprio periciando ou representante legal.

IV — QUEIXA PRINCIPAL
{{queixa}}

V — HISTÓRIA DA DOENÇA ATUAL
{{hda}}

VI — HIPÓTESE DIAGNÓSTICA SINDRÔMICA
{{diagnostico}}

VII — DIAGNÓSTICO NOSOLÓGICO (CID-11 / DSM-5-TR)
{{nosologico}}

VIII — CONDUTA E PLANO TERAPÊUTICO
{{conduta}}

IX — CONCLUSÃO PERICIAL
Com base na avaliação clínico-psiquiátrica realizada nesta data, nos documentos apresentados e na história clínica relatada, opina-se que o(a) periciando(a) apresenta quadro compatível com incapacidade para o trabalho/atividades habituais, decorrente da patologia descrita. O presente laudo é emitido com base exclusivamente nos dados disponíveis na avaliação e deve ser complementado por documentação médica adicional, se assim o exigir a autoridade competente.

{{contexto}}, {{data}}.

_________________________________________
{{medico}}
CRM: {{crm}}
Médico(a) Psiquiatra — Perito(a)`,
  },

  // --------------------------------------------------------------------------
  // 4. Encaminhamento / Referência
  // --------------------------------------------------------------------------
  {
    id: "encaminhamento",
    name: "Encaminhamento (Referência)",
    body: `ENCAMINHAMENTO MÉDICO — PSIQUIATRIA

Data: {{data}}
Local de origem: {{contexto}}

Encaminho para avaliação e/ou acompanhamento especializado o(a) paciente: {{paciente}} (ID: {{idExterno}}).

Motivo do encaminhamento: O(a) paciente apresenta {{queixa}}, com evolução descrita a seguir:

{{hda}}

Hipótese diagnóstica atual: {{diagnostico}} — {{nosologico}}.

Conduta em curso / solicitações:

{{conduta}}

Solicito avaliação, continuidade do tratamento e retorno com contra-referência quando possível. Coloco-me à disposição para esclarecimentos adicionais.

Atenciosamente,

_________________________________________
{{medico}}
CRM: {{crm}}
Médico(a) Psiquiatra`,
  },

  // --------------------------------------------------------------------------
  // 5. Laudo ESA — Animal de Suporte Emocional
  // --------------------------------------------------------------------------
  {
    id: "esa",
    name: "Laudo Médico — Animal de Suporte Emocional",
    body: `LAUDO MÉDICO — ANIMAL DE SUPORTE EMOCIONAL (ESA)

Eu, {{medico}}, médico(a) psiquiatra inscrito(a) no CRM sob o número {{crm}}, declaro para os devidos fins que o(a) paciente {{paciente}} (ID: {{idExterno}}) encontra-se sob meus cuidados desde a data de início do acompanhamento psiquiátrico.

Com base na avaliação clínica realizada em {{data}} na(o) {{contexto}}, verifico que o(a) paciente apresenta {{diagnostico}}, classificado(a) como:

{{nosologico}}

Em razão do quadro clínico descrito, o(a) paciente apresenta limitações funcionais e emocionais que impactam seu bem-estar e qualidade de vida. A presença de um Animal de Suporte Emocional (ESA) foi identificada como parte integrante do plano terapêutico, uma vez que oferece suporte afetivo e auxilia na regulação emocional, contribuindo para a redução de sintomas e melhora da adesão ao tratamento.

Plano terapêutico complementar:

{{conduta}}

Este laudo é emitido exclusivamente para fins terapêuticos e habitacionais, conforme legislação vigente, não constituindo isenção de responsabilidades civis relacionadas ao animal.

{{contexto}}, {{data}}.

_________________________________________
{{medico}}
CRM: {{crm}}
Médico(a) Psiquiatra`,
  },

  // --------------------------------------------------------------------------
  // 6. Relatório Clínico (Anamnese)
  // --------------------------------------------------------------------------
  {
    id: "relatorio_clinico",
    name: "Relatório Clínico (Anamnese)",
    body: `RELATÓRIO CLÍNICO — PSIQUIATRIA

Paciente: {{paciente}}
Data de nascimento: {{nascimento}} ({{idade}} anos)    Sexo: {{sexo}}
Prontuário / ID: {{idExterno}}
Data: {{data}}
Local de atendimento: {{contexto}}
Profissional responsável: {{medico}} — CRM: {{crm}}

─────────────────────────────────────────

1. QUEIXA PRINCIPAL
{{queixa}}

2. HISTÓRIA DA DOENÇA ATUAL
{{hda}}

3. DIAGNÓSTICO SINDRÔMICO
{{diagnostico}}

4. HIPÓTESE NOSOLÓGICA (CID-11 / DSM-5-TR)
{{nosologico}}

5. CONDUTA E ORIENTAÇÕES
{{conduta}}

─────────────────────────────────────────

O presente relatório foi elaborado com base na avaliação clínica realizada na data acima e tem caráter informativo para fins de continuidade de cuidado, referência e contra-referência, ou solicitações institucionais pertinentes.

{{contexto}}, {{data}}.

_________________________________________
{{medico}}
CRM: {{crm}}
Médico(a) Psiquiatra`,
  },
  {
    id: "nota_admissao",
    name: "Nota de Admissão (Internação)",
    body: "NOTA DE ADMISSÃO — INTERNAÇÃO PSIQUIÁTRICA / REABILITAÇÃO\n(Documento de entrada — fundamenta a internação, define o estado basal (D0) e a conduta inicial. Peça medicolegal — observar Lei 10.216/2001 e Resolução CFM 2.299/2021.)\n\nPaciente: {{paciente}}\nRegistro/ID externo: {{idExterno}}\nData/hora da admissão: {{data}}\nContexto/unidade: {{contexto}}\n\n1. DADOS ADMINISTRATIVOS\nRegistro/leito: ____\nIdade: {{idade}}    Sexo/gênero: {{sexo}}    Documento: {{cpf}}\n\n2. MODALIDADE E FUNDAMENTAÇÃO LEGAL DA INTERNAÇÃO\nTipo: [voluntária — com termo de consentimento assinado / involuntária — a pedido de terceiro + laudo médico / compulsória — por determinação judicial]\nSolicitante / responsável legal: ____ (parentesco/vínculo)\nFundamentação clínica da indicação: [risco à vida / risco a terceiros / incapacidade de autocuidado / falência do tratamento ambulatorial]\nNotificações: [involuntária → comunicação ao Ministério Público em até 72h / compulsória → nº do processo ____]\n\n3. PROCEDÊNCIA E FONTE DA HISTÓRIA\nProcedência: [domicílio / pronto-socorro / outro serviço]\nEncaminhado por: ____\nAcompanhante na admissão: ____\nFonte/confiabilidade: [paciente / familiar — confiabilidade boa / parcial / prejudicada]\n\n4. MOTIVO DA ADMISSÃO\nQueixa principal (palavras do paciente): {{queixa}}\nMotivo segundo encaminhante/família: ____\n\n5. RESUMO CLÍNICO DE ENTRADA (HDA)\nHistória da doença atual / história recente: {{hda}}\nUso de substâncias (resumo): droga(s) principal(is) ____; último uso: álcool há ____h, ____; padrão atual ____.\nPsiquiátrico relevante: [diagnóstico prévio / internações / tentativa de suicídio prévia] ____\nClínico relevante / comorbidades: ____\nMedicações em uso: ____\nAlergias: [nega / ____]\n\n6. ESTADO À ADMISSÃO (BASAL — D0)\nSinais vitais: PA ____ | FC ____ | FR ____ | Tax ____ | SatO₂ ____ | HGT ____\nSinais de intoxicação/abstinência: [ausentes / intoxicação por ____ / abstinência: tremor, sudorese, ____]\nExame físico dirigido: ____\nEscalas de entrada: CIWA-Ar ____ | COWS ____ | AUDIT/ASSIST (se aplicável) ____\nExame do estado mental (resumido): consciência [vigil / rebaixado]; orientação ____; psicomotricidade ____; pensamento [curso/conteúdo, ideação suicida?] ____; sensopercepção ____; humor/afeto ____; insight [ausente / parcial / preservado]; juízo de realidade ____.\n\n7. AVALIAÇÃO DE RISCO À ENTRADA\nSuicídio/autolesão: [baixo / moderado / alto] — justificativa ____\nHeteroagressividade: [baixo / moderado / alto]\nAbstinência grave (convulsão/DT): [baixo / moderado / alto]\nEvasão: [baixo / moderado / alto]\nNível de vigilância definido: [padrão / reforçada / 1:1]\n\n8. HIPÓTESES DIAGNÓSTICAS INICIAIS\nDiagnóstico (descritivo): {{diagnostico}}\nDiagnóstico nosológico: {{nosologico}}\nCID: {{cid}}\nComorbidade / diferencial (primário vs. induzido por substância, a reavaliar): ____\n\n9. CONDUTA DE ADMISSÃO (ORDENS INICIAIS)\n{{conduta}}\nNível de cuidado: [desintoxicação / observação / unidade fechada]\nDieta / hidratação: ____\nProfilaxias: [tiamina IM/EV antes de glicose / reposição de magnésio / ____]\nFarmacoterapia inicial: [protocolo de BZD guiado por CIWA-Ar / sintomáticos / psicofármaco ____]\nMonitorização: CIWA-Ar/COWS a cada ____h; sinais vitais; vigilância de risco.\nExames solicitados: hemograma, hepatograma, função renal, eletrólitos, magnésio, glicemia, coagulograma, tiamina/B12, sorologias (HIV/HBV/HCV/sífilis), toxicológico urinário, β-hCG (se aplicável), ECG.\nRestrições / cuidados: [retenção de pertences de risco / restrição de visitas / ____]\nPlano psicossocial inicial e orientação à família: ____\n\n10. ITENS MEDICOLEGAIS E ADMINISTRATIVOS\n[Termo de consentimento de internação voluntária assinado] / [Laudo de internação involuntária emitido + comunicação ao MP] / [Determinação judicial anexada]\nTermo de ciência da família: [sim / não]\nInventário de pertences: [sim / não]\nOrientações de segurança registradas: [sim / não]\n\nSÍNTESE DE ADMISSÃO (resumo de uma linha)\nPaciente ____a, [sexo], admitido em internação [modalidade] por [motivo], em [intoxicação/abstinência] de ____, último uso há ____h, CIWA-Ar ____, risco [____]; HD: {{nosologico}} ({{cid}}); iniciada [desintoxicação/conduta ____] com vigilância [____].\n\n_______________________________________\n{{medico}} — CRM {{crm}}\nData: {{data}}",
  },
  {
    id: "evolucao_soap",
    name: "Evolução Diária (SOAP)",
    body: "EVOLUÇÃO DIÁRIA — PRONTUÁRIO PSIQUIÁTRICO\n(Internação Psiquiátrica / Reabilitação — Formato SOAP adaptado)\nDocumento médico — CFM 1.821/2007\n\n==================================================================\n\nIDENTIFICAÇÃO\nPaciente: {{paciente}}\nRegistro/ID: {{idExterno}}\nData/hora: {{data}}\nContexto/Unidade: {{contexto}}\n\nCABEÇALHO DA EVOLUÇÃO\nDia de internação: D+____\nDia de abstinência: D+____ (por substância: álcool D+____, cocaína D+____, outra ____ D+____)\nRegime: [ voluntária / involuntária / compulsória ]\nVigilância: [ padrão / risco de suicídio / risco de evasão / risco de abstinência grave ]\n\n==================================================================\n\nS — SUBJETIVO (últimas 24h, relato do paciente)\nQueixa principal: {{queixa}}\nHistória da doença atual / evolução nas últimas 24h: {{hda}}\nQueixas / como passou a noite: [ sem queixas / refere ____ ]\nSono: [ preservado / fragmentado / insônia ] — ____ h\nApetite / aceitação da dieta: [ bom / reduzido / recusa ]\nFissura (craving): intensidade [ ausente / leve / moderada / intensa ] — gatilho ____\nHumor relatado: [ eutímico / deprimido / ansioso / irritado ]\nAdesão ao tratamento / vínculo terapêutico: [ colaborativo / resistente / recusa parcial ]\nDemandas / queixas relacionais ou familiares: ____\n\n------------------------------------------------------------------\n\nO — OBJETIVO\nSinais vitais: PA ____ | FC ____ | FR ____ | Tax ____ | SatO₂ ____\nExame físico dirigido: tremor [ ausente / fino / grosseiro ]; sudorese [ ausente / presente ]; hidratação ____; demais sistemas conforme necessidade ____\nEscalas seriadas:\n  - CIWA-Ar: ____ (tendência: [ ↓ / estável / ↑ ]) (abstinência alcoólica)\n  - COWS: ____ (abstinência de opioide, se aplicável)\n  - Outras: ____\nEEM do dia (resumido): consciência [ vigil / rebaixada ]; orientação [ preservada / parcial / prejudicada ]; psicomotricidade ____; pensamento (curso ____ / conteúdo ____); sensopercepção [ sem alterações / alucinações ____ ]; afeto ____; insight [ ausente / parcial / preservado ]\nIntercorrências nas últimas 24h: [ nenhuma / ____ ]\nExames novos / resultados: ____\n\n------------------------------------------------------------------\n\nA — AVALIAÇÃO (impressão do dia)\nDiagnóstico (sindrômico): {{diagnostico}}\nDiagnóstico nosológico: {{nosologico}}\nCID: {{cid}}\nDiagnósticos ativos: ____\nEvolução da abstinência: [ em resolução / estável / agravamento ]\nResposta terapêutica: [ favorável / parcial / sem resposta ] a ____\nRisco atualizado:\n  - Suicídio / autolesão: [ baixo / moderado / alto ]\n  - Heteroagressividade: [ baixo / moderado / alto ]\n  - Abstinência grave (convulsão / DT): [ baixo / moderado / alto ]\n  - Evasão: [ baixo / moderado / alto ]\nPendências diagnósticas: [ reavaliar humor/psicose pós-abstinência / ____ ]\n\n------------------------------------------------------------------\n\nP — PLANO / CONDUTA\nConduta do dia: {{conduta}}\nAjuste farmacológico: [ manter esquema / desmame de BZD conforme CIWA-Ar / iniciar ____ / suspender ____ ]\nProfilaxias: [ tiamina mantida / reposição de magnésio / ____ ]\nMonitorização: CIWA-Ar a cada ____ h; sinais vitais; vigilância de risco.\nIntervenções psicossociais do dia: [ entrevista motivacional / grupo / TCC-prevenção de recaída / abordagem familiar ]\nExames a colher / pendentes: ____\nMetas / próximos passos: [ progressão de regime / preparo de alta / encaminhamento CAPS-AD / NA / ____ ]\n\n==================================================================\n\nSÍNTESE (resumo de uma linha):\nPaciente {{paciente}} em D+____ de internação/abstinência, [ estável / melhora / piora ], CIWA-Ar ____ em [ queda / estabilidade / elevação ], risco [ ____ ], conduta: [ ____ ].\n\n------------------------------------------------------------------\n\n_______________________________________\n{{medico}} — CRM {{crm}}\nData: {{data}}",
  },
  {
    id: "sumario_alta",
    name: "Sumário de Alta",
    body: "SUMÁRIO DE ALTA — INTERNAÇÃO PSIQUIÁTRICA / REABILITAÇÃO\n\nDocumento de transição de cuidado e de organização da prevenção de recaída, destinado a permitir que o serviço seguinte (CAPS-AD, ambulatório) compreenda a internação em sua totalidade.\n\nPaciente: {{paciente}}\nRegistro / ID externo: {{idExterno}}\nData do documento: {{data}}\n\n========================================================\n\n1. DADOS ADMINISTRATIVOS E DATAS\nNome/iniciais: {{paciente}}\nIdade: {{idade}}\nRegistro: {{idExterno}}\nAdmissão: ____\nAlta: ____\nTempo de internação: ____ dias\nModalidade da internação: [voluntária / involuntária / compulsória]\nTipo de alta: [médica (melhorada) / a pedido (com termo) / administrativa / por evasão / transferência para ____ / óbito]\n\n2. DIAGNÓSTICOS DE ALTA (finais — CID-11 / DSM-5-TR)\nDiagnóstico principal: {{diagnostico}}\nCID: {{cid}}\nDiagnóstico nosológico / formulação: {{nosologico}}\n1) ____ — [em remissão inicial em ambiente controlado / ____]\n2) ____ (comorbidade) — [confirmado primário / induzido por substância, resolvido]\n3) Comorbidades clínicas: ____\n\n3. MOTIVO DA INTERNAÇÃO (resumo)\nContexto: {{contexto}}\nQueixa: {{queixa}}\nResumo: ____\n\n4. RESUMO DA EVOLUÇÃO DURANTE A INTERNAÇÃO\nHistória da doença atual / evolução: {{hda}}\nDesintoxicação: [concluída sem intercorrências / ____]; tendência das escalas (CIWA-Ar / COWS): de ____ na admissão a ____ na resolução.\nIntercorrências: [nenhuma / ____]\nResposta terapêutica: ____\nReavaliação diagnóstica: componente [de humor / psicótico] reavaliado após abstinência → [persistiu como primário / resolveu, atribuído a substância].\nEngajamento psicossocial: participação em [grupos / TCC-prevenção de recaída / abordagem familiar / entrevista motivacional]; evolução do insight e da motivação [estágio: ____].\n\n5. PROCEDIMENTOS E EXAMES RELEVANTES\nExames de relevância: ____ (ex.: hepatograma; sorologias HIV/HBV/HCV/sífilis — resultado ____).\nProcedimentos: [nenhum / ____].\n\n6. CONDIÇÃO NA ALTA\nClínica: estável, sinais vitais normais, sem sinais de abstinência. [confirmar / ____]\nExame do estado mental (EEM): consciência [vigil], humor [eutímico / ____], afeto ____, pensamento sem alterações, sem ideação suicida ativa, insight [parcial / preservado].\nRisco na alta: suicídio [baixo / ____]; recaída [moderado — ambiente controlado encerrado / ____].\nFuncionalidade / autonomia para autocuidado: [preservada / ____].\n\n7. MEDICAÇÕES DE ALTA (reconciliação medicamentosa)\nMedicação — Dose — Posologia — Duração / orientação:\n- ____ — ____ — ____ — ____\n- ____ — ____ — ____ — ____\n- ____ — ____ — ____ — ____\nMedicações suspensas na alta: ____ (motivo: ____).\nOrientação sobre adesão e efeitos adversos: ____\n\n8. PLANO DE PREVENÇÃO DE RECAÍDA E ORIENTAÇÕES\nConduta / plano terapêutico: {{conduta}}\nGatilhos identificados: ____\nEstratégias de enfrentamento: ____\nSinais precoces de recaída a monitorar: ____\nRede de apoio / suporte familiar: ____\nOrientações de estilo de vida: sono, rotina, evitar ambientes de uso. [____]\n\n9. ENCAMINHAMENTOS E SEGUIMENTO\n[CAPS-AD — agendado para ____] | [NA/AA — grupo indicado] | [Ambulatório de psiquiatria — retorno em ____]\nAcompanhamento clínico de comorbidades: ____\nDocumentos entregues ao paciente/família: [receita / relatório / encaminhamentos / ____].\n\n10. SINAIS DE ALARME (orientação de retorno)\nProcurar atendimento imediato se: retorno do uso com perda de controle, ideação suicida, agitação/agressividade, sintomas de abstinência grave, ____.\n\n11. ITENS MEDICOLEGAIS\n[Internação involuntária → comunicação da alta ao Ministério Público.]\n[Alta a pedido → termo de responsabilidade assinado pelo paciente/responsável, com registro de orientação sobre os riscos.]\n[Evasão → registro circunstanciado + comunicação à família/MP conforme protocolo.]\nObservações: ____\n\n========================================================\n\nSÍNTESE DE ALTA (resumo de uma linha)\nPaciente {{paciente}}, ____ anos, alta [tipo] após ____ dias de internação por ____, com desintoxicação concluída, diagnósticos finais [{{diagnostico}} — {{cid}}], sem ideação suicida ativa, em uso de [medicações], encaminhado a [CAPS-AD / NA / ambulatório] com plano de prevenção de recaída.\n\n________________________________________\n{{medico}} — CRM {{crm}}\nData: {{data}}",
  },
];
