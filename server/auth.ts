// ==========================================================================
// Autenticação — login por e-mail/senha + token assinado (HS256/JWT).
//
// Filosofia de "boot gracioso" do SOPsi: a app sobe mesmo sem credenciais.
//   • AUTH_USERS definido  → /api/* exige Bearer token válido (produção).
//   • AUTH_USERS ausente    → API SEM autenticação (apenas dev local); um aviso
//                             é emitido no console. NUNCA exponha assim em produção.
//
// Sem dependências externas: usa apenas o módulo `crypto` nativo do Node
// (HMAC-SHA256 para o token; comparação de senha em tempo constante com
// sha256 + timingSafeEqual). As senhas residem em AUTH_USERS — esse env é o
// "cofre" do operador e deve ser protegido (nunca commitar, restringir acesso).
// Variáveis de ambiente:
//   AUTH_USERS       "email:senha,email2:senha2"  (lista de profissionais)
//   JWT_SECRET       segredo para assinar tokens (>=32 chars; senão, efêmero)
//   AUTH_TOKEN_TTL   validade do token em segundos (padrão 43200 = 12h)
//   MOSP_AUTHORS     e-mails com permissão de escrita no MOSP (vazio = todos)
//   AUDIT_ADMINS     e-mails que veem a trilha completa (vazio = todos veem)
// ==========================================================================

import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { audit } from "./db.ts";

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
// Configuração (lida de env; memoizada, com reset para testes)
// --------------------------------------------------------------------------

let _usersCache: Map<string, string> | null = null;

function parseUsers(): Map<string, string> {
  const raw = process.env.AUTH_USERS || "";
  const map = new Map<string, string>();
  for (const pair of raw.split(",")) {
    const idx = pair.indexOf(":");
    if (idx <= 0) continue;
    const email = pair.slice(0, idx).trim().toLowerCase();
    const password = pair.slice(idx + 1); // senha pode conter ":"
    if (email && password) map.set(email, password);
  }
  return map;
}

function users(): Map<string, string> {
  if (!_usersCache) _usersCache = parseUsers();
  return _usersCache;
}

/** Reseta o cache de configuração (uso em testes após mudar env). */
export function __resetAuthCache(): void {
  _usersCache = null;
}

/** true quando há ao menos um usuário configurado (AUTH_USERS). */
export function authConfigured(): boolean {
  return users().size > 0;
}

// Segredo efêmero do processo (fallback quando JWT_SECRET não está definido).
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

// --------------------------------------------------------------------------
// Helpers base64url
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// Senha — comparação em tempo constante (sha256 + timingSafeEqual)
// --------------------------------------------------------------------------

export function verifyCredentials(email: string, password: string): boolean {
  const expected = users().get(email.trim().toLowerCase());
  if (!expected) {
    // Comparação dummy para mitigar timing attack mesmo sem usuário.
    crypto.createHash("sha256").update(password).digest();
    return false;
  }
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// --------------------------------------------------------------------------
// Token (HS256 / JWT compacto)
// --------------------------------------------------------------------------

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
// Middleware
// --------------------------------------------------------------------------

let warnedNoAuth = false;

/** Exige token válido quando AUTH_USERS está configurado. */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!authConfigured()) {
    if (!warnedNoAuth) {
      console.warn(
        "[auth] AUTH_USERS ausente — a API está SEM AUTENTICAÇÃO. " +
          "Defina AUTH_USERS antes de expor o app (dados clínicos / LGPD).",
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

// --------------------------------------------------------------------------
// Autorização do MOSP (escrita restrita a MOSP_AUTHORS, se definido)
// --------------------------------------------------------------------------

export function mospCanWrite(email?: string): boolean {
  const authors = (process.env.MOSP_AUTHORS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (authors.length === 0) return true; // não restrito
  if (!email) return false;
  return authors.includes(email.trim().toLowerCase());
}

/**
 * Quem pode ver a trilha de auditoria completa. Se AUDIT_ADMINS estiver vazio,
 * todos os autenticados veem tudo (compatível com instalações de usuário único);
 * se definido, apenas os listados — os demais veem só as próprias ações.
 */
export function isAuditAdmin(email?: string | null): boolean {
  const admins = (process.env.AUDIT_ADMINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (admins.length === 0) return true;
  if (!email) return false;
  return admins.includes(email.trim().toLowerCase());
}

/** Middleware: bloqueia escrita no MOSP para quem não é autor. */
export function requireMospAuthor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!mospCanWrite(req.user?.email)) {
    res.status(403).json({
      error: "Sem permissão para editar memórias clínicas (MOSP).",
    });
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

authRouter.post("/auth/login", (req, res) => {
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
  if (!verifyCredentials(email, password)) {
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }
  const normalized = email.trim().toLowerCase();
  // Registra o início de sessão na trilha (best-effort; no-op sem banco).
  void audit("CREATE", "session", null, "login", normalized);
  return res.json({
    token: signToken(normalized),
    user: { email: normalized },
    expiresIn: ttlSeconds(),
  });
});
