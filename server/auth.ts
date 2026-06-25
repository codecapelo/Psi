// ==========================================================================
// Autenticação — admin via env + demais usuários no banco.
//
//   • ADMIN_EMAIL / ADMIN_PASSWORD  → o ÚNICO administrador (vem do ambiente).
//     O admin vê a trilha completa, gerencia usuários, edita o MOSP e pode
//     apagar todos os dados (LGPD).
//   • Tabela `users` (Postgres)       → demais profissionais. Senhas com hash
//     scrypt (salt aleatório). Criados/gerenciados pelo admin em /api/users.
//
// Token de sessão: HS256 assinado só com o módulo `crypto` do Node (sem deps).
// Boot gracioso: sem ADMIN_EMAIL/ADMIN_PASSWORD a API fica ABERTA (apenas dev),
// com aviso no console.
//
// Variáveis de ambiente:
//   ADMIN_EMAIL      e-mail do administrador
//   ADMIN_PASSWORD   senha do administrador
//   JWT_SECRET       segredo para assinar tokens (>=32 chars; senão, efêmero)
//   AUTH_TOKEN_TTL   validade do token em segundos (padrão 43200 = 12h)
// ==========================================================================

import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { audit, hasDb, query } from "./db.ts";

export interface AuthUser {
  email: string;
}

// Augmenta o Request do Express com o usuário autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// --------------------------------------------------------------------------
// Admin (env)
// --------------------------------------------------------------------------

function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

/** Há um administrador configurado (e portanto a API exige autenticação)? */
export function authConfigured(): boolean {
  return !!adminEmail() && !!adminPassword();
}

/** É o administrador? Em modo aberto (dev, sem admin), todos são admin. */
export function isAdmin(email?: string | null): boolean {
  if (!authConfigured()) return true; // modo aberto (dev)
  const a = adminEmail();
  return !!email && email.trim().toLowerCase() === a;
}

// --------------------------------------------------------------------------
// Senhas — hash scrypt (usuários do banco) e comparação em tempo constante
// --------------------------------------------------------------------------

/** Gera um hash scrypt no formato `scrypt$<saltHex>$<hashHex>`. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Verifica uma senha contra um hash scrypt, em tempo constante. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = (stored || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (expected.length === 0) return false;
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

/** Compara a senha do admin (texto no env) em tempo constante. */
function adminPasswordMatches(password: string): boolean {
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(adminPassword()).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Autentica um e-mail/senha. Verifica primeiro o admin (env); depois, os
 * usuários do banco. Retorna a identidade ou null.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const e = (email || "").trim().toLowerCase();
  if (!e || !password) return null;

  if (adminEmail() && e === adminEmail()) {
    return adminPasswordMatches(password) ? { email: e } : null;
  }

  if (!hasDb()) return null;
  const { rows } = await query<{ email: string; password_hash: string }>(
    `SELECT email, password_hash FROM users WHERE email = $1`,
    [e],
  );
  if (rows.length === 0) return null;
  return verifyPassword(password, rows[0].password_hash)
    ? { email: rows[0].email }
    : null;
}

// --------------------------------------------------------------------------
// Token (HS256 / JWT compacto)
// --------------------------------------------------------------------------

const EPHEMERAL_SECRET = crypto.randomBytes(48).toString("hex");
let warnedEphemeral = false;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 32) return s;
  if (!warnedEphemeral) {
    console.warn(
      "[auth] JWT_SECRET ausente ou curto (< 32 chars) — usando segredo EFÊMERO. " +
        "Os tokens deixarão de valer a cada reinício. Defina JWT_SECRET (>=32 chars " +
        "aleatórios, ex.: openssl rand -hex 32) em produção.",
    );
    warnedEphemeral = true;
  }
  return EPHEMERAL_SECRET;
}

function ttlSeconds(): number {
  const n = Number(process.env.AUTH_TOKEN_TTL);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 43_200; // 12h
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function hmac(data: string): Buffer {
  return crypto.createHmac("sha256", secret()).update(data).digest();
}

export function signToken(email: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: email, iat: now, exp: now + ttlSeconds() };
  const data = `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(
    Buffer.from(JSON.stringify(payload)),
  )}`;
  return `${data}.${b64url(hmac(data))}`;
}

export function verifyToken(token: string): AuthUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const expected = hmac(data);
  const actual = b64urlDecode(parts[2]);
  if (expected.length !== actual.length) return null;
  if (!crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(parts[1]).toString("utf8")) as {
      sub?: string;
      exp?: number;
    };
    if (!payload.sub) return null;
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return { email: payload.sub };
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// Middlewares
// --------------------------------------------------------------------------

let warnedNoAuth = false;

/** Exige token válido quando há admin configurado. */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!authConfigured()) {
    if (!warnedNoAuth) {
      console.warn(
        "[auth] ADMIN_EMAIL/ADMIN_PASSWORD ausentes — a API está SEM AUTENTICAÇÃO. " +
          "Configure o admin antes de expor o app (dados clínicos / LGPD).",
      );
      warnedNoAuth = true;
    }
    req.user = { email: "sistema" };
    return next();
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: "Não autenticado. Faça login novamente." });
    return;
  }
  req.user = payload;
  next();
}

/** Restringe a ação ao administrador. */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAdmin(req.user?.email)) {
    res.status(403).json({ error: "Ação restrita ao administrador." });
    return;
  }
  next();
}

// --------------------------------------------------------------------------
// Rotas públicas de autenticação
// --------------------------------------------------------------------------

export const authRouter = Router();

/** Informa ao frontend se o login é exigido. */
authRouter.get("/auth/config", (_req, res) => {
  res.json({ authRequired: authConfigured() });
});

authRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = (req.body ?? {}) as {
      email?: unknown;
      password?: unknown;
    };
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }
    if (!authConfigured()) {
      return res
        .status(400)
        .json({ error: "Autenticação não configurada no servidor." });
    }
    const user = await authenticate(email, password);
    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }
    void audit("CREATE", "session", null, "login", user.email);
    return res.json({
      token: signToken(user.email),
      user: { email: user.email, isAdmin: isAdmin(user.email) },
      expiresIn: ttlSeconds(),
    });
  } catch (err) {
    console.error("[auth] erro no login:", err);
    return res.status(500).json({ error: "Erro ao autenticar." });
  }
});
