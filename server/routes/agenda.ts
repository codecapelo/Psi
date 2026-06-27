import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";

export const agendaRouter = Router();

const TIPOS = ["round", "evolucao", "risco", "alta", "reuniao"] as const;

interface AppointmentRow {
  id: string;
  patient_id: string | null;
  tipo: string;
  titulo: string;
  local: string | null;
  scheduled_at: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

function toAppointment(r: AppointmentRow) {
  return {
    id: r.id,
    patientId: r.patient_id,
    tipo: r.tipo,
    titulo: r.titulo,
    local: r.local,
    scheduledAt: r.scheduled_at,
    done: r.done,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// GET /agenda?date=YYYY-MM-DD — compromissos do dia (default: hoje, fuso do servidor).
agendaRouter.get("/agenda", async (req, res, next) => {
  try {
    const date = (req.query.date as string | undefined)?.trim() || null;
    const { rows } = await query<AppointmentRow>(
      `SELECT * FROM appointments
       WHERE ($1::date IS NULL AND scheduled_at::date = current_date)
          OR scheduled_at::date = $1::date
       ORDER BY scheduled_at ASC`,
      [date],
    );
    res.json(rows.map(toAppointment));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(1, "Título é obrigatório."),
  local: z.string().trim().nullish(),
  scheduledAt: z.string().datetime().optional(),
  patientId: z.string().uuid().nullish(),
});

agendaRouter.post("/agenda", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { tipo, titulo, local, scheduledAt, patientId } = parsed.data;
    const { rows } = await query<AppointmentRow>(
      `INSERT INTO appointments (patient_id, tipo, titulo, local, scheduled_at)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now())) RETURNING *`,
      [patientId || null, tipo, titulo, local || null, scheduledAt ?? null],
    );
    await audit("CREATE", "appointment", rows[0].id, titulo, req.user?.email);
    res.status(201).json(toAppointment(rows[0]));
  } catch (err) {
    next(err);
  }
});

const patchSchema = z.object({
  tipo: z.enum(TIPOS).optional(),
  titulo: z.string().trim().min(1).optional(),
  local: z.string().trim().nullish(),
  scheduledAt: z.string().datetime().optional(),
  done: z.boolean().optional(),
});

agendaRouter.patch("/agenda/:id", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { tipo, titulo, local, scheduledAt, done } = parsed.data;
    const { rows } = await query<AppointmentRow>(
      `UPDATE appointments SET
         tipo = COALESCE($2, tipo),
         titulo = COALESCE($3, titulo),
         local = COALESCE($4, local),
         scheduled_at = COALESCE($5::timestamptz, scheduled_at),
         done = COALESCE($6, done),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, tipo ?? null, titulo ?? null, local ?? null, scheduledAt ?? null, done ?? null],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Compromisso não encontrado." });
    await audit("UPDATE", "appointment", req.params.id, null, req.user?.email);
    res.json(toAppointment(rows[0]));
  } catch (err) {
    next(err);
  }
});

agendaRouter.delete("/agenda/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM appointments WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Compromisso não encontrado." });
    await audit("DELETE", "appointment", req.params.id, null, req.user?.email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
