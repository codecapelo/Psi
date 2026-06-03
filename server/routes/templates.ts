import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";

export const templatesRouter = Router();

interface TemplateRow {
  id: string;
  name: string;
  builtin: boolean;
  body: string;
  created_at: string;
  updated_at: string;
}

function toTemplate(r: TemplateRow) {
  return {
    id: r.id,
    name: r.name,
    builtin: r.builtin,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

templatesRouter.get("/templates", async (_req, res, next) => {
  try {
    const { rows } = await query<TemplateRow>(
      `SELECT * FROM report_templates ORDER BY builtin DESC, name ASC`,
    );
    res.json(rows.map(toTemplate));
  } catch (err) {
    next(err);
  }
});

const tplSchema = z.object({
  name: z.string().trim().min(1),
  body: z.string(),
});

templatesRouter.post("/templates", async (req, res, next) => {
  try {
    const parsed = tplSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { rows } = await query<TemplateRow>(
      `INSERT INTO report_templates (name, body, builtin) VALUES ($1, $2, false) RETURNING *`,
      [parsed.data.name, parsed.data.body],
    );
    await audit("CREATE", "template", rows[0].id, parsed.data.name);
    res.status(201).json(toTemplate(rows[0]));
  } catch (err) {
    next(err);
  }
});

templatesRouter.patch("/templates/:id", async (req, res, next) => {
  try {
    const parsed = tplSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Payload inválido." });
    // Não permite editar modelos pré-instalados.
    const existing = await query<TemplateRow>(
      `SELECT * FROM report_templates WHERE id = $1`,
      [req.params.id],
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Modelo não encontrado." });
    if (existing.rows[0].builtin)
      return res.status(403).json({ error: "Modelo padrão não pode ser editado." });
    const { rows } = await query<TemplateRow>(
      `UPDATE report_templates SET
         name = COALESCE($2, name),
         body = COALESCE($3, body),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, parsed.data.name ?? null, parsed.data.body ?? null],
    );
    await audit("UPDATE", "template", req.params.id);
    res.json(toTemplate(rows[0]));
  } catch (err) {
    next(err);
  }
});

templatesRouter.delete("/templates/:id", async (req, res, next) => {
  try {
    const existing = await query<TemplateRow>(
      `SELECT builtin FROM report_templates WHERE id = $1`,
      [req.params.id],
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Modelo não encontrado." });
    if (existing.rows[0].builtin)
      return res.status(403).json({ error: "Modelo padrão não pode ser removido." });
    await query(`DELETE FROM report_templates WHERE id = $1`, [req.params.id]);
    await audit("DELETE", "template", req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
