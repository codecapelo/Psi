import { Router } from "express";
import { z } from "zod";
import { query, audit, withTransaction } from "../db.ts";
import { toExam } from "./exams.ts";
import {
  buildEvolucaoSeed,
  ENCOUNTER_TIPOS,
  EPISODE_TIPOS,
} from "../longitudinal.ts";

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

// Cria um episódio (ambulatorial/consulta). Internação NÃO entra por aqui: ela
// exige admissão atômica e a regra de "uma internação aberta por paciente", que
// só o endpoint dedicado (POST /patients/:id/internacao) garante. Criar uma
// internação avulsa aqui geraria justamente o episódio aberto/vazio que evitamos.
episodesRouter.post("/patients/:patientId/episodes", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { tipo, titulo } = parsed.data;
    if (tipo === "internacao")
      return res.status(400).json({
        error: "Para abrir uma internação, use POST /patients/:patientId/internacao.",
      });
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
      // Serializa a criação de internação POR PACIENTE: travar a linha do
      // paciente (FOR UPDATE) faz dois POSTs concorrentes (duplo clique, retry,
      // duas abas) esperarem em fila — o 2º já enxerga a internação aberta do 1º
      // e recebe 409, em vez de ambos inserirem. (Sem isso, a checagem abaixo é
      // uma corrida.) Patient inexistente → 404.
      const { rows: pat } = await client.query<{ id: string }>(
        `SELECT id FROM patients WHERE id = $1 FOR UPDATE`,
        [req.params.patientId],
      );
      if (pat.length === 0) return { notFound: true as const };

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

    if ("notFound" in result)
      return res.status(404).json({ error: "Paciente não encontrado." });
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
// Tudo sob FOR UPDATE no episódio: serializa contra o fechamento por assinatura
// da alta (POST /exams/:id/lock atualiza `episodes`, pegando o mesmo row lock) —
// sem isso, um insert poderia "escapar" para um episódio recém-encerrado. O lock
// também torna a alocação de `seq` determinística (dispensa o retry de corrida).
episodesRouter.post("/episodes/:id/exams", async (req, res, next) => {
  try {
    const parsed = addExamSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { tipo } = parsed.data;

    const result = await withTransaction(async (client) => {
      const { rows: epRows } = await client.query<EpisodeRow>(
        `SELECT * FROM episodes WHERE id = $1 FOR UPDATE`,
        [req.params.id],
      );
      if (epRows.length === 0) return { status: 404 as const };
      const ep = epRows[0];
      // Re-checado SOB o lock: se a alta foi assinada em paralelo, já encerrou.
      if (ep.status === "encerrado")
        return { status: 409 as const, error: "Episódio encerrado." };

      // Uma alta por episódio — checagem sob lock (constraint é só backstop).
      if (tipo === "alta") {
        const { rows: altas } = await client.query<{ id: string }>(
          `SELECT id FROM exams WHERE episode_id = $1 AND tipo = 'alta' LIMIT 1`,
          [ep.id],
        );
        if (altas.length > 0)
          return { status: 409 as const, error: "Este episódio já possui uma alta." };
      }

      let data: Record<string, unknown> = {};
      if (tipo === "evolucao") {
        const { rows: srcRows } = await client.query<ExamRow>(
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

      // seq determinístico sob o lock — sem corrida, sem retry.
      const { rows } = await client.query<ExamRow>(
        `INSERT INTO exams (patient_id, episode_id, tipo, seq, data)
         SELECT $1, $2, $3, COALESCE(MAX(seq), 0) + 1, $4::jsonb
         FROM exams WHERE episode_id = $2
         RETURNING *`,
        [ep.patient_id, ep.id, tipo, JSON.stringify(data)],
      );
      // NÃO encerramos o episódio aqui: a alta recém-criada é um RASCUNHO ainda
      // editável/excluível. O episódio só é encerrado ao ASSINAR a alta.
      return { status: 201 as const, exam: toExam(rows[0]), episodeId: ep.id };
    });

    if (result.status === 404)
      return res.status(404).json({ error: "Episódio não encontrado." });
    if (result.status === 409)
      return res.status(409).json({ error: result.error });

    await audit("CREATE", "exam", result.exam.id, `${tipo} no episódio ${result.episodeId}`, req.user?.email);
    res.status(201).json(result.exam);
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

// Sentinela: um atendimento foi assinado em paralelo durante o descarte.
// Lançá-la faz a transação dar ROLLBACK (preservando o registro assinado).
class SignedExamRace extends Error {}

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

      // Trava TODAS as linhas de atendimento do episódio. POST /exams/:id/lock
      // também faz FOR UPDATE na linha antes de assinar, então estas não podem
      // ser assinadas enquanto seguramos o lock — fecha a corrida assinar×descartar.
      const { rows: exams } = await client.query<{ locked_at: string | null }>(
        `SELECT locked_at FROM exams WHERE episode_id = $1 FOR UPDATE`,
        [req.params.id],
      );
      if (exams.some((e) => e.locked_at !== null)) return { status: 409 as const };

      // Apaga só os não assinados (ON DELETE SET NULL os tornaria avulsos).
      await client.query(
        `DELETE FROM exams WHERE episode_id = $1 AND locked_at IS NULL`,
        [req.params.id],
      );
      // Se ainda restar atendimento, foi inserido E assinado em paralelo (fora do
      // nosso snapshot travado) — aborta para não apagar/órfãozar o assinado.
      const { rows: rest } = await client.query<{ n: string }>(
        `SELECT count(*) AS n FROM exams WHERE episode_id = $1`,
        [req.params.id],
      );
      if (Number(rest[0]?.n ?? 0) > 0) throw new SignedExamRace();

      await client.query(`DELETE FROM episodes WHERE id = $1`, [req.params.id]);
      return { status: 200 as const, removed: exams.length };
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
    if (err instanceof SignedExamRace)
      return res.status(409).json({
        error: "Um atendimento foi assinado durante o descarte; operação cancelada.",
      });
    next(err);
  }
});
