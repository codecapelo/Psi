import { beforeEach, describe, expect, it } from "vitest";
import {
  authConfigured,
  authenticate,
  hashPassword,
  isAdmin,
  signToken,
  verifyPassword,
  verifyToken,
} from "./auth.ts";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-com-tamanho-suficiente-1234567890";
  process.env.ADMIN_EMAIL = "admin@clinica.com";
  process.env.ADMIN_PASSWORD = "SenhaDoAdmin!23";
});

describe("configuração", () => {
  it("detecta admin configurado", () => {
    expect(authConfigured()).toBe(true);
  });

  it("sem ADMIN_EMAIL/ADMIN_PASSWORD, não está configurado", () => {
    delete process.env.ADMIN_EMAIL;
    expect(authConfigured()).toBe(false);
  });
});

describe("hash de senha (scrypt)", () => {
  it("faz roundtrip hash → verify", () => {
    const stored = hashPassword("minhaSenha123");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("minhaSenha123", stored)).toBe(true);
    expect(verifyPassword("errada", stored)).toBe(false);
  });

  it("hashes diferentes para a mesma senha (salt aleatório)", () => {
    expect(hashPassword("igual")).not.toBe(hashPassword("igual"));
  });

  it("rejeita formato inválido", () => {
    expect(verifyPassword("x", "lixo")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("autenticação do admin (env)", () => {
  it("aceita admin com senha correta (e-mail case-insensitive)", async () => {
    expect((await authenticate("admin@clinica.com", "SenhaDoAdmin!23"))?.email).toBe(
      "admin@clinica.com",
    );
    expect((await authenticate("ADMIN@CLINICA.COM", "SenhaDoAdmin!23"))?.email).toBe(
      "admin@clinica.com",
    );
  });

  it("rejeita admin com senha errada", async () => {
    expect(await authenticate("admin@clinica.com", "errada")).toBeNull();
  });

  it("usuário não-admin sem banco → null (não há tabela acessível)", async () => {
    expect(await authenticate("outro@clinica.com", "qualquer")).toBeNull();
  });
});

describe("isAdmin", () => {
  it("apenas o ADMIN_EMAIL é admin", () => {
    expect(isAdmin("admin@clinica.com")).toBe(true);
    expect(isAdmin("ADMIN@CLINICA.COM")).toBe(true);
    expect(isAdmin("outro@clinica.com")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("modo aberto (sem admin) → todos são admin (dev)", () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    expect(isAdmin("qualquer@x.com")).toBe(true);
  });
});

describe("token", () => {
  it("faz roundtrip sign → verify", () => {
    const token = signToken("admin@clinica.com");
    expect(verifyToken(token)?.email).toBe("admin@clinica.com");
  });

  it("rejeita token adulterado", () => {
    const token = signToken("admin@clinica.com");
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
    expect(verifyToken(tampered)).toBeNull();
  });

  it("rejeita token assinado com outro segredo", () => {
    const token = signToken("admin@clinica.com");
    process.env.JWT_SECRET = "um-segredo-totalmente-diferente-987654321";
    expect(verifyToken(token)).toBeNull();
  });

  it("rejeita lixo / formato inválido", () => {
    expect(verifyToken("nao-e-um-token")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });
});
