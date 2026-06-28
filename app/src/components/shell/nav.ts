// Configuração de navegação do shell SOPsi 2.0 (sidebar + tabs mobile) e os
// títulos do topbar por rota.
import type { IconName } from "@/components/Icon";

export interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  /** Só aparece para administradores. */
  admin?: boolean;
}

export const NAV_CLINICA: NavEntry[] = [
  { to: "/", label: "Painel", icon: "painel", end: true },
  { to: "/pacientes", label: "Pacientes", icon: "pacientes" },
  { to: "/agenda", label: "Agenda", icon: "agenda" },
  { to: "/ia", label: "Evolução com IA", icon: "sparkles" },
];

export const NAV_SISTEMA: NavEntry[] = [
  { to: "/mosp", label: "MOSP — Memória", icon: "book" },
  { to: "/auditoria", label: "Auditoria", icon: "scroll" },
  { to: "/usuarios", label: "Usuários", icon: "user", admin: true },
  { to: "/config", label: "Configurações", icon: "settings" },
  { to: "/privacidade", label: "Dados & Privacidade", icon: "lock" },
];

export interface RouteTitle {
  eye: string;
  t: string;
}

/** Eyebrow + título do topbar conforme a rota atual. */
export function titleForPath(pathname: string): RouteTitle {
  if (pathname === "/") return { eye: "Visão geral", t: "Painel" };
  if (pathname.startsWith("/pacientes/")) return { eye: "Prontuário", t: "Prontuário do episódio" };
  if (pathname.startsWith("/pacientes")) return { eye: "Unidade de internação", t: "Pacientes" };
  if (pathname.startsWith("/agenda")) return { eye: "Organização do dia", t: "Agenda" };
  if (pathname.startsWith("/ia")) return { eye: "Documentação clínica", t: "Transcrição inteligente" };
  if (pathname.startsWith("/prescricao")) return { eye: "Prescrição", t: "Prescrição médica" };
  if (pathname.startsWith("/mosp")) return { eye: "Memória operacional", t: "MOSP" };
  if (pathname.startsWith("/auditoria")) return { eye: "LGPD", t: "Log de auditoria" };
  if (pathname.startsWith("/usuarios")) return { eye: "Administração", t: "Usuários" };
  if (pathname.startsWith("/config")) return { eye: "Preferências", t: "Configurações" };
  if (pathname.startsWith("/privacidade")) return { eye: "LGPD", t: "Dados & Privacidade" };
  return { eye: "SOPsi", t: "SOPsi" };
}
