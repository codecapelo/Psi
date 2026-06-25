// ==========================================================================
// Camada de banco de dados — Postgres (Neon) via pg.
// Boot gracioso: se DATABASE_URL não estiver configurada, o servidor sobe
// mesmo assim; chamadas ao banco retornam erro claro (503) sem derrubar o app.
// ==========================================================================

import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

function needsSsl(url?: string): boolean {
  if (!url) return false;
  return url.includes("neon.tech") || url.includes("sslmode=require");
}

export const pool: pg.Pool | null = connectionString
  ? new Pool({
      connectionString,
      ssl: needsSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  : null;

export function hasDb(): boolean {
  return pool !== null;
}

export class DbNotConfiguredError extends Error {
  constructor() {
    super(
      "Banco de dados não configurado. Defina DATABASE_URL (Neon) nas variáveis de ambiente.",
    );
    this.name = "DbNotConfiguredError";
  }
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  if (!pool) throw new DbNotConfiguredError();
  return pool.query<T>(text, params as never[]);
}

/**
 * Executa `fn` dentro de uma transação (BEGIN/COMMIT, ROLLBACK em erro) com um
 * cliente dedicado do pool. Use quando precisar de atomicidade ou `FOR UPDATE`.
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  if (!pool) throw new DbNotConfiguredError();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Registra uma ação na trilha de auditoria (best-effort, nunca lança). */
export async function audit(
  action: "CREATE" | "READ" | "UPDATE" | "DELETE",
  entity: string,
  entityId?: string | null,
  detail?: string | null,
  actor?: string | null,
): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO audit_log (action, entity, entity_id, detail, actor) VALUES ($1,$2,$3,$4,$5)`,
      [action, entity, entityId ?? null, detail ?? null, actor ?? null],
    );
  } catch (err) {
    console.error("[audit] falha ao registrar:", err);
  }
}

const MIGRATIONS = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS patients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  external_id text,
  summary     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'em_andamento',
  context     text,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exams_patient ON exams(patient_id);

-- ==========================================================================
-- Camada longitudinal (2.2): episódios de cuidado + tipo de atendimento.
-- Um episódio agrupa atendimentos (internação = admissão→evoluções→alta;
-- ambulatorial = consultas; consulta = atendimento avulso).
-- ==========================================================================
CREATE TABLE IF NOT EXISTS episodes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tipo        text NOT NULL DEFAULT 'consulta',   -- internacao | ambulatorial | consulta
  status      text NOT NULL DEFAULT 'aberto',     -- aberto | encerrado
  titulo      text,
  opened_at   timestamptz NOT NULL DEFAULT now(),
  closed_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_episodes_patient ON episodes(patient_id);

-- Atendimento ganha tipo + vínculo a um episódio + assinatura imutável (hash).
ALTER TABLE exams ADD COLUMN IF NOT EXISTS episode_id uuid REFERENCES episodes(id) ON DELETE SET NULL;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'consulta';  -- admissao|evolucao|alta|consulta
ALTER TABLE exams ADD COLUMN IF NOT EXISTS seq int;          -- ordem dentro do episódio
ALTER TABLE exams ADD COLUMN IF NOT EXISTS locked_at timestamptz;  -- assinatura: após isso é imutável
ALTER TABLE exams ADD COLUMN IF NOT EXISTS hash text;        -- SHA-256 do conteúdo assinado
CREATE INDEX IF NOT EXISTS idx_exams_episode ON exams(episode_id);
-- Integridade da cronologia: a posição (seq) é única por episódio e cada
-- episódio tem no máximo UMA alta. Convertem corridas em erro (23505), evitando
-- ordenação ambígua ou dupla alta.
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_episode_seq
  ON exams(episode_id, seq) WHERE episode_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_episode_alta
  ON exams(episode_id) WHERE tipo = 'alta' AND episode_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text,
  detail     text,
  actor      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Coluna 'actor' (quem executou) adicionada em 2.1 para trilha LGPD por usuário.
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor text;
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS mosp_memories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  "order"    int NOT NULL DEFAULT 100,
  triggers   text[] NOT NULL DEFAULT '{}',
  content_md text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  builtin    boolean NOT NULL DEFAULT false,
  body       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profissionais (login). O admin NÃO fica aqui — vem de ADMIN_EMAIL/ADMIN_PASSWORD.
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
`;

/** Cria o schema (idempotente). Chamado no startup. */
export async function initDb(): Promise<void> {
  if (!pool) {
    console.warn(
      "[db] DATABASE_URL ausente — pulando migrations. Configure o Neon para persistir dados.",
    );
    return;
  }
  try {
    await pool.query(MIGRATIONS);
    console.log("[db] schema verificado/migrado com sucesso.");
  } catch (err) {
    console.error("[db] falha nas migrations:", err);
  }
}

/** Ping leve para o health check. */
export async function pingDb(): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
