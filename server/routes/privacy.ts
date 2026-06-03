import { Router } from "express";
import { query, audit } from "../db.ts";

export const privacyRouter = Router();

/**
 * Direito ao Esquecimento (LGPD): apaga TODOS os dados clínicos.
 * Pacientes em cascata removem exames. Memórias e templates de usuário também
 * são removidos; modelos pré-instalados (builtin) são preservados.
 */
privacyRouter.post("/privacy/wipe", async (_req, res, next) => {
  try {
    await query(`DELETE FROM exams`);
    await query(`DELETE FROM patients`);
    await query(`DELETE FROM mosp_memories`);
    await query(`DELETE FROM report_templates WHERE builtin = false`);
    // Mantém o registro do próprio apagamento por compliance.
    await query(`DELETE FROM audit_log`);
    await audit("DELETE", "all", null, "Direito ao esquecimento (LGPD)");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
