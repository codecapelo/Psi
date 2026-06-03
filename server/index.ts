import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { apiRouter } from "./routes/index.ts";
import { initDb, DbNotConfiguredError } from "./db.ts";
import { AiNotConfiguredError } from "./openai.ts";

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const BUILD_DIR = path.resolve(process.cwd(), "app/build");
const INDEX_HTML = path.join(BUILD_DIR, "index.html");

app.use(cors());
app.use(express.json({ limit: "5mb" }));

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
