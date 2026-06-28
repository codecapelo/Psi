// ==========================================================================
// Cliente de API central — todas as chamadas ao backend Express passam aqui.
// ==========================================================================

import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiTranscriptionResponse,
  Appointment,
  AppointmentTipo,
  AuditEntry,
  AuthUser,
  EncounterTipo,
  Episode,
  EpisodeTipo,
  EpisodeWithExams,
  Exam,
  ExamData,
  ExamWithPatient,
  LoginResponse,
  MospMemory,
  Notification,
  NotificationTipo,
  Patient,
  PatientClinical,
  PatientOverview,
  Prescription,
  PrescriptionItem,
  ReportTemplate,
  User,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// --------------------------------------------------------------------------
// Token de autenticação (armazenado no localStorage)
// --------------------------------------------------------------------------
const TOKEN_KEY = "sopsi_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage indisponível */
  }
}

/** Disparado quando o backend responde 401 — a UI redireciona para login. */
export function onUnauthorized(): void {
  setToken(null);
  window.dispatchEvent(new CustomEvent("sopsi:unauthorized"));
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
    ...options,
  });

  if (res.status === 401) {
    onUnauthorized();
  }

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error || body?.message || message;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --------------------------------------------------------------------------
// Autenticação
// --------------------------------------------------------------------------
export const auth = {
  config: () => request<{ authRequired: boolean }>("/auth/config"),
  me: () => request<{ user: AuthUser | null }>("/auth/me"),
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// --------------------------------------------------------------------------
// Health
// --------------------------------------------------------------------------
export const health = () =>
  request<{ ok: boolean; db: boolean; ai: boolean; version: string }>(
    "/health",
  );

// --------------------------------------------------------------------------
// Pacientes
// --------------------------------------------------------------------------
export const patients = {
  list: (search?: string) =>
    request<Patient[]>(
      `/patients${search ? `?q=${encodeURIComponent(search)}` : ""}`,
    ),
  /** Lista enriquecida (status/dias/diagnóstico/última evolução) p/ painel e lista. */
  overview: () => request<PatientOverview[]>("/patients/overview"),
  get: (id: string) => request<Patient>(`/patients/${id}`),
  create: (data: {
    name: string;
    externalId?: string | null;
    details?: Patient["details"];
    clinical?: PatientClinical;
  }) =>
    request<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Patient>) =>
    request<Patient>(`/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/patients/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// Prescrição
// --------------------------------------------------------------------------
export const prescriptions = {
  /** Prescrição vigente do paciente (ou null se ainda não há nenhuma). */
  get: (patientId: string) =>
    request<Prescription | null>(`/patients/${patientId}/prescription`),
  upsert: (patientId: string, items: PrescriptionItem[], episodeId?: string | null) =>
    request<Prescription>(`/patients/${patientId}/prescription`, {
      method: "PUT",
      body: JSON.stringify({ items, episodeId: episodeId ?? null }),
    }),
  lock: (id: string) =>
    request<Prescription>(`/prescriptions/${id}/lock`, { method: "POST" }),
};

// --------------------------------------------------------------------------
// Agenda
// --------------------------------------------------------------------------
export const agenda = {
  list: (date?: string) =>
    request<Appointment[]>(`/agenda${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  create: (data: {
    tipo: AppointmentTipo;
    titulo: string;
    local?: string | null;
    scheduledAt?: string;
    patientId?: string | null;
  }) => request<Appointment>("/agenda", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<Appointment, "tipo" | "titulo" | "local" | "scheduledAt" | "done">>) =>
    request<Appointment>(`/agenda/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/agenda/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// Notificações
// --------------------------------------------------------------------------
export const notifications = {
  list: () => request<Notification[]>("/notifications"),
  create: (data: { tipo: NotificationTipo; titulo: string; descricao?: string | null; patientId?: string | null }) =>
    request<Notification>("/notifications", { method: "POST", body: JSON.stringify(data) }),
  markRead: (id: string) => request<Notification>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request<void>("/notifications/read-all", { method: "POST" }),
};

// --------------------------------------------------------------------------
// Exames
// --------------------------------------------------------------------------
export const exams = {
  listByPatient: (patientId: string) =>
    request<Exam[]>(`/patients/${patientId}/exams`),
  get: (id: string) => request<ExamWithPatient>(`/exams/${id}`),
  create: (patientId: string) =>
    request<Exam>(`/patients/${patientId}/exams`, { method: "POST" }),
  /** Salva (merge) uma fatia do JSON do exame. */
  patchData: (id: string, data: ExamData) =>
    request<Exam>(`/exams/${id}/data`, {
      method: "PATCH",
      body: JSON.stringify({ data }),
    }),
  setStatus: (id: string, status: Exam["status"]) =>
    request<Exam>(`/exams/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  /** Assina o atendimento: torna-o imutável e gera o hash de integridade. */
  lock: (id: string) => request<Exam>(`/exams/${id}/lock`, { method: "POST" }),
  remove: (id: string) => request<void>(`/exams/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// Episódios de cuidado (camada longitudinal)
// --------------------------------------------------------------------------
export const episodes = {
  listByPatient: (patientId: string) =>
    request<EpisodeWithExams[]>(`/patients/${patientId}/episodes`),
  create: (patientId: string, data: { tipo: EpisodeTipo; titulo?: string | null }) =>
    request<Episode>(`/patients/${patientId}/episodes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** Abre uma internação (episódio + admissão) atomicamente; devolve a admissão. */
  startInternacao: (patientId: string) =>
    request<Exam>(`/patients/${patientId}/internacao`, { method: "POST" }),
  /** Cria um atendimento dentro do episódio (evolução já vem semeada). */
  addExam: (episodeId: string, tipo: EncounterTipo) =>
    request<Exam>(`/episodes/${episodeId}/exams`, {
      method: "POST",
      body: JSON.stringify({ tipo }),
    }),
  update: (id: string, data: { status?: "aberto" | "encerrado"; titulo?: string | null }) =>
    request<Episode>(`/episodes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  /** Descarta um episódio inteiro (bloqueado se tiver atendimento assinado). */
  remove: (id: string) => request<void>(`/episodes/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// IA
// --------------------------------------------------------------------------
export const ai = {
  complete: (body: AiCompletionRequest) =>
    request<AiCompletionResponse>("/ai/complete", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  transcribe: async (audio: Blob): Promise<AiTranscriptionResponse> => {
    const form = new FormData();
    form.append("audio", audio, "audio.webm");
    const res = await fetch("/api/ai/transcribe", {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (res.status === 401) onUnauthorized();
    if (!res.ok) {
      let message = `Erro ${res.status}`;
      try {
        message = (await res.json())?.error || message;
      } catch {
        /* */
      }
      throw new ApiError(message, res.status);
    }
    return (await res.json()) as AiTranscriptionResponse;
  },
};

// --------------------------------------------------------------------------
// Auditoria
// --------------------------------------------------------------------------
export const audit = {
  list: (action?: string) =>
    request<AuditEntry[]>(
      `/audit${action ? `?action=${encodeURIComponent(action)}` : ""}`,
    ),
};

// --------------------------------------------------------------------------
// MOSP
// --------------------------------------------------------------------------
export const mosp = {
  list: (search?: string) =>
    request<MospMemory[]>(
      `/mosp${search ? `?q=${encodeURIComponent(search)}` : ""}`,
    ),
  create: (data: Omit<MospMemory, "id" | "createdAt" | "updatedAt">) =>
    request<MospMemory>("/mosp", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<MospMemory>) =>
    request<MospMemory>(`/mosp/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => request<void>(`/mosp/${id}`, { method: "DELETE" }),
  seed: () => request<{ inserted: number }>("/mosp/seed", { method: "POST" }),
};

// --------------------------------------------------------------------------
// Modelos de laudo
// --------------------------------------------------------------------------
export const templates = {
  list: () => request<ReportTemplate[]>("/templates"),
  create: (data: { name: string; body: string }) =>
    request<ReportTemplate>("/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ReportTemplate>) =>
    request<ReportTemplate>(`/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/templates/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// LGPD
// --------------------------------------------------------------------------
export const privacy = {
  /** Apaga TODOS os dados (direito ao esquecimento). */
  wipeAll: () => request<{ ok: boolean }>("/privacy/wipe", { method: "POST" }),
};

// --------------------------------------------------------------------------
// Usuários (admin)
// --------------------------------------------------------------------------
export const users = {
  list: () => request<User[]>("/users"),
  create: (email: string, password: string) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  setPassword: (id: string, password: string) =>
    request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    }),
  remove: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),
};

export const apiClient = {
  health,
  auth,
  users,
  patients,
  exams,
  episodes,
  prescriptions,
  agenda,
  notifications,
  ai,
  audit,
  mosp,
  templates,
  privacy,
};

export default apiClient;
