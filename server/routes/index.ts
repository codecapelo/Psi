import { Router } from "express";
import { hasDb, pingDb } from "../db.ts";
import { hasAi, TEXT_MODEL } from "../openai.ts";
import { patientsRouter } from "./patients.ts";
import { examsRouter } from "./exams.ts";
import { aiRouter } from "./ai.ts";
import { auditRouter } from "./audit.ts";
import { mospRouter } from "./mosp.ts";
import { templatesRouter } from "./templates.ts";
import { privacyRouter } from "./privacy.ts";

export const apiRouter = Router();

apiRouter.get("/health", async (_req, res) => {
  const db = await pingDb();
  res.json({
    ok: true,
    db,
    dbConfigured: hasDb(),
    ai: hasAi(),
    model: hasAi() ? TEXT_MODEL : null,
    version: "2.0.0",
  });
});

apiRouter.use(patientsRouter);
apiRouter.use(examsRouter);
apiRouter.use(aiRouter);
apiRouter.use(auditRouter);
apiRouter.use(mospRouter);
apiRouter.use(templatesRouter);
apiRouter.use(privacyRouter);
