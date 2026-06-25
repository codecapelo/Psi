// ==========================================================================
// Gestão de usuários (profissionais) — todas as rotas exigem administrador.
// O admin (ADMIN_EMAIL) não fica no banco; aqui gerenciam-se os demais.
// ==========================================================================

import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";
import { requireAdmin, hashPassword } from "../auth.ts";

export const usersRouter = Router();

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

function toUser(r: UserRow) {
  return {
    id: r.id,
    email: r.email,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Erro de violação de unicidade do Postgres (e-mail duplicado).
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

// GET /users — lista (nunca expõe o hash de senha)
usersRouter.get("/users", requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await query<UserRow>(
      `SELECT id, email, created_at, updated_at FROM users ORDER BY email ASC`,
    );
    res.json(rows.map(toUser));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

// POST /users — cria um profissional
usersRouter.post("/users", requireAdmin, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    if (parsed.data.email === (process.env.ADMIN_EMAIL || "").trim().toLowerCase())
      return res
        .status(409)
        .json({ error: "Este e-mail é o do administrador (definido por env)." });

    const { rows } = await query<UserRow>(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       RETURNING id, email, created_at, updated_at`,
      [parsed.data.email, hashPassword(parsed.data.password)],
    );
    await audit("CREATE", "user", rows[0].id, parsed.data.email, req.user?.email);
    res.status(201).json(toUser(rows[0]));
  } catch (err) {
    if (isUniqueViolation(err))
      return res.status(409).json({ error: "Já existe um usuário com este e-mail." });
    next(err);
  }
});

const passwordSchema = z.object({
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

// PATCH /users/:id — redefine a senha
usersRouter.patch("/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { rows } = await query<UserRow>(
      `UPDATE users SET password_hash = $2, updated_at = now()
       WHERE id = $1 RETURNING id, email, created_at, updated_at`,
      [req.params.id, hashPassword(parsed.data.password)],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });
    await audit("UPDATE", "user", req.params.id, "senha redefinida", req.user?.email);
    res.json(toUser(rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /users/:id — remove
usersRouter.delete("/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM users WHERE id = $1`, [
      req.params.id,
    ]);
    if (!rowCount)
      return res.status(404).json({ error: "Usuário não encontrado." });
    await audit("DELETE", "user", req.params.id, null, req.user?.email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
