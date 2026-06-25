import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";

export const examsRouter = Router();

interface ExamRow {
  id: string;
  patient_id: string;
  status: string;
  context: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function toExam(r: ExamRow) {
  return {
    id: r.id,
    patientId: r.patient_id,
    status: r.status,
    context: r.context,
    data: r.data,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Lista exames de um paciente
examsRouter.get("/patients/:patientId/exams", async (req, res, next) => {
  try {
    const { rows } = await query<ExamRow>(
      `SELECT * FROM exams WHERE patient_id = $1 ORDER BY created_at DESC`,
      [req.params.patientId],
    );
    await audit("READ", "exam", null, `lista do paciente ${req.params.patientId}`, req.user?.email);
    res.json(rows.map(toExam));
  } catch (err) {
    next(err);
  }
});

// Cria exame
examsRouter.post("/patients/:patientId/exams", async (req, res, next) => {
  try {
    const { rows } = await query<ExamRow>(
      `INSERT INTO exams (patient_id) VALUES ($1) RETURNING *`,
      [req.params.patientId],
    );
    await audit("CREATE", "exam", rows[0].id, `paciente ${req.params.patientId}`, req.user?.email);
    res.status(201).json(toExam(rows[0]));
  } catch (err) {
    next(err);
  }
});

// Detalhe do exame + paciente
examsRouter.get("/exams/:id", async (req, res, next) => {
  try {
    const { rows } = await query<ExamRow & {
      p_name: string;
      p_external_id: string | null;
      p_created_at: string;
      p_updated_at: string;
    }>(
      `SELECT e.*, p.name AS p_name, p.external_id AS p_external_id,
              p.created_at AS p_created_at, p.updated_at AS p_updated_at
       FROM exams e JOIN patients p ON p.id = e.patient_id
       WHERE e.id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Exame não encontrado." });
    const r = rows[0];
    await audit("READ", "exam", r.id, null, req.user?.email);
    res.json({
      ...toExam(r),
      patient: {
        id: r.patient_id,
        name: r.p_name,
        externalId: r.p_external_id,
        createdAt: r.p_created_at,
        updatedAt: r.p_updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Atualiza status/contexto
const patchSchema = z.object({
  status: z.enum(["em_andamento", "concluido"]).optional(),
  context: z.string().nullish(),
});

examsRouter.patch("/exams/:id", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { status, context } = parsed.data;
    const { rows } = await query<ExamRow>(
      `UPDATE exams SET
         status = COALESCE($2, status),
         context = COALESCE($3, context),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, status ?? null, context ?? null],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Exame não encontrado." });
    await audit("UPDATE", "exam", req.params.id, status ? `status=${status}` : null, req.user?.email);
    res.json(toExam(rows[0]));
  } catch (err) {
    next(err);
  }
});

// Merge (shallow, no topo) de uma fatia do JSON do exame — usado no autosave.
const dataSchema = z.object({ data: z.record(z.string(), z.unknown()) });

examsRouter.patch("/exams/:id/data", async (req, res, next) => {
  try {
    const parsed = dataSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Payload inválido." });
    const { rows } = await query<ExamRow>(
      `UPDATE exams SET data = data || $2::jsonb, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, JSON.stringify(parsed.data.data)],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Exame não encontrado." });
    // Auditoria de UPDATE de dados é frequente (autosave) — não registramos
    // cada merge para não poluir a trilha.
    res.json(toExam(rows[0]));
  } catch (err) {
    next(err);
  }
});

examsRouter.delete("/exams/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM exams WHERE id = $1`, [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Exame não encontrado." });
    await audit("DELETE", "exam", req.params.id, null, req.user?.email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
