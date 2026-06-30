import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

// Configura o admin ANTES de montar as rotas.
process.env.JWT_SECRET = "test-secret-com-tamanho-suficiente-1234567890";
process.env.ADMIN_EMAIL = "admin@clinica.com";
process.env.ADMIN_PASSWORD = "SenhaDoAdmin!23";

const { apiRouter } = await import("./routes/index.ts");
const { signToken } = await import("./auth.ts");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", apiRouter);
  return app;
}

const app = makeApp();

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

  it("POST /api/auth/login (admin) com senha errada → 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@clinica.com", password: "errada" });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login (admin) válido → token; /auth/me retorna isAdmin", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@clinica.com", password: "SenhaDoAdmin!23" });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe("string");
    expect(login.body.user.isAdmin).toBe(true);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("admin@clinica.com");
    expect(me.body.user.isAdmin).toBe(true);
  });

  it("rejeita Bearer inválido", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token.invalido.aqui");
    expect(res.status).toBe(401);
  });
});

describe("rotas 2.0 (agenda, notificações, prescrição, overview)", () => {
  const auth = `Bearer ${signToken("profissional@clinica.com")}`;
  const paths = [
    "/api/agenda",
    "/api/notifications",
    "/api/patients/overview",
    "/api/patients/00000000-0000-0000-0000-000000000000/prescription",
  ];

  it("exigem autenticação (401 sem token)", async () => {
    for (const path of paths) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });

  it("estão registradas (autenticadas não dão 404)", async () => {
    // Sem DATABASE_URL a consulta falha (503/500), mas a rota EXISTE e passou
    // pelo gate de auth — o que confirma o registro em routes/index.ts.
    for (const path of paths) {
      const res = await request(app).get(path).set("Authorization", auth);
      expect(res.status).not.toBe(404);
    }
  });
});

describe("autorização do admin", () => {
  // Token de um usuário NÃO-admin (não toca o banco no gate requireAdmin).
  const naoAdmin = `Bearer ${signToken("profissional@clinica.com")}`;

  it("GET /api/users por não-admin → 403", async () => {
    const res = await request(app).get("/api/users").set("Authorization", naoAdmin);
    expect(res.status).toBe(403);
  });

  it("POST /api/privacy/wipe por não-admin → 403", async () => {
    const res = await request(app)
      .post("/api/privacy/wipe")
      .set("Authorization", naoAdmin);
    expect(res.status).toBe(403);
  });

  it("GET /api/audit por não-admin → 403", async () => {
    const res = await request(app).get("/api/audit").set("Authorization", naoAdmin);
    expect(res.status).toBe(403);
  });
});
