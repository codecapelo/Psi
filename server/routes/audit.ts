import { Router } from "express";
import { query } from "../db.ts";
import { isAdmin } from "../auth.ts";

export const auditRouter = Router();

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: string | null;
  actor: string | null;
  created_at: string;
}

auditRouter.get("/audit", async (req, res, next) => {
  try {
    const action = (req.query.action as string | undefined)?.toUpperCase();
    const valid = ["CREATE", "READ", "UPDATE", "DELETE"];
    const filter = action && valid.includes(action) ? action : null;
    // RBAC: administradores veem tudo; os demais, só as próprias ações.
    const me = req.user?.email ?? null;
    const actorFilter = isAdmin(me) ? null : me;
    const { rows } = await query<AuditRow>(
      `SELECT * FROM audit_log
       WHERE ($1::text IS NULL OR action = $1)
         AND ($2::text IS NULL OR actor = $2)
       ORDER BY created_at DESC LIMIT 500`,
      [filter, actorFilter],
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        entityId: r.entity_id,
        detail: r.detail,
        actor: r.actor,
        createdAt: r.created_at,
      })),
    );
  } catch (err) {
    next(err);
  }
});
