# SOPsi 2.0 — Registro Clínico Estruturado em Saúde Mental

Aplicação web para profissionais de saúde mental (psiquiatras, psicólogos, equipes de CAPS).
Integra coleta de dados clínicos, semiologia psiquiátrica estruturada, escalas psicométricas,
inteligência artificial (OpenAI) e geração de documentos — num **wizard guiado de 25 etapas**.

> ⚠️ Apoio à decisão clínica. As sugestões de IA podem conter erros; **a decisão final é sempre
> do profissional responsável.**

---

## Índice

- [Quais variáveis de ambiente configurar](#quais-variáveis-de-ambiente-configurar)
- [Como o app funciona (visão geral)](#como-o-app-funciona-visão-geral)
- [Fluxo de uso passo a passo](#fluxo-de-uso-passo-a-passo)
- [Funcionalidades em detalhe](#funcionalidades-em-detalhe)
- [Inteligência Artificial](#inteligência-artificial)
- [Segurança e autenticação](#segurança-e-autenticação)
- [Stack](#stack)
- [Desenvolvimento / Build / Testes](#desenvolvimento)
- [Deploy](#deploy)
- [Arquitetura de dados](#arquitetura-de-dados)

---

## Quais variáveis de ambiente configurar

Copie `.env.example` para `.env` (local) e configure as mesmas no painel do Railway (**Variables**).

### Mínimo para subir em produção

Estas **4** já deixam o app funcional e seguro:

```bash
DATABASE_URL=postgresql://user:senha@ep-xxx.neon.tech/neondb?sslmode=require   # Neon (Postgres)
OPENAI_API_KEY=sk-...                                                          # IA
AUTH_USERS=dra.ana@clinica.com:SenhaForte!23,dr.bruno@clinica.com:Outra#456    # login
JWT_SECRET=<saída de: openssl rand -hex 32>                                    # assina os tokens (>=32 chars)
```

### Tabela completa

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | **sim** (persistência) | String de conexão Neon (Postgres) com `sslmode=require` |
| `OPENAI_API_KEY` | **sim** (IA) | Chave da API OpenAI |
| `AUTH_USERS` | **sim** (produção) | Profissionais autorizados, `email:senha` separados por vírgula. **Vazio = API sem autenticação.** |
| `JWT_SECRET` | **sim** (produção) | Segredo p/ assinar tokens (**≥32 chars**, ex.: `openssl rand -hex 32`). Ausente/curto = segredo efêmero (desloga a cada boot). |
| `OPENAI_MODEL` | não | Modelo de texto (padrão `gpt-4o`) |
| `OPENAI_TRANSCRIBE_MODEL` | não | Modelo de transcrição de áudio (padrão `whisper-1`) |
| `AUTH_TOKEN_TTL` | não | Validade do token em segundos (padrão `43200` = 12h) |
| `CORS_ORIGIN` | não | Origens permitidas (lista por vírgula). Vazio = somente same-origin (recomendado) |
| `ADMIN_USERS` | recomendada (multiusuário) | Administradores: veem a trilha de auditoria completa e podem **apagar todos os dados** (LGPD). Regra de default na seção de Segurança. |
| `MOSP_AUTHORS` | não | E-mails com permissão de escrita no MOSP. Vazio = qualquer usuário autenticado |
| `PORT` | não | Porta do servidor (o Railway injeta automaticamente) |
| `NODE_ENV` | não | `production` em produção |
| `HELMET_CSP` | não | Defina `off` **apenas** para diagnosticar quebras de CSP (não use em produção) |

> **Boot gracioso:** o app **sobe mesmo sem credenciais**. Sem `DATABASE_URL` os endpoints de dados
> retornam `503` com mensagem clara; sem `OPENAI_API_KEY` os recursos de IA retornam `503` sem
> quebrar o app; sem `AUTH_USERS` a API fica **aberta** (apenas para dev local — um aviso é emitido
> no console). As migrations do banco rodam automaticamente no startup (idempotentes).

---

## Como o app funciona (visão geral)

O SOPsi é uma aplicação **full-stack** servida por um único processo Node/Express:

- O **Express** (`server/`) serve o frontend compilado (`app/build`) **e** expõe a API em `/api/*`.
- O **frontend React** (`app/`) é uma SPA: tela de login → lista de pacientes → wizard do exame.
- Os dados clínicos de cada exame ficam numa coluna **JSONB** no Postgres (Neon). Cada módulo do
  wizard é "dono" de uma fatia desse JSON e salva **automaticamente** (autosave) ao editar.
- A **IA (OpenAI)** é sempre chamada pelo backend (a chave nunca vai ao navegador), com injeção
  opcional de diretrizes clínicas (MOSP) e *disclaimers* por tarefa.

Por ser full-stack, o app precisa de um host que **execute o Node** (ex.: Railway). Hospedagem
estática pura (ex.: Netlify sem functions) não roda a API e exibiria "Page not found".

---

## Fluxo de uso passo a passo

1. **Login** — em produção (com `AUTH_USERS`), a tela de login aparece automaticamente. O e-mail do
   profissional passa a assinar toda a trilha de auditoria.
2. **Pacientes** — cadastre um paciente (nome + ID/prontuário opcional) ou localize pela busca
   *full-text* (nome, sintomas, diagnóstico, conteúdo da anamnese).
3. **Novo exame** — a partir do paciente, inicie um exame e percorra o **wizard de 25 etapas**.
   Cada etapa salva sozinha; é possível navegar livremente entre elas pela trilha lateral.
4. **Coleta e semiologia** — Anamnese (com voz/IA) → Fenomenologia → 16 domínios do Exame
   Psicopatológico → Súmula → Escalas.
5. **Conclusão** — Diagnóstico (com triangulação por IA) → PTS → Relatórios/Laudos (gera PDF).
6. **Ferramentas de IA** — Auditoria de PDFs (perguntar sobre documentos enviados) e Psi Assistente
   (chat clínico do caso).
7. **Histórico** — todos os exames do paciente ficam acessíveis; o exame pode ser marcado como
   *concluído*.
8. **Governança** — MOSP (diretrizes da IA), Log de Auditoria e Dados & Privacidade (LGPD).

---

## Funcionalidades em detalhe

### 1. Gestão de pacientes
- Cadastro com **nome** e **ID externo/prontuário** (permite usar apenas iniciais por LGPD).
- **Busca full-text** que varre nome, ID, resumo e até o conteúdo JSON dos exames (anamnese,
  achados, diagnóstico).
- **Histórico de exames** por paciente, com status (*em andamento* / *concluído*) e datas.

### 2. Wizard de 25 etapas
Organizado em 4 grupos — **Clínico → Síntese → Conclusão → IA** — com trilha lateral, navegação
livre e **autosave por etapa**.

| # | Etapa | Grupo |
|---|---|---|
| 1 | Anamnese | Clínico |
| 2 | Fenomenologia | Clínico |
| 3–18 | 16 domínios do Exame Psicopatológico | Clínico |
| 19 | Súmula Geral | Síntese |
| 20 | Escalas | Síntese |
| 21 | Diagnóstico | Conclusão |
| 22 | PTS — Projeto Terapêutico Singular | Conclusão |
| 23 | Relatórios e Laudos | Conclusão |
| 24 | Auditoria de PDFs (IA) | IA |
| 25 | Psi Assistente (IA) | IA |

#### Anamnese (etapa 1)
Campos estruturados: identificação, queixa principal, HDA, história patológica pregressa, alergias,
medicações, história familiar, pessoal/social, hábitos, exames complementares, exame físico e exame
psíquico. Inclui seletor de **contexto de atendimento** (Consultório, Ambulatório, CAPS I/II/III/AD/i,
UBS, Emergência, Internação, Interconsulta, Hospital Dia, Visita Domiciliar, Residência Terapêutica).
Conta com **transcrição por voz** e **"Sintetizar e Preencher"** (IA) para transformar texto livre
em campos estruturados.

#### Fenomenologia (etapa 2)
Registro da vivência subjetiva e da compreensão fenomenológica do caso, complementando a semiologia.

#### Exame Psicopatológico — 16 domínios (etapas 3–18)
Cada domínio é *data-driven* (seleção de achados com **tooltips** de definição + observações livres),
com botão **"Preencher Exame Normal"** que marca os achados normais de uma vez. Domínios:
Consciência, Aparência, Atitude, Psicomotricidade, Contato/Rapport, Afetividade (humor e afeto),
Sensopercepção, Pensamento (curso/forma e conteúdo), Linguagem, Memória e Orientação, Vontade,
Pragmatismo, Atenção/Concentração, Inteligência, Personalidade e Consciência de Morbidade (insight).

#### Súmula Geral (etapa 19)
Consolida os achados do exame psicopatológico (com busca por domínio/achado) e permite escrever a
**interpretação semiológica** integrada.

#### Escalas psicométricas (etapa 20)
**21 escalas** aplicáveis por um *runner* genérico, com pontuação automática, **faixas de gravidade**
coloridas e observações de segurança. Disponíveis: **PANSS, BPRS, HAM-D17, BARS, PANSS-6, SANS, SAPS,
ASRM/Altman, PANSS-EC, Y-BOCS, GDS-15, PHQ-9, MADRS, GAD-7, YMRS, BDRS, BACS, C-SSRS, MMSE, MoCA, NPI.**

#### Diagnóstico (etapa 21)
Campos para hipótese **sindrômica**, caracterização de curso, hipótese **nosológica** (CID-11 /
DSM-5-TR com código), diagnósticos **diferenciais** (a favor / contra) e justificativa. Inclui
**"Triangular (IA)"**, que cruza achados do exame, escalas e súmula para sugerir hipóteses — sempre
com *disclaimer*.

#### PTS — Projeto Terapêutico Singular (etapa 22)
Plano de cuidado com ações, responsáveis e prazos; aceita **proposta de PTS por IA** para apoio.

#### Relatórios e Laudos (etapa 23)
Geração de documentos a partir de **modelos com placeholders** (`{{paciente}}`, `{{data}}`,
`{{diagnostico}}`, `{{nosologico}}`, `{{conduta}}`, `{{medico}}`, `{{crm}}`, etc.). **6 modelos
pré-instalados**: Atestado de Saúde Mental (padrão e simples), Laudo Médico Pericial (completo),
Encaminhamento, Laudo para Animal de Suporte Emocional e Relatório Clínico (Anamnese). Também é
possível **criar modelos próprios**. Exporta em **PDF** (jsPDF + autotable); campos de profissional
(nome/CRM) editáveis no topo.

#### Auditoria de PDFs por IA (etapa 24)
**Upload de PDFs** (ex.: relatórios anteriores), extração do texto no navegador (pdf.js) e
**perguntas à IA** sobre os documentos (medicações listadas, histórico de internações, etc.).

#### Psi Assistente (etapa 25)
**Chat clínico** ("Auditor Clínico") com o contexto do caso, para tirar dúvidas, revisar raciocínio
e checar pontos do atendimento.

### 3. MOSP — Memória Operacional SOPsi
Memórias clínicas em **Markdown** com **gatilhos** (palavras-chave). Quando o texto da consulta
casa com um gatilho, a memória é injetada no *prompt* da IA como diretriz. Vem com **padrões
pré-carregados** (Risco Suicida, Psicose, Mania/Hipomania, Catatonia) via "Semear Padrões". A
**escrita** pode ser restrita a `MOSP_AUTHORS`.

### 4. Auditoria e LGPD
- **Log de auditoria por usuário**: cada ação (CREATE/READ/UPDATE/DELETE) registra o e-mail do
  profissional. São auditados login, leitura de dados de pacientes (inclusive buscas), chamadas de
  IA (metadados) e o apagamento LGPD.
- **Filtros** por tipo de ação e coluna **"Usuário"** na tela.
- **Direito ao esquecimento**: apaga todos os dados clínicos numa transação atômica (com contagens
  do que foi removido), preservando os modelos de laudo pré-instalados.

### 5. Configurações e UX
- **Tema claro/escuro**; **indicador de status online**; **status do sistema** (banco, IA, modelo).
- **Autosave por etapa**; trilha de navegação do wizard; mensagens de erro amigáveis (ex.: `503`
  quando falta banco/IA).

---

## Inteligência Artificial

Toda IA roda no backend (chave protegida). Tarefas suportadas:

| Tarefa | Onde | O que faz |
|---|---|---|
| `synthesize` | Anamnese | Transforma texto livre em campos estruturados |
| `suggest_diagnosis` | Diagnóstico | Sugere hipótese diagnóstica (triangulação) |
| `suggest_differentials` | Diagnóstico | Sugere diagnósticos diferenciais |
| `suggest_pts` | PTS | Propõe ações do projeto terapêutico |
| `audit_pdf` | Auditoria de PDFs | Responde perguntas sobre documentos enviados |
| `chat` | Psi Assistente | Chat clínico do caso |
| `insights` | (geral) | Análises/insights de apoio |
| transcrição | Anamnese | Voz → texto (Whisper / `gpt-4o-transcribe`) |

- **MOSP**: tarefas clínicas (diagnóstico, diferenciais, PTS, chat, insights) recebem as diretrizes
  do MOSP cujos gatilhos aparecem no texto.
- **Disclaimers**: respostas sensíveis trazem aviso de que a decisão é do profissional.

---

## Segurança e autenticação

- **Login obrigatório em produção:** defina `AUTH_USERS` (lista de `email:senha`). Todas as rotas
  `/api/*` (exceto `/api/health`, `/api/auth/config` e `/api/auth/login`) passam a exigir um token
  Bearer válido. O frontend exibe a tela de login automaticamente quando `authRequired = true`.
- **Tokens:** assinados (HS256) com `JWT_SECRET` (≥32 chars), validade configurável
  (`AUTH_TOKEN_TTL`). Sem dependências externas — apenas o módulo `crypto` do Node. Respostas `401`
  deslogam o cliente.
- **Hardening HTTP:** `helmet` (com CSP afinada para o SPA), `express-rate-limit` (login, IA e API
  geral) e CORS restrito a same-origin por padrão (`CORS_ORIGIN='*'` é rejeitado com aviso).
- **Administradores (`ADMIN_USERS`):** veem a trilha de auditoria completa (os demais veem só as
  próprias ações) e são os **únicos** que podem executar o apagamento global de dados
  (`/privacy/wipe`). Regra de default quando `ADMIN_USERS` está vazio: em **modo aberto** (dev) ou
  **usuário único**, esse usuário é admin; com **múltiplos** profissionais e sem `ADMIN_USERS`,
  **ninguém** é admin — defina `ADMIN_USERS` para liberar ações destrutivas.
- **MOSP:** escrita nas memórias clínicas pode ser restrita a `MOSP_AUTHORS`.

> ⚠️ **Transferência internacional (LGPD):** os recursos de IA enviam o conteúdo clínico para a
> OpenAI (EUA). Cada chamada é auditada (metadados). Garanta base legal/consentimento e o mecanismo
> de transferência (ex.: cláusulas contratuais-padrão) antes de usar a IA com dados reais.

### Decisões e limitações conhecidas

- **Senhas em `AUTH_USERS`:** ficam no ambiente (modelo "cofre do operador", estilo htpasswd) e são
  comparadas em tempo constante. Proteja o env (nunca commitar; restringir acesso no Railway).
- **Token em `localStorage`:** padrão para SPAs com token Bearer. O risco de XSS é mitigado pela CSP
  estrita (`script-src`/`connect-src 'self'`). Migrar para cookies `HttpOnly` exigiria proteção CSRF.
- **Criptografia em repouso:** o conteúdo clínico (JSONB) depende da criptografia em repouso do
  provedor (o **Neon criptografa os dados em repouso por padrão**). Criptografia em nível de coluna
  (pgcrypto) não foi adotada porque inviabilizaria a busca full-text sobre `exams.data`.

### Checklist de produção

1. `AUTH_USERS` definido com senhas fortes e únicas.
2. `JWT_SECRET` aleatório e estável (`openssl rand -hex 32`).
3. `ADMIN_USERS` definido em instalações com mais de um profissional.
4. `DATABASE_URL` (Neon) configurado e com backups habilitados.
5. `CORS_ORIGIN` vazio (same-origin) ou restrito às origens necessárias.
6. HTTPS na borda (o Railway já fornece TLS).

---

## Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS (pasta `app/`, builda para `app/build`)
- **Backend:** Express (TypeScript, executado via `tsx`) — pasta `server/`
- **Banco:** PostgreSQL (Neon) via `pg` — modelo JSONB por exame
- **IA:** OpenAI (chat, transcrição de áudio, síntese, sugestões)
- **Servir junto:** o Express serve `app/build` estático + fallback SPA + rotas `/api/*`
- **Deploy:** Railway

---

## Desenvolvimento

```bash
# instalar dependências (raiz = backend; app = frontend)
npm install
npm --prefix app install

# rodar backend (8080) + frontend (Vite 5173 com proxy /api) juntos
npm run dev

# ou separadamente:
npm run dev:server
npm run dev:app
```

Frontend dev em `http://localhost:5173` (faz proxy de `/api` para o Express em `:8080`).

## Build e produção

```bash
npm run build   # instala e builda o app/ -> app/build
npm start       # Express serve app/build + /api  (porta $PORT ou 8080)
```

## Testes

```bash
npm test           # testes do backend (Vitest): autenticação + integração da API
npm run test:app   # testes do frontend (Vitest): utilitários + pontuação de escalas
npm run test:all   # ambos
```

Os testes não exigem banco nem OpenAI (usam os caminhos de degradação graciosa).
O pipeline de **CI** (`.github/workflows/ci.yml`) roda typecheck, testes e build a cada push/PR.

## Deploy

### Railway (recomendado — já configurado)
O `railway.json` já define **Build:** `npm install --include=dev && npm run build` e
**Start:** `npm start`. Passos:

1. Railway → **New Project → Deploy from GitHub** → selecione este repositório.
2. Em **Variables**, configure ao menos `DATABASE_URL`, `OPENAI_API_KEY`, `AUTH_USERS`, `JWT_SECRET`
   (e `ADMIN_USERS` se houver mais de um profissional).
3. Deploy. O Railway fornece a URL pública com HTTPS; o Express serve frontend + API juntos.

> O banco Neon pode ser provisionado no próprio Neon (recomendado) ou via integração.

### Hospedagem estática (ex.: Netlify)
**Não funciona como está**: o SOPsi tem um backend Express (banco, auth, IA). Hospedagem estática
serve apenas arquivos e não roda a API — resultaria em "Page not found" e falha das chamadas `/api`.
Seria necessário separar o frontend e converter a API em *functions* (refatoração).

---

## Arquitetura de dados

Cada exame guarda seu conteúdo clínico numa coluna **JSONB** (`exams.data`). Cada módulo do wizard
é "dono" de uma fatia desse JSON (ver `app/src/modules/sliceKeys.ts`) e a acessa de forma tipada com
o hook `useExamSlice<T>(chave, defaults)`. Isso permite evoluir módulos de forma independente, sem
migrations por módulo. O autosave faz *merge* no topo do JSON (`data = data || patch`).

Tabelas: `patients`, `exams` (FK + `ON DELETE CASCADE`), `audit_log` (com `actor`), `mosp_memories`
e `report_templates`. As migrations são idempotentes e rodam no startup.
