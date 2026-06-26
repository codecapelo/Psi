import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";

export const patientsRouter = Router();

interface PatientRow {
  id: string;
  name: string;
  external_id: string | null;
  summary: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function toPatient(r: PatientRow) {
  return {
    id: r.id,
    name: r.name,
    externalId: r.external_id,
    summary: r.summary,
    details: r.details ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Dados cadastrais opcionais. Whitelist de campos (chaves desconhecidas são
// descartadas pelo zod) — só o nome do paciente é obrigatório.
const detailsSchema = z
  .object({
    nascimento: z.string().trim(),
    sexo: z.string().trim(),
    cpf: z.string().trim(),
    rg: z.string().trim(),
    nomeMae: z.string().trim(),
    nacionalidade: z.string().trim(),
    naturalidade: z.string().trim(),
    estadoCivil: z.string().trim(),
    profissao: z.string().trim(),
    escolaridade: z.string().trim(),
    endereco: z.string().trim(),
    telefone: z.string().trim(),
  })
  .partial();

// GET /patients?q=  — lista com busca full-text (nome, id, resumo, anamnese)
patientsRouter.get("/patients", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const like = q ? `%${q}%` : null;
    const { rows } = await query<PatientRow>(
      `SELECT p.* FROM patients p
       WHERE ($1::text IS NULL
              OR p.name ILIKE $1
              OR coalesce(p.external_id,'') ILIKE $1
              OR coalesce(p.summary,'') ILIKE $1
              OR EXISTS (SELECT 1 FROM exams e
                         WHERE e.patient_id = p.id AND e.data::text ILIKE $1))
       ORDER BY p.updated_at DESC
       LIMIT 500`,
      [like],
    );
    // LGPD: acesso a dados de pacientes é auditado (inclusive buscas).
    await audit("READ", "patient", null, q ? `busca: ${q}` : "lista", req.user?.email);
    res.json(rows.map(toPatient));
  } catch (err) {
    next(err);
  }
});

patientsRouter.get("/patients/:id", async (req, res, next) => {
  try {
    const { rows } = await query<PatientRow>(
      `SELECT * FROM patients WHERE id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Paciente não encontrado." });
    await audit("READ", "patient", req.params.id, null, req.user?.email);
    res.json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório."),
  externalId: z.string().trim().nullish(),
  details: detailsSchema.optional(),
});

patientsRouter.post("/patients", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { name, externalId, details } = parsed.data;
    const { rows } = await query<PatientRow>(
      `INSERT INTO patients (name, external_id, details)
       VALUES ($1, $2, $3::jsonb) RETURNING *`,
      [name, externalId || null, JSON.stringify(details ?? {})],
    );
    await audit("CREATE", "patient", rows[0].id, name, req.user?.email);
    res.status(201).json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  externalId: z.string().trim().nullish(),
  summary: z.string().nullish(),
  details: detailsSchema.optional(),
});

patientsRouter.patch("/patients/:id", async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { name, externalId, summary, details } = parsed.data;
    const { rows } = await query<PatientRow>(
      `UPDATE patients SET
         name = COALESCE($2, name),
         external_id = COALESCE($3, external_id),
         summary = COALESCE($4, summary),
         details = COALESCE($5::jsonb, details),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, name ?? null, externalId ?? null, summary ?? null, details ? JSON.stringify(details) : null],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Paciente não encontrado." });
    await audit("UPDATE", "patient", req.params.id, null, req.user?.email);
    res.json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

patientsRouter.delete("/patients/:id", async (req, res, next) => {
  try {
    // Conta os exames que serão removidos em cascata (rastreabilidade LGPD).
    const { rows: cnt } = await query<{ n: string }>(
      `SELECT count(*) AS n FROM exams WHERE patient_id = $1`,
      [req.params.id],
    );
    const { rowCount } = await query(`DELETE FROM patients WHERE id = $1`, [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Paciente não encontrado." });
    await audit(
      "DELETE",
      "patient",
      req.params.id,
      `${cnt[0]?.n ?? 0} exames removidos em cascata`,
      req.user?.email,
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
