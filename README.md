# SOPsi 2.0 — Registro Clínico Estruturado em Saúde Mental

Aplicação web para profissionais de saúde mental (psiquiatras, psicólogos, equipes de CAPS).
Integra coleta de dados clínicos, semiologia psiquiátrica estruturada, escalas psicométricas,
inteligência artificial (OpenAI) e geração de documentos — num wizard guiado de **25 etapas**.

> ⚠️ Apoio à decisão clínica. As sugestões de IA podem conter erros; **a decisão final é sempre
> do profissional responsável.**

## Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS (pasta `app/`, builda para `app/build`)
- **Backend:** Express (TypeScript, executado via `tsx`) — pasta `server/`
- **Banco:** PostgreSQL (Neon) via `pg` — modelo JSONB por exame
- **IA:** OpenAI (chat, transcrição de áudio, síntese, sugestões)
- **Servir junto:** o Express serve `app/build` estático + fallback SPA + rotas `/api/*`
- **Deploy:** Railway

## Funcionalidades

- **Pacientes:** cadastro, busca full-text (nome, sintomas, diagnóstico, conteúdo da anamnese), histórico de exames.
- **Wizard de 25 etapas:** Anamnese → Fenomenologia → 16 domínios do Exame Psicopatológico →
  Súmula Geral → Escalas → Diagnóstico → PTS → Relatórios/Laudos → Auditoria de PDFs (IA) → Psi Assistente (IA).
- **Escalas (21):** PANSS, BPRS, HAM-D17, BARS, PANSS-6, SANS, SAPS, ASRM/Altman, PANSS-EC, Y-BOCS,
  GDS-15, PHQ-9, MADRS, GAD-7, YMRS, BDRS, BACS, C-SSRS, MMSE, MoCA, NPI.
- **IA:** transcrição por voz, "Sintetizar e Preencher", sugestão diagnóstica/diferenciais, propostas de PTS,
  análise de interações, auditoria de PDFs e chat clínico (Auditor Clínico).
- **MOSP:** memórias clínicas em Markdown injetadas na IA por gatilhos (padrões: Risco Suicida, Psicose, Mania, Catatonia).
- **Autenticação:** login por e-mail/senha com token assinado; rotas `/api/*` protegidas; rate-limiting e `helmet`.
- **LGPD:** trilha de auditoria **por usuário**, consentimento e direito ao esquecimento (apagar todos os dados).
- Tema claro/escuro; indicador de status online; autosave por etapa.

## Variáveis de ambiente

Copie `.env.example` para `.env` (local) e configure no Railway. Veja descrições em `.env.example`:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim (persistência) | String de conexão Neon (Postgres) com `sslmode=require` |
| `OPENAI_API_KEY` | sim (IA) | Chave da API OpenAI |
| `OPENAI_MODEL` | não | Modelo de texto (padrão `gpt-4o`) |
| `OPENAI_TRANSCRIBE_MODEL` | não | Modelo de transcrição (padrão `whisper-1`) |
| `AUTH_USERS` | **sim (produção)** | Profissionais autorizados, `email:senha` separados por vírgula. **Vazio = API sem autenticação.** |
| `JWT_SECRET` | sim (produção) | Segredo p/ assinar tokens (≥16 chars). Ausente = segredo efêmero (desloga a cada boot). |
| `AUTH_TOKEN_TTL` | não | Validade do token em segundos (padrão `43200` = 12h) |
| `CORS_ORIGIN` | não | Origens permitidas (lista). Vazio = somente same-origin (recomendado) |
| `MOSP_AUTHORS` | não | E-mails com escrita no MOSP. Vazio = qualquer usuário autenticado |
| `PORT` | não | Porta do servidor (Railway injeta automaticamente) |

> O app **sobe mesmo sem credenciais** (boot gracioso): sem `DATABASE_URL` os endpoints de dados
> retornam 503 com mensagem clara; sem `OPENAI_API_KEY` os recursos de IA retornam 503 sem quebrar o app;
> sem `AUTH_USERS` a API fica **aberta** (apenas para dev local — um aviso é emitido no console).
> As migrations do banco rodam automaticamente no startup (idempotentes).

## Segurança e autenticação

- **Login obrigatório em produção:** defina `AUTH_USERS` (lista de `email:senha`). Todas as rotas
  `/api/*` (exceto `/api/health`, `/api/auth/config` e `/api/auth/login`) passam a exigir um token
  Bearer válido. O frontend exibe a tela de login automaticamente quando `authRequired = true`.
- **Tokens:** assinados (HS256) com `JWT_SECRET`, validade configurável (`AUTH_TOKEN_TTL`). Sem
  dependências externas — apenas o módulo `crypto` do Node. Respostas `401` deslogam o cliente.
- **Hardening HTTP:** `helmet` (com CSP afinada para o SPA), `express-rate-limit` (login, IA e API
  geral) e CORS restrito a same-origin por padrão (`CORS_ORIGIN='*'` é rejeitado com aviso).
- **Trilha de auditoria por usuário:** cada ação (CREATE/READ/UPDATE/DELETE) registra o e-mail do
  profissional (`audit_log.actor`). São auditados também: **login**, **leitura de dados de pacientes**
  (inclusive buscas), **chamadas de IA** (metadados — tarefa/modelo/ator, nunca o conteúdo) e o
  **apagamento LGPD** (com contagens do que foi removido, em transação atômica).
- **Acesso à trilha (RBAC):** com `AUDIT_ADMINS` definido, apenas os listados veem o log completo;
  os demais veem somente as próprias ações.
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
3. `DATABASE_URL` (Neon) configurado e com backups habilitados.
4. `CORS_ORIGIN` vazio (same-origin) ou restrito às origens necessárias.
5. HTTPS na borda (Railway já fornece TLS).

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

## Deploy no Railway

O `railway.json` já define:
- **Build:** `npm install && npm run build`
- **Start:** `npm start`

Configure as variáveis de ambiente (acima) no painel do Railway. O banco Neon pode ser
provisionado no próprio Neon (recomendado) ou via integração.

## Arquitetura de dados

Cada exame guarda seu conteúdo clínico numa coluna **JSONB** (`exams.data`). Cada módulo do wizard
é "dono" de uma fatia desse JSON (ver `app/src/modules/sliceKeys.ts`) e a acessa de forma tipada com
o hook `useExamSlice<T>(chave, defaults)`. Isso permite evoluir módulos de forma independente, sem
migrations por módulo. O autosave faz *merge* no topo do JSON (`data = data || patch`).
