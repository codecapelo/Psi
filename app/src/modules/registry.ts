// ==========================================================================
// Registro das 25 etapas do wizard. PRÉ-FIADO — subagentes NÃO editam este
// arquivo; cada um implementa o componente default do seu próprio módulo.
//
// Mapeamento:
//   1     Anamnese
//   2     Fenomenologia
//   3-18  16 domínios psicopatológicos (data-driven via DomainStep)
//   19    Súmula Geral
//   20    Escalas
//   21    Diagnóstico
//   22    PTS
//   23    Relatórios e Laudos
//   24    Auditoria de PDFs (IA)
//   25    Psi Assistente (IA)
// ==========================================================================

import type { EncounterTipo, WizardStepDef } from "@/lib/types";
import AnamneseStep from "./anamnese";
import FenomenologiaStep from "./fenomenologia";
import EvolucaoStep from "./evolucao";
import AltaStep from "./alta";
import SumulaStep from "./sumula";
import EscalasStep from "./escalas";
import DiagnosticoStep from "./diagnostico";
import PtsStep from "./pts";
import LaudosStep from "./laudos";
import AuditoriaPdfStep from "./auditoria-pdf";
import AssistenteStep from "./assistente";
import { DOMAINS } from "./psicopatologia/domains";
import { makeDomainStep } from "./psicopatologia/DomainStep";

const domainSteps: WizardStepDef[] = DOMAINS.map((d, i) => ({
  id: d.id,
  index: 3 + i,
  title: d.title,
  shortTitle: d.shortTitle,
  group: "Clínico",
  Component: makeDomainStep(d.id),
}));

export const WIZARD_STEPS: WizardStepDef[] = [
  { id: "anamnese", index: 1, title: "Anamnese", group: "Clínico", Component: AnamneseStep },
  { id: "fenomenologia", index: 2, title: "Fenomenologia", group: "Clínico", Component: FenomenologiaStep },
  ...domainSteps,
  { id: "sumula", index: 19, title: "Súmula Geral", group: "Síntese", Component: SumulaStep },
  { id: "escalas", index: 20, title: "Escalas", group: "Síntese", Component: EscalasStep },
  { id: "diagnostico", index: 21, title: "Diagnóstico", group: "Conclusão", Component: DiagnosticoStep },
  {
    id: "pts",
    index: 22,
    title: "PTS — Projeto Terapêutico Singular",
    shortTitle: "PTS",
    group: "Conclusão",
    Component: PtsStep,
  },
  { id: "laudos", index: 23, title: "Relatórios e Laudos", shortTitle: "Laudos", group: "Conclusão", Component: LaudosStep },
  { id: "auditoria-pdf", index: 24, title: "Auditoria de PDFs (IA)", shortTitle: "Auditoria PDF", group: "IA", Component: AuditoriaPdfStep },
  { id: "assistente", index: 25, title: "Psi Assistente (IA)", shortTitle: "Assistente", group: "IA", Component: AssistenteStep },
];

// --------------------------------------------------------------------------
// Conjuntos de etapas por tipo de atendimento (camada longitudinal).
//   admissao | consulta → wizard clínico completo (25 etapas)
//   evolucao            → nota SOAP + mini-EEM
//   alta                → resumo de alta do episódio
// --------------------------------------------------------------------------
const EVOLUCAO_STEPS: WizardStepDef[] = [
  { id: "evolucao", index: 1, title: "Evolução (SOAP)", shortTitle: "Evolução", group: "Clínico", Component: EvolucaoStep },
];

const ALTA_STEPS: WizardStepDef[] = [
  { id: "alta", index: 1, title: "Alta", group: "Conclusão", Component: AltaStep },
];

/** Etapas exibidas para um atendimento conforme seu tipo. */
export function getStepsForTipo(tipo?: EncounterTipo | null): WizardStepDef[] {
  if (tipo === "evolucao") return EVOLUCAO_STEPS;
  if (tipo === "alta") return ALTA_STEPS;
  return WIZARD_STEPS; // admissao | consulta | undefined (compat)
}

const ALL_STEPS: WizardStepDef[] = [...WIZARD_STEPS, ...EVOLUCAO_STEPS, ...ALTA_STEPS];

export function getStepById(id: string): WizardStepDef | undefined {
  return ALL_STEPS.find((s) => s.id === id);
}

export function getStepByIndex(index: number): WizardStepDef | undefined {
  return WIZARD_STEPS.find((s) => s.index === index);
}

export const TOTAL_STEPS = WIZARD_STEPS.length;
