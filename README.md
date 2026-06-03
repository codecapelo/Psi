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
- **LGPD:** trilha de auditoria, consentimento e direito ao esquecimento (apagar todos os dados).
- Tema claro/escuro; indicador de status online; autosave por etapa.

## Variáveis de ambiente

Copie `.env.example` para `.env` (local) e configure no Railway. Veja descrições em `.env.example`:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim (persistência) | String de conexão Neon (Postgres) com `sslmode=require` |
| `OPENAI_API_KEY` | sim (IA) | Chave da API OpenAI |
| `OPENAI_MODEL` | não | Modelo de texto (padrão `gpt-4o`) |
| `OPENAI_TRANSCRIBE_MODEL` | não | Modelo de transcrição (padrão `whisper-1`) |
| `PORT` | não | Porta do servidor (Railway injeta automaticamente) |

> O app **sobe mesmo sem credenciais** (boot gracioso): sem `DATABASE_URL` os endpoints de dados
> retornam 503 com mensagem clara; sem `OPENAI_API_KEY` os recursos de IA retornam 503 sem quebrar o app.
> As migrations do banco rodam automaticamente no startup (idempotentes).

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
