import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";

export const patientsRouter = Router();

interface PatientRow {
  id: string;
  name: string;
  external_id: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

function toPatient(r: PatientRow) {
  return {
    id: r.id,
    name: r.name,
    externalId: r.external_id,
    summary: r.summary,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

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
    res.json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório."),
  externalId: z.string().trim().nullish(),
});

patientsRouter.post("/patients", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { name, externalId } = parsed.data;
    const { rows } = await query<PatientRow>(
      `INSERT INTO patients (name, external_id) VALUES ($1, $2) RETURNING *`,
      [name, externalId || null],
    );
    await audit("CREATE", "patient", rows[0].id, name);
    res.status(201).json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  externalId: z.string().trim().nullish(),
  summary: z.string().nullish(),
});

patientsRouter.patch("/patients/:id", async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { name, externalId, summary } = parsed.data;
    const { rows } = await query<PatientRow>(
      `UPDATE patients SET
         name = COALESCE($2, name),
         external_id = COALESCE($3, external_id),
         summary = COALESCE($4, summary),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, name ?? null, externalId ?? null, summary ?? null],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Paciente não encontrado." });
    await audit("UPDATE", "patient", req.params.id);
    res.json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

patientsRouter.delete("/patients/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM patients WHERE id = $1`, [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Paciente não encontrado." });
    await audit("DELETE", "patient", req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
