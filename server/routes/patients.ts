import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";

export const patientsRouter = Router();

interface PatientRow {
  id: string;
  name: string;
  external_id: string | null;
  summary: string | null;
  details: Record<string, unknown> | null;
  clinical: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function toPatient(r: PatientRow) {
  return {
    id: r.id,
    name: r.name,
    externalId: r.external_id,
    summary: r.summary,
    details: r.details ?? {},
    clinical: r.clinical ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Serializer da LISTA — OMITE `details` (CPF, RG, endereço, telefone…). A
 * listagem/busca pode trazer até 500 pacientes e a UI só usa nome/ID/datas;
 * expor cadastro em massa ampliaria desnecessariamente a PII no payload.
 * Os detalhes ficam no GET individual e no detalhe do exame, que de fato os usam.
 */
function toPatientListItem(r: Omit<PatientRow, "details">) {
  return {
    id: r.id,
    name: r.name,
    externalId: r.external_id,
    summary: r.summary,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Dados cadastrais opcionais. Whitelist de campos (chaves desconhecidas são
// descartadas pelo zod) — só o nome do paciente é obrigatório.
const detailsSchema = z
  .object({
    nascimento: z.string().trim(),
    sexo: z.string().trim(),
    cpf: z.string().trim(),
    rg: z.string().trim(),
    nomeMae: z.string().trim(),
    nacionalidade: z.string().trim(),
    naturalidade: z.string().trim(),
    estadoCivil: z.string().trim(),
    profissao: z.string().trim(),
    escolaridade: z.string().trim(),
    endereco: z.string().trim(),
    telefone: z.string().trim(),
  })
  .partial();

// Resumo clínico (2.0): risco, leito e alergias do paciente. Whitelist — chaves
// desconhecidas são descartadas. Dados clínicos profundos seguem em exams.data.
const clinicalSchema = z
  .object({
    risco: z.enum(["baixo", "moderado", "alto"]),
    leito: z.string().trim(),
    alergias: z.array(z.string().trim()).max(50),
  })
  .partial();

// GET /patients?q=  — lista com busca full-text (nome, id, resumo, anamnese)
patientsRouter.get("/patients", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const like = q ? `%${q}%` : null;
    // Não selecionamos `details` aqui — a lista não os usa e não devem trafegar
    // em massa (ver toPatientListItem).
    const { rows } = await query<Omit<PatientRow, "details">>(
      `SELECT p.id, p.name, p.external_id, p.summary, p.created_at, p.updated_at
       FROM patients p
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
    // LGPD: acesso a dados de pacientes é auditado (inclusive buscas).
    await audit("READ", "patient", null, q ? `busca: ${q}` : "lista", req.user?.email);
    res.json(rows.map(toPatientListItem));
  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------------------------------
// GET /patients/overview — lista enriquecida para o Painel e a tela Pacientes.
// Para cada paciente, deriva do episódio de INTERNAÇÃO ABERTO (quando há):
// status (internado | alta-elaboracao), dias internado, diagnóstico (da
// admissão), última evolução e nº de evoluções pendentes (regra: internação
// aberta cuja última evolução não é de hoje ⇒ 1). Sem `details` (PII) — só o
// resumo clínico (`clinical`). Registrado ANTES de /patients/:id para não casar
// "overview" como id.
// --------------------------------------------------------------------------
interface OverviewExamRow {
  episode_id: string;
  tipo: string;
  seq: number | null;
  data: Record<string, unknown>;
  created_at: string;
}

function buildOverview(
  p: Omit<PatientRow, "details">,
  episode: { id: string; opened_at: string } | undefined,
  exams: OverviewExamRow[],
) {
  const base = {
    id: p.id,
    name: p.name,
    externalId: p.external_id,
    summary: p.summary,
    clinical: p.clinical ?? {},
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    status: null as string | null,
    episodeId: null as string | null,
    internadoEm: null as string | null,
    diasInternado: null as number | null,
    diagnostico: null as { sindromico: string; nosologico: string; cid: string } | null,
    ultimaEvolucao: null as { quando: string; texto: string } | null,
    evolucoesPendentes: 0,
  };
  if (!episode) return base;

  base.episodeId = episode.id;
  base.internadoEm = episode.opened_at;
  base.diasInternado = Math.max(
    0,
    Math.floor((Date.now() - new Date(episode.opened_at).getTime()) / 86_400_000),
  );
  const hasAlta = exams.some((e) => e.tipo === "alta");
  base.status = hasAlta ? "alta-elaboracao" : "internado";

  const adm = exams.find((e) => e.tipo === "admissao");
  const diag = (adm?.data?.diagnostico ?? {}) as Record<string, string>;
  if (diag.sindromico || diag.nosologico || diag.cid) {
    base.diagnostico = {
      sindromico: diag.sindromico ?? "",
      nosologico: diag.nosologico ?? "",
      cid: diag.cid ?? "",
    };
  }

  const evols = exams.filter((e) => e.tipo === "evolucao");
  const lastEv = evols[evols.length - 1];
  if (lastEv) {
    const ev = (lastEv.data?.evolucao ?? {}) as Record<string, string>;
    base.ultimaEvolucao = {
      quando: lastEv.created_at,
      texto: (ev.a || ev.p || "").toString().trim(),
    };
    const sameDay =
      new Date(lastEv.created_at).toDateString() === new Date().toDateString();
    base.evolucoesPendentes = sameDay ? 0 : 1;
  } else {
    // Internado, mas ainda sem nenhuma evolução registrada ⇒ 1 pendente.
    base.evolucoesPendentes = 1;
  }
  return base;
}

patientsRouter.get("/patients/overview", async (req, res, next) => {
  try {
    const { rows: pats } = await query<Omit<PatientRow, "details">>(
      `SELECT id, name, external_id, summary, clinical, created_at, updated_at
       FROM patients ORDER BY updated_at DESC LIMIT 500`,
    );
    const ids = pats.map((p) => p.id);

    const epByPatient: Record<string, { id: string; opened_at: string; patient_id: string }> = {};
    const examsByEp: Record<string, OverviewExamRow[]> = {};
    if (ids.length > 0) {
      const { rows: eps } = await query<{ id: string; patient_id: string; opened_at: string }>(
        `SELECT id, patient_id, opened_at FROM episodes
         WHERE patient_id = ANY($1::uuid[]) AND tipo = 'internacao' AND status = 'aberto'
         ORDER BY opened_at DESC`,
        [ids],
      );
      // No máximo uma internação aberta por paciente; o ORDER mantém a mais recente.
      for (const e of eps) epByPatient[e.patient_id] ??= e;
      const epIds = eps.map((e) => e.id);
      if (epIds.length > 0) {
        const { rows: exs } = await query<OverviewExamRow>(
          `SELECT episode_id, tipo, seq, data, created_at FROM exams
           WHERE episode_id = ANY($1::uuid[])
           ORDER BY seq ASC NULLS LAST, created_at ASC`,
          [epIds],
        );
        for (const x of exs) (examsByEp[x.episode_id] ??= []).push(x);
      }
    }

    const overview = pats.map((p) =>
      buildOverview(p, epByPatient[p.id], examsByEp[epByPatient[p.id]?.id] ?? []),
    );
    await audit("READ", "patient", null, "overview", req.user?.email);
    res.json(overview);
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
    await audit("READ", "patient", req.params.id, null, req.user?.email);
    res.json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório."),
  externalId: z.string().trim().nullish(),
  details: detailsSchema.optional(),
  clinical: clinicalSchema.optional(),
});

patientsRouter.post("/patients", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { name, externalId, details, clinical } = parsed.data;
    const { rows } = await query<PatientRow>(
      `INSERT INTO patients (name, external_id, details, clinical)
       VALUES ($1, $2, $3::jsonb, $4::jsonb) RETURNING *`,
      [name, externalId || null, JSON.stringify(details ?? {}), JSON.stringify(clinical ?? {})],
    );
    await audit("CREATE", "patient", rows[0].id, name, req.user?.email);
    res.status(201).json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  externalId: z.string().trim().nullish(),
  summary: z.string().nullish(),
  details: detailsSchema.optional(),
  clinical: clinicalSchema.optional(),
});

patientsRouter.patch("/patients/:id", async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { name, externalId, summary, details, clinical } = parsed.data;
    const { rows } = await query<PatientRow>(
      `UPDATE patients SET
         name = COALESCE($2, name),
         external_id = COALESCE($3, external_id),
         summary = COALESCE($4, summary),
         -- MESCLA (||) os detalhes enviados sobre os existentes: um PATCH parcial
         -- (ex.: só telefone) preserva nascimento/CPF/endereço já salvos.
         details = CASE WHEN $5::jsonb IS NULL THEN details ELSE details || $5::jsonb END,
         clinical = CASE WHEN $6::jsonb IS NULL THEN clinical ELSE clinical || $6::jsonb END,
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [
        req.params.id,
        name ?? null,
        externalId ?? null,
        summary ?? null,
        details ? JSON.stringify(details) : null,
        clinical ? JSON.stringify(clinical) : null,
      ],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Paciente não encontrado." });
    await audit("UPDATE", "patient", req.params.id, null, req.user?.email);
    res.json(toPatient(rows[0]));
  } catch (err) {
    next(err);
  }
});

patientsRouter.delete("/patients/:id", async (req, res, next) => {
  try {
    // Conta os exames que serão removidos em cascata (rastreabilidade LGPD).
    const { rows: cnt } = await query<{ n: string }>(
      `SELECT count(*) AS n FROM exams WHERE patient_id = $1`,
      [req.params.id],
    );
    const { rowCount } = await query(`DELETE FROM patients WHERE id = $1`, [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Paciente não encontrado." });
    await audit(
      "DELETE",
      "patient",
      req.params.id,
      `${cnt[0]?.n ?? 0} exames removidos em cascata`,
      req.user?.email,
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
