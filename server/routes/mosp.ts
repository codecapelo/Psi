import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";
import { requireMospAuthor } from "../auth.ts";

export const mospRouter = Router();

interface MospRow {
  id: string;
  title: string;
  order: number;
  triggers: string[];
  content_md: string;
  created_at: string;
  updated_at: string;
}

function toMemory(r: MospRow) {
  return {
    id: r.id,
    title: r.title,
    order: r.order,
    triggers: r.triggers,
    contentMd: r.content_md,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

mospRouter.get("/mosp", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const like = q ? `%${q}%` : null;
    const { rows } = await query<MospRow>(
      `SELECT * FROM mosp_memories
       WHERE ($1::text IS NULL OR title ILIKE $1 OR content_md ILIKE $1)
       ORDER BY "order" ASC, title ASC`,
      [like],
    );
    res.json(rows.map(toMemory));
  } catch (err) {
    next(err);
  }
});

const memSchema = z.object({
  title: z.string().trim().min(1),
  order: z.number().int().optional(),
  triggers: z.array(z.string()).optional(),
  contentMd: z.string().optional(),
});

mospRouter.post("/mosp", requireMospAuthor, async (req, res, next) => {
  try {
    const parsed = memSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { title, order, triggers, contentMd } = parsed.data;
    const { rows } = await query<MospRow>(
      `INSERT INTO mosp_memories (title, "order", triggers, content_md)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, order ?? 100, triggers ?? [], contentMd ?? ""],
    );
    await audit("CREATE", "mosp", rows[0].id, title, req.user?.email);
    res.status(201).json(toMemory(rows[0]));
  } catch (err) {
    next(err);
  }
});

mospRouter.patch("/mosp/:id", requireMospAuthor, async (req, res, next) => {
  try {
    const parsed = memSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Payload inválido." });
    const { title, order, triggers, contentMd } = parsed.data;
    const { rows } = await query<MospRow>(
      `UPDATE mosp_memories SET
         title = COALESCE($2, title),
         "order" = COALESCE($3, "order"),
         triggers = COALESCE($4, triggers),
         content_md = COALESCE($5, content_md),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, title ?? null, order ?? null, triggers ?? null, contentMd ?? null],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Memória não encontrada." });
    await audit("UPDATE", "mosp", req.params.id, null, req.user?.email);
    res.json(toMemory(rows[0]));
  } catch (err) {
    next(err);
  }
});

mospRouter.delete("/mosp/:id", requireMospAuthor, async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM mosp_memories WHERE id = $1`, [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Memória não encontrada." });
    await audit("DELETE", "mosp", req.params.id, null, req.user?.email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Padrões clínicos pré-carregados ("Semear Padrões do App").
const SEED: Array<{ title: string; order: number; triggers: string[]; contentMd: string }> = [
  {
    title: "Risco Suicida",
    order: 10,
    triggers: ["suicíd", "suicid", "ideação", "morte", "se matar", "autoextermínio"],
    contentMd:
      "# Risco Suicida\n\n- **Sempre** investigar ativamente ideação, plano, intenção, acesso a meios e tentativas prévias.\n- Considerar aplicar a **C-SSRS**.\n- Avaliar fatores de risco (desesperança, dor psíquica, impulsividade, perdas recentes, uso de substâncias) e de proteção (suporte, vínculos, razões para viver).\n- Definir nível de risco e conduta (segurança imediata, restrição de meios, intensificação do cuidado, internação se necessário).\n- Documentar a avaliação e o plano de segurança.",
  },
  {
    title: "Psicose",
    order: 20,
    triggers: ["psicose", "psicótic", "delírio", "alucinaç", "esquizofren"],
    contentMd:
      "# Psicose\n\n- Caracterizar sintomas positivos (delírios, alucinações, desorganização) e negativos.\n- Excluir causas orgânicas e induzidas por substâncias.\n- Avaliar risco (auto/heteroagressão), insight e adesão.\n- Considerar escalas (PANSS/BPRS).\n- Planejar antipsicótico com atenção a efeitos adversos e monitorização metabólica.",
  },
  {
    title: "Mania / Hipomania",
    order: 30,
    triggers: ["mania", "maníac", "hipomania", "bipolar", "eufor"],
    contentMd:
      "# Mania / Hipomania\n\n- Critérios: humor elevado/irritável + aumento de energia/atividade por período definido.\n- Investigar redução da necessidade de sono, grandiosidade, fuga de ideias, impulsividade, gastos excessivos.\n- **Cuidado com antidepressivos** (risco de virada/ciclagem).\n- Considerar escalas (YMRS/Altman).\n- Avaliar risco e necessidade de estabilizador do humor/antipsicótico.",
  },
  {
    title: "Catatonia",
    order: 40,
    triggers: ["catatonia", "catatônic", "estupor", "negativismo", "flexibilidade cérea"],
    contentMd:
      "# Catatonia\n\n- Sinais: imobilidade/estupor, mutismo, negativismo, posturas, flexibilidade cérea, ecolalia/ecopraxia, agitação.\n- Considerar **teste com lorazepam** (resposta diagnóstica/terapêutica).\n- Investigar causa de base (psiquiátrica e orgânica).\n- Atenção a complicações clínicas (desidratação, TVP, rabdomiólise).\n- ECT em casos graves/refratários.",
  },
];

mospRouter.post("/mosp/seed", requireMospAuthor, async (req, res, next) => {
  try {
    let inserted = 0;
    for (const m of SEED) {
      const { rowCount } = await query(
        `INSERT INTO mosp_memories (title, "order", triggers, content_md)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (SELECT 1 FROM mosp_memories WHERE title = $1)`,
        [m.title, m.order, m.triggers, m.contentMd],
      );
      inserted += rowCount ?? 0;
    }
    await audit("CREATE", "mosp", null, `seed (${inserted})`, req.user?.email);
    res.json({ inserted });
  } catch (err) {
    next(err);
  }
});
