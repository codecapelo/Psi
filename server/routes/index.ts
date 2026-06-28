import { Router } from "express";
import { hasDb, pingDb } from "../db.ts";
import { hasAi, TEXT_MODEL } from "../openai.ts";
import { authRouter, requireAuth, isAdmin } from "../auth.ts";
import { patientsRouter } from "./patients.ts";
import { examsRouter } from "./exams.ts";
import { episodesRouter } from "./episodes.ts";
import { prescriptionsRouter } from "./prescriptions.ts";
import { agendaRouter } from "./agenda.ts";
import { notificationsRouter } from "./notifications.ts";
import { aiRouter } from "./ai.ts";
import { auditRouter } from "./audit.ts";
import { mospRouter } from "./mosp.ts";
import { templatesRouter } from "./templates.ts";
import { privacyRouter } from "./privacy.ts";
import { usersRouter } from "./users.ts";

export const apiRouter = Router();

// ---- Rotas públicas (sem autenticação) ----
apiRouter.get("/health", async (_req, res) => {
  const db = await pingDb();
  res.json({
    ok: true,
    db,
    dbConfigured: hasDb(),
    ai: hasAi(),
    model: hasAi() ? TEXT_MODEL : null,
    version: "2.1.0",
  });
});

// /auth/config e /auth/login são públicos.
apiRouter.use(authRouter);

// ---- A partir daqui, tudo exige autenticação (quando há admin configurado) ----
apiRouter.use(requireAuth);

// Identidade do usuário autenticado (inclui se é administrador).
apiRouter.get("/auth/me", (req, res) => {
  const email = req.user?.email ?? null;
  res.json({ user: email ? { email, isAdmin: isAdmin(email) } : null });
});

apiRouter.use(patientsRouter);
apiRouter.use(examsRouter);
apiRouter.use(episodesRouter);
apiRouter.use(prescriptionsRouter);
apiRouter.use(agendaRouter);
apiRouter.use(notificationsRouter);
apiRouter.use(aiRouter);
apiRouter.use(auditRouter);
apiRouter.use(mospRouter);
apiRouter.use(templatesRouter);
apiRouter.use(privacyRouter);
apiRouter.use(usersRouter);
