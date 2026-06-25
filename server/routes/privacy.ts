import { Router } from "express";
import { pool, DbNotConfiguredError } from "../db.ts";

export const privacyRouter = Router();

/**
 * Direito ao Esquecimento (LGPD): apaga TODOS os dados clínicos.
 * Pacientes em cascata removem exames. Memórias e templates de usuário também
 * são removidos; modelos pré-instalados (builtin) são preservados.
 *
 * Tudo roda numa transação atômica: ou apaga e registra o comprovante, ou nada
 * muda. O comprovante (audit_log) inclui as contagens do que foi removido —
 * exigível como prova de exclusão (LGPD Art. 16/18).
 */
privacyRouter.post("/privacy/wipe", async (req, res, next) => {
  if (!pool) return next(new DbNotConfiguredError());
  const actor = req.user?.email ?? null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{
      patients: string;
      exams: string;
      mosp: string;
      templates: string;
    }>(
      `SELECT
         (SELECT count(*) FROM patients) AS patients,
         (SELECT count(*) FROM exams) AS exams,
         (SELECT count(*) FROM mosp_memories) AS mosp,
         (SELECT count(*) FROM report_templates WHERE builtin = false) AS templates`,
    );
    const c = rows[0];
    const summary =
      `Direito ao esquecimento (LGPD): ${c.patients} pacientes, ${c.exams} exames, ` +
      `${c.mosp} memórias MOSP e ${c.templates} modelos removidos.`;

    await client.query(`DELETE FROM exams`);
    await client.query(`DELETE FROM patients`);
    await client.query(`DELETE FROM mosp_memories`);
    await client.query(`DELETE FROM report_templates WHERE builtin = false`);
    // A trilha antiga também é dado pessoal e é apagada; em seguida gravamos o
    // comprovante do próprio apagamento (com contagens e ator).
    await client.query(`DELETE FROM audit_log`);
    await client.query(
      `INSERT INTO audit_log (action, entity, entity_id, detail, actor)
       VALUES ('DELETE', 'all', NULL, $1, $2)`,
      [summary, actor],
    );

    await client.query("COMMIT");
    res.json({ ok: true, summary });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});
