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
