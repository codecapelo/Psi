import { Router } from "express";
import { z } from "zod";
import { createHash } from "node:crypto";
import { query, audit, withTransaction } from "../db.ts";
import { stableStringify } from "../longitudinal.ts";

export const prescriptionsRouter = Router();

interface PrescriptionRow {
  id: string;
  patient_id: string;
  episode_id: string | null;
  items: unknown[];
  locked_at: string | null;
  hash: string | null;
  created_at: string;
  updated_at: string;
}

function toPrescription(r: PrescriptionRow) {
  return {
    id: r.id,
    patientId: r.patient_id,
    episodeId: r.episode_id,
    items: r.items ?? [],
    lockedAt: r.locked_at,
    hash: r.hash,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const itemSchema = z.object({
  nome: z.string().trim().min(1),
  dose: z.string().trim().default(""),
  via: z.string().trim().default("VO"),
  freq: z.string().trim().default(""),
  status: z.enum(["ativo", "novo", "suspenso"]).default("ativo"),
});
const upsertSchema = z.object({
  items: z.array(itemSchema).max(100),
  episodeId: z.string().uuid().nullish(),
});

// GET /patients/:patientId/prescription — a prescrição vigente (mais recente) ou
// null quando o paciente ainda não tem nenhuma.
prescriptionsRouter.get("/patients/:patientId/prescription", async (req, res, next) => {
  try {
    const { rows } = await query<PrescriptionRow>(
      `SELECT * FROM prescriptions WHERE patient_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.patientId],
    );
    await audit("READ", "prescription", null, `paciente ${req.params.patientId}`, req.user?.email);
    res.json(rows.length ? toPrescription(rows[0]) : null);
  } catch (err) {
    next(err);
  }
});

// PUT /patients/:patientId/prescription — upsert dos itens. Atualiza a prescrição
// vigente se ela existir E não estiver assinada; caso contrário, cria uma nova
// (uma prescrição assinada é imutável — uma alteração depois dela abre outra).
prescriptionsRouter.put("/patients/:patientId/prescription", async (req, res, next) => {
  try {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const items = JSON.stringify(parsed.data.items);
    const episodeId = parsed.data.episodeId ?? null;

    const row = await withTransaction(async (client) => {
      const { rows: cur } = await client.query<PrescriptionRow>(
        `SELECT * FROM prescriptions WHERE patient_id = $1
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [req.params.patientId],
      );
      if (cur.length && cur[0].locked_at === null) {
        const { rows } = await client.query<PrescriptionRow>(
          `UPDATE prescriptions SET items = $2::jsonb, episode_id = COALESCE($3, episode_id),
             updated_at = now()
           WHERE id = $1 RETURNING *`,
          [cur[0].id, items, episodeId],
        );
        return rows[0];
      }
      const { rows } = await client.query<PrescriptionRow>(
        `INSERT INTO prescriptions (patient_id, episode_id, items)
         VALUES ($1, $2, $3::jsonb) RETURNING *`,
        [req.params.patientId, episodeId, items],
      );
      return rows[0];
    });

    await audit("UPDATE", "prescription", row.id, `paciente ${req.params.patientId}`, req.user?.email);
    res.json(toPrescription(row));
  } catch (err) {
    next(err);
  }
});

// POST /prescriptions/:id/lock — assina a prescrição (hash + imutável). Idempotente.
prescriptionsRouter.post("/prescriptions/:id/lock", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const { rows } = await client.query<PrescriptionRow>(
        `SELECT * FROM prescriptions WHERE id = $1 FOR UPDATE`,
        [req.params.id],
      );
      if (rows.length === 0) return { status: 404 as const };
      const row = rows[0];
      if (row.locked_at) return { status: 200 as const, presc: toPrescription(row), already: true };
      const lockedAt = new Date().toISOString();
      const hash = createHash("sha256")
        .update(
          stableStringify({
            id: row.id,
            patientId: row.patient_id,
            items: row.items,
            lockedAt,
          }),
          "utf8",
        )
        .digest("hex");
      const { rows: upd } = await client.query<PrescriptionRow>(
        `UPDATE prescriptions SET locked_at = $2, hash = $3, updated_at = now()
         WHERE id = $1 RETURNING *`,
        [row.id, lockedAt, hash],
      );
      return { status: 201 as const, presc: toPrescription(upd[0]), hash };
    });

    if (result.status === 404)
      return res.status(404).json({ error: "Prescrição não encontrada." });
    if (!result.already && result.hash)
      await audit("UPDATE", "prescription", req.params.id, `assinada (hash ${result.hash.slice(0, 12)}…)`, req.user?.email);
    res.json(result.presc);
  } catch (err) {
    next(err);
  }
});
