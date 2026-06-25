import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { apiRouter } from "./routes/index.ts";
import { initDb, DbNotConfiguredError } from "./db.ts";
import { AiNotConfiguredError } from "./openai.ts";

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const BUILD_DIR = path.resolve(process.cwd(), "app/build");
const INDEX_HTML = path.join(BUILD_DIR, "index.html");

// Atrás do proxy do Railway: confia no primeiro hop para o rate-limit ler o
// IP real (X-Forwarded-For).
app.set("trust proxy", 1);

// ---- Segurança HTTP (helmet) ----
// CSP afinada para o SPA (pdf.js usa workers/blobs; recharts usa estilos
// inline). Se algum recurso quebrar, defina HELMET_CSP=off para diagnosticar.
const cspEnabled = process.env.HELMET_CSP !== "off";
app.use(
  helmet({
    contentSecurityPolicy: cspEnabled
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            frameAncestors: ["'self'"],
            baseUri: ["'self'"],
          },
        }
      : false,
    // pdf.js gera workers a partir de blobs; COEP atrapalharia.
    crossOriginEmbedderPolicy: false,
  }),
);

// ---- CORS ----
// Por padrão a API é same-origin (o próprio Express serve o frontend).
// Cross-origin só é permitido se CORS_ORIGIN listar as origens explicitamente.
let corsAllow = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// "*" abriria a API para qualquer origem (perigoso com dados clínicos/token em
// localStorage). Recusamos e voltamos a same-origin, com aviso explícito.
if (corsAllow.includes("*")) {
  console.warn(
    "[cors] CORS_ORIGIN='*' é inseguro com dados clínicos — ignorado. " +
      "Liste origens explícitas (ex.: https://clinica.com.br). Voltando a same-origin.",
  );
  corsAllow = [];
}
app.use(cors({ origin: corsAllow.length ? corsAllow : false }));

app.use(express.json({ limit: "5mb" }));

// ---- Rate limiting ----
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de requisições de IA atingido. Aguarde um momento." },
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/ai", aiLimiter);
app.use("/api", apiLimiter);

// ---- API ----
app.use("/api", apiRouter);

// 404 para rotas /api desconhecidas (antes do fallback do SPA).
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Rota de API não encontrada." });
});

// ---- Frontend estático (app/build) ----
app.use(express.static(BUILD_DIR));

// Fallback do SPA: devolve index.html para qualquer rota não-API.
app.get("*", (_req, res) => {
  if (fs.existsSync(INDEX_HTML)) {
    res.sendFile(INDEX_HTML);
  } else {
    res
      .status(200)
      .type("text/plain")
      .send(
        "SOPsi 2.0 — frontend ainda não compilado. Rode 'npm run build' (ou use o Vite em dev na porta 5173).",
      );
  }
});

// ---- Tratamento de erros ----
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof DbNotConfiguredError || err instanceof AiNotConfiguredError) {
    return res.status(503).json({ error: err.message });
  }
  console.error("[erro]", err);
  const message =
    err instanceof Error ? err.message : "Erro interno do servidor.";
  res.status(500).json({ error: message });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`\n  SOPsi 2.0 — servidor em http://localhost:${PORT}`);
    console.log(`  Frontend: ${fs.existsSync(INDEX_HTML) ? "servindo app/build" : "não compilado (use vite dev)"}`);
    console.log("");
  });
}

void start();
