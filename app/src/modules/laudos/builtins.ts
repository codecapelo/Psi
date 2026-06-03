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
];
