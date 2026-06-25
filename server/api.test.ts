import { beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

// Configura a autenticação ANTES de montar as rotas.
process.env.JWT_SECRET = "test-secret-com-tamanho-suficiente-1234567890";
process.env.AUTH_USERS = "dra.ana@clinica.com:senhaForte123";

const { apiRouter } = await import("./routes/index.ts");
const { __resetAuthCache } = await import("./auth.ts");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", apiRouter);
  return app;
}

const app = makeApp();

beforeAll(() => {
  __resetAuthCache();
});

describe("rotas públicas", () => {
  it("GET /api/health responde 200 sem autenticação", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.db).toBe(false); // sem DATABASE_URL no teste
  });

  it("GET /api/auth/config indica que o login é exigido", async () => {
    const res = await request(app).get("/api/auth/config");
    expect(res.status).toBe(200);
    expect(res.body.authRequired).toBe(true);
  });
});

describe("gate de autenticação", () => {
  it("GET /api/auth/me sem token → 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login com senha errada → 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "dra.ana@clinica.com", password: "errada" });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login válido → token; e /auth/me passa com Bearer", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "dra.ana@clinica.com", password: "senhaForte123" });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe("string");

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("dra.ana@clinica.com");
  });

  it("rejeita Bearer inválido", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token.invalido.aqui");
    expect(res.status).toBe(401);
  });
});
