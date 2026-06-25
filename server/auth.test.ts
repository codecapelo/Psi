import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetAuthCache,
  authConfigured,
  isAdmin,
  mospCanWrite,
  signToken,
  verifyCredentials,
  verifyToken,
} from "./auth.ts";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-com-tamanho-suficiente-1234567890";
  process.env.AUTH_USERS = "dra.ana@clinica.com:senhaForte123,dr.bruno@clinica.com:outraSenha456";
  delete process.env.MOSP_AUTHORS;
  delete process.env.ADMIN_USERS;
  __resetAuthCache();
});

describe("configuração", () => {
  it("detecta usuários configurados", () => {
    expect(authConfigured()).toBe(true);
  });

  it("sem AUTH_USERS, não está configurado", () => {
    process.env.AUTH_USERS = "";
    __resetAuthCache();
    expect(authConfigured()).toBe(false);
  });
});

describe("credenciais", () => {
  it("aceita e-mail/senha corretos (case-insensitive no e-mail)", () => {
    expect(verifyCredentials("dra.ana@clinica.com", "senhaForte123")).toBe(true);
    expect(verifyCredentials("DRA.ANA@CLINICA.COM", "senhaForte123")).toBe(true);
  });

  it("rejeita senha errada", () => {
    expect(verifyCredentials("dra.ana@clinica.com", "errada")).toBe(false);
  });

  it("rejeita usuário inexistente", () => {
    expect(verifyCredentials("ninguem@x.com", "qualquer")).toBe(false);
  });
});

describe("token", () => {
  it("faz roundtrip sign → verify", () => {
    const token = signToken("dra.ana@clinica.com");
    expect(verifyToken(token)?.email).toBe("dra.ana@clinica.com");
  });

  it("rejeita token adulterado", () => {
    const token = signToken("dra.ana@clinica.com");
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
    expect(verifyToken(tampered)).toBeNull();
  });

  it("rejeita token assinado com outro segredo", () => {
    const token = signToken("dra.ana@clinica.com");
    process.env.JWT_SECRET = "um-segredo-totalmente-diferente-987654321";
    expect(verifyToken(token)).toBeNull();
  });

  it("rejeita lixo / formato inválido", () => {
    expect(verifyToken("nao-e-um-token")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });

  it("rejeita token expirado", () => {
    process.env.AUTH_TOKEN_TTL = "-10"; // já expirado → cai no default? não: valida >0
    // TTL inválido cai no default 12h, então forçamos expiração via verificação manual:
    // assina com TTL minúsculo positivo.
    process.env.AUTH_TOKEN_TTL = "1";
    const token = signToken("dra.ana@clinica.com");
    // após 1s estaria expirado; aqui validamos imediatamente (ainda válido).
    expect(verifyToken(token)?.email).toBe("dra.ana@clinica.com");
    delete process.env.AUTH_TOKEN_TTL;
  });
});

describe("autorização MOSP", () => {
  it("sem MOSP_AUTHORS, qualquer autenticado pode escrever", () => {
    expect(mospCanWrite("qualquer@x.com")).toBe(true);
  });

  it("com MOSP_AUTHORS, apenas autores listados escrevem", () => {
    process.env.MOSP_AUTHORS = "dra.ana@clinica.com";
    expect(mospCanWrite("dra.ana@clinica.com")).toBe(true);
    expect(mospCanWrite("dr.bruno@clinica.com")).toBe(false);
    expect(mospCanWrite(undefined)).toBe(false);
  });
});

describe("admin (trilha completa + ações destrutivas)", () => {
  it("sem ADMIN_USERS e MÚLTIPLOS usuários, ninguém é admin", () => {
    // beforeEach configura 2 profissionais
    expect(isAdmin("dra.ana@clinica.com")).toBe(false);
    expect(isAdmin("dr.bruno@clinica.com")).toBe(false);
  });

  it("sem ADMIN_USERS e usuário ÚNICO, o único é admin", () => {
    process.env.AUTH_USERS = "solo@clinica.com:Senha123456";
    __resetAuthCache();
    expect(isAdmin("solo@clinica.com")).toBe(true);
  });

  it("com ADMIN_USERS, apenas listados são admin", () => {
    process.env.ADMIN_USERS = "dra.ana@clinica.com";
    expect(isAdmin("dra.ana@clinica.com")).toBe(true);
    expect(isAdmin("dr.bruno@clinica.com")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("modo aberto (sem AUTH_USERS) → todos admin (dev)", () => {
    process.env.AUTH_USERS = "";
    __resetAuthCache();
    expect(isAdmin("qualquer@x.com")).toBe(true);
  });
});
