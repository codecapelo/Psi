import { Router } from "express";
import { z } from "zod";
import { query, audit, withTransaction } from "../db.ts";
import { toExam } from "./exams.ts";
import {
  buildEvolucaoSeed,
  ENCOUNTER_TIPOS,
  EPISODE_TIPOS,
} from "../longitudinal.ts";

/** Código de violação de unicidade do Postgres. */
const PG_UNIQUE_VIOLATION = "23505";
function pgError(err: unknown): { code?: string; constraint?: string } {
  return (err ?? {}) as { code?: string; constraint?: string };
}

export const episodesRouter = Router();

interface EpisodeRow {
  id: string;
  patient_id: string;
  tipo: string;
  status: string;
  titulo: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ExamRow {
  id: string;
  patient_id: string;
  status: string;
  context: string | null;
  data: Record<string, unknown>;
  episode_id: string | null;
  tipo: string;
  seq: number | null;
  locked_at: string | null;
  hash: string | null;
  created_at: string;
  updated_at: string;
}

function toEpisode(r: EpisodeRow) {
  return {
    id: r.id,
    patientId: r.patient_id,
    tipo: r.tipo,
    status: r.status,
    titulo: r.titulo,
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Lista episódios do paciente com seus atendimentos aninhados (p/ a cronologia).
episodesRouter.get("/patients/:patientId/episodes", async (req, res, next) => {
  try {
    const { rows: eps } = await query<EpisodeRow>(
      `SELECT * FROM episodes WHERE patient_id = $1 ORDER BY opened_at ASC`,
      [req.params.patientId],
    );
    const ids = eps.map((e) => e.id);
    let examsByEpisode: Record<string, ReturnType<typeof toExam>[]> = {};
    if (ids.length > 0) {
      const { rows: exRows } = await query<ExamRow>(
        `SELECT * FROM exams WHERE episode_id = ANY($1::uuid[])
         ORDER BY seq ASC NULLS LAST, created_at ASC`,
        [ids],
      );
      examsByEpisode = exRows.reduce<Record<string, ReturnType<typeof toExam>[]>>(
        (acc, r) => {
          const key = r.episode_id as string;
          (acc[key] ??= []).push(toExam(r));
          return acc;
        },
        {},
      );
    }
    await audit("READ", "episode", null, `lista do paciente ${req.params.patientId}`, req.user?.email);
    res.json(eps.map((e) => ({ ...toEpisode(e), exams: examsByEpisode[e.id] ?? [] })));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  tipo: z.enum(EPISODE_TIPOS),
  titulo: z.string().trim().nullish(),
});

// Cria um episódio.
episodesRouter.post("/patients/:patientId/episodes", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { tipo, titulo } = parsed.data;
    const { rows } = await query<EpisodeRow>(
      `INSERT INTO episodes (patient_id, tipo, titulo) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.patientId, tipo, titulo || null],
    );
    await audit("CREATE", "episode", rows[0].id, `${tipo} (paciente ${req.params.patientId})`, req.user?.email);
    res.status(201).json(toEpisode(rows[0]));
  } catch (err) {
    next(err);
  }
});

// Abre uma internação: cria o episódio + a admissão ATOMICAMENTE (uma transação)
// e devolve a admissão. Evita episódios órfãos se algo falhar no meio.
// Regra clínica: o paciente só pode ter UMA internação aberta por vez — se já
// houver uma, devolve 409 com o id dela (o cliente abre a existente).
episodesRouter.post("/patients/:patientId/internacao", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const { rows: open } = await client.query<{ id: string }>(
        `SELECT id FROM episodes
         WHERE patient_id = $1 AND tipo = 'internacao' AND status = 'aberto'
         ORDER BY opened_at DESC LIMIT 1`,
        [req.params.patientId],
      );
      if (open.length > 0) return { conflict: open[0].id };

      const { rows: epRows } = await client.query<EpisodeRow>(
        `INSERT INTO episodes (patient_id, tipo) VALUES ($1, 'internacao') RETURNING *`,
        [req.params.patientId],
      );
      const ep = epRows[0];
      const { rows: exRows } = await client.query<ExamRow>(
        `INSERT INTO exams (patient_id, episode_id, tipo, seq, data)
         VALUES ($1, $2, 'admissao', 1, '{}'::jsonb) RETURNING *`,
        [ep.patient_id, ep.id],
      );
      return { exam: toExam(exRows[0]) };
    });

    if ("conflict" in result) {
      return res.status(409).json({
        error: "Este paciente já tem uma internação aberta. Conclua-a (alta) antes de abrir outra.",
        episodeId: result.conflict,
      });
    }
    await audit("CREATE", "episode", result.exam.episodeId, `internação + admissão (paciente ${req.params.patientId})`, req.user?.email);
    res.status(201).json(result.exam);
  } catch (err) {
    next(err);
  }
});

const addExamSchema = z.object({ tipo: z.enum(ENCOUNTER_TIPOS) });

// Cria um atendimento dentro de um episódio (com semeadura para evolução).
episodesRouter.post("/episodes/:id/exams", async (req, res, next) => {
  try {
    const parsed = addExamSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { tipo } = parsed.data;

    const { rows: epRows } = await query<EpisodeRow>(
      `SELECT * FROM episodes WHERE id = $1`,
      [req.params.id],
    );
    if (epRows.length === 0)
      return res.status(404).json({ error: "Episódio não encontrado." });
    const ep = epRows[0];

    // Episódio encerrado é imutável — não recebe novos atendimentos.
    if (ep.status === "encerrado")
      return res.status(409).json({ error: "Episódio encerrado." });

    let data: Record<string, unknown> = {};
    if (tipo === "evolucao") {
      const { rows: srcRows } = await query<ExamRow>(
        `SELECT * FROM exams
         WHERE episode_id = $1 AND tipo IN ('evolucao','admissao','consulta')
         ORDER BY seq DESC NULLS LAST, created_at DESC LIMIT 1`,
        [ep.id],
      );
      const src = srcRows[0]
        ? { tipo: srcRows[0].tipo, data: srcRows[0].data, date: srcRows[0].created_at }
        : null;
      data = { evolucao: buildEvolucaoSeed(src) };
    }

    // seq é alocado DENTRO do INSERT (atômico). Uma corrida vira violação de
    // unicidade (uq_exams_episode_seq) → tentamos de novo. Duplicar a alta
    // (uq_exams_episode_alta) é erro definitivo → 409.
    let row: ExamRow | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const { rows } = await query<ExamRow>(
          `INSERT INTO exams (patient_id, episode_id, tipo, seq, data)
           SELECT $1, $2, $3, COALESCE(MAX(seq), 0) + 1, $4::jsonb
           FROM exams WHERE episode_id = $2
           RETURNING *`,
          [ep.patient_id, ep.id, tipo, JSON.stringify(data)],
        );
        row = rows[0];
        break;
      } catch (err) {
        const e = pgError(err);
        if (e.code === PG_UNIQUE_VIOLATION && e.constraint === "uq_exams_episode_alta")
          return res.status(409).json({ error: "Este episódio já possui uma alta." });
        if (e.code === PG_UNIQUE_VIOLATION && attempt < 4) continue; // corrida de seq
        throw err;
      }
    }
    if (!row) return res.status(409).json({ error: "Não foi possível registrar o atendimento. Tente novamente." });

    // Alta encerra o episódio (condicional → dispara no máximo uma vez).
    if (tipo === "alta") {
      await query(
        `UPDATE episodes SET status = 'encerrado', closed_at = now(), updated_at = now()
         WHERE id = $1 AND status <> 'encerrado'`,
        [ep.id],
      );
    }

    await audit("CREATE", "exam", row.id, `${tipo} no episódio ${ep.id}`, req.user?.email);
    res.status(201).json(toExam(row));
  } catch (err) {
    next(err);
  }
});

const patchSchema = z.object({
  status: z.enum(["aberto", "encerrado"]).optional(),
  titulo: z.string().trim().nullish(),
});

// Atualiza um episódio (encerrar manualmente, renomear).
episodesRouter.patch("/episodes/:id", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { status, titulo } = parsed.data;
    const { rows } = await query<EpisodeRow>(
      `UPDATE episodes SET
         status = COALESCE($2, status),
         titulo = COALESCE($3, titulo),
         closed_at = CASE WHEN $2 = 'encerrado' AND closed_at IS NULL THEN now()
                          WHEN $2 = 'aberto' THEN NULL
                          ELSE closed_at END,
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, status ?? null, titulo ?? null],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Episódio não encontrado." });
    await audit("UPDATE", "episode", req.params.id, status ? `status=${status}` : null, req.user?.email);
    res.json(toEpisode(rows[0]));
  } catch (err) {
    next(err);
  }
});

// Descarta um episódio inteiro (ex.: internação aberta vazia/equivocada).
// Bloqueia se houver QUALQUER atendimento assinado — registro assinado é
// imutável e não pode ser apagado. Caso contrário, remove o episódio e seus
// atendimentos não assinados atomicamente.
episodesRouter.delete("/episodes/:id", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const { rows: epRows } = await client.query<{ id: string }>(
        `SELECT id FROM episodes WHERE id = $1 FOR UPDATE`,
        [req.params.id],
      );
      if (epRows.length === 0) return { status: 404 as const };
      const { rows: locked } = await client.query<{ n: string }>(
        `SELECT count(*) AS n FROM exams WHERE episode_id = $1 AND locked_at IS NOT NULL`,
        [req.params.id],
      );
      if (Number(locked[0]?.n ?? 0) > 0) return { status: 409 as const };
      const { rows: cnt } = await client.query<{ n: string }>(
        `SELECT count(*) AS n FROM exams WHERE episode_id = $1`,
        [req.params.id],
      );
      // ON DELETE SET NULL transformaria os atendimentos em avulsos — por isso
      // apagamos explicitamente os (não assinados) antes do episódio.
      await client.query(`DELETE FROM exams WHERE episode_id = $1`, [req.params.id]);
      await client.query(`DELETE FROM episodes WHERE id = $1`, [req.params.id]);
      return { status: 200 as const, removed: Number(cnt[0]?.n ?? 0) };
    });

    if (result.status === 404)
      return res.status(404).json({ error: "Episódio não encontrado." });
    if (result.status === 409)
      return res.status(409).json({
        error: "O episódio tem atendimentos assinados e não pode ser descartado.",
      });
    await audit("DELETE", "episode", req.params.id, `${result.removed} atendimento(s) removido(s)`, req.user?.email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
