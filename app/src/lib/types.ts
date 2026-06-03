// ==========================================================================
// SOPsi 2.0 — Tipos compartilhados (contrato entre módulos)
//
// Modelo de dados: o conteúdo clínico de um exame vive em `Exam.data`, um
// objeto JSON livre (espelha a coluna JSONB do Postgres). Cada módulo do
// wizard é "dono" de uma fatia desse JSON e a acessa de forma tipada via
// o hook `useExamSlice<MinhaFatia>('chaveDoModulo')` (ver context/ExamContext).
//
// Isso permite que módulos sejam construídos de forma independente, sem
// migrations por módulo e sem conflito de arquivos.
// ==========================================================================

export interface Patient {
  id: string;
  name: string;
  /** Iniciais quando o nome completo não é registrado (LGPD). */
  externalId?: string | null;
  /** Resumo denormalizado para busca/listagem. */
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ExamStatus = "em_andamento" | "concluido";

/** Conteúdo clínico livre do exame (JSONB). Cada módulo grava sua fatia. */
export type ExamData = Record<string, unknown>;

export interface Exam {
  id: string;
  patientId: string;
  status: ExamStatus;
  /** Local do atendimento (CAPS, UBS, etc.) — preenchido na Anamnese. */
  context?: string | null;
  data: ExamData;
  createdAt: string;
  updatedAt: string;
}

/** Exame com dados do paciente embutidos (usado em listagens de histórico). */
export interface ExamWithPatient extends Exam {
  patient: Patient;
}

// --------------------------------------------------------------------------
// IA (OpenAI via backend)
// --------------------------------------------------------------------------

export type AiTask =
  | "synthesize" // sintetizar texto livre em campos estruturados
  | "suggest_diagnosis"
  | "suggest_differentials"
  | "suggest_pts"
  | "audit_pdf"
  | "chat"
  | "insights"
  | "generic";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionRequest {
  task: AiTask;
  messages: AiMessage[];
  /** Contexto clínico opcional (achados do exame) para enriquecer o prompt. */
  context?: Record<string, unknown>;
  temperature?: number;
}

export interface AiCompletionResponse {
  text: string;
  model: string;
  /** Aviso de segurança a ser exibido ao profissional. */
  disclaimer?: string;
}

export interface AiTranscriptionResponse {
  text: string;
  model: string;
}

// --------------------------------------------------------------------------
// Trilha de auditoria (LGPD)
// --------------------------------------------------------------------------

export type AuditAction = "CREATE" | "READ" | "UPDATE" | "DELETE";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entity: string; // 'patient' | 'exam' | 'mosp' | ...
  entityId?: string | null;
  detail?: string | null;
  createdAt: string;
}

// --------------------------------------------------------------------------
// MOSP — Memória Operacional SOPsi (diretrizes clínicas em Markdown)
// --------------------------------------------------------------------------

export interface MospMemory {
  id: string;
  title: string;
  order: number;
  /** Palavras-chave que disparam a injeção da memória no prompt da IA. */
  triggers: string[];
  contentMd: string;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// Relatórios / Laudos
// --------------------------------------------------------------------------

export interface ReportTemplate {
  id: string;
  name: string;
  /** true para os modelos pré-instalados (não editáveis/removíveis). */
  builtin: boolean;
  /** Corpo do modelo com placeholders {{campo}}. */
  body: string;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// Wizard
// --------------------------------------------------------------------------

export type WizardGroup = "Clínico" | "Síntese" | "Conclusão" | "IA";

export interface WizardStepDef {
  /** slug estável usado em rotas e como chave de dados quando aplicável. */
  id: string;
  /** 1..25 */
  index: number;
  title: string;
  shortTitle?: string;
  group: WizardGroup;
  Component: React.ComponentType;
}
