import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";

export const notificationsRouter = Router();

const TIPOS = ["risco", "evolucao", "alta", "medicacao", "exame"] as const;

interface NotificationRow {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  patient_id: string | null;
  read: boolean;
  created_at: string;
}

function toNotification(r: NotificationRow) {
  return {
    id: r.id,
    tipo: r.tipo,
    titulo: r.titulo,
    descricao: r.descricao,
    patientId: r.patient_id,
    read: r.read,
    createdAt: r.created_at,
  };
}

// GET /notifications — as mais recentes (até 100).
notificationsRouter.get("/notifications", async (_req, res, next) => {
  try {
    const { rows } = await query<NotificationRow>(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100`,
    );
    res.json(rows.map(toNotification));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(1),
  descricao: z.string().trim().nullish(),
  patientId: z.string().uuid().nullish(),
});

notificationsRouter.post("/notifications", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { tipo, titulo, descricao, patientId } = parsed.data;
    const { rows } = await query<NotificationRow>(
      `INSERT INTO notifications (tipo, titulo, descricao, patient_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tipo, titulo, descricao || null, patientId || null],
    );
    await audit("CREATE", "notification", rows[0].id, titulo, req.user?.email);
    res.status(201).json(toNotification(rows[0]));
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/notifications/read-all", async (_req, res, next) => {
  try {
    await query(`UPDATE notifications SET read = true WHERE read = false`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/notifications/:id/read", async (req, res, next) => {
  try {
    const { rows } = await query<NotificationRow>(
      `UPDATE notifications SET read = true WHERE id = $1 RETURNING *`,
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Notificação não encontrada." });
    res.json(toNotification(rows[0]));
  } catch (err) {
    next(err);
  }
});
