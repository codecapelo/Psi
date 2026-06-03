// ==========================================================================
// Cliente de API central — todas as chamadas ao backend Express passam aqui.
// ==========================================================================

import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiTranscriptionResponse,
  AuditEntry,
  Exam,
  ExamData,
  ExamWithPatient,
  MospMemory,
  Patient,
  ReportTemplate,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

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
  get: (id: string) => request<Patient>(`/patients/${id}`),
  create: (data: { name: string; externalId?: string | null }) =>
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
  remove: (id: string) => request<void>(`/exams/${id}`, { method: "DELETE" }),
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
      body: form,
    });
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

export const apiClient = {
  health,
  patients,
  exams,
  ai,
  audit,
  mosp,
  templates,
  privacy,
};

export default apiClient;
