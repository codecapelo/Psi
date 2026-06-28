// Hooks de dados compartilhados (react-query) — chaves centralizadas para que
// painel, lista, sidebar (badge) e notificações reusem o mesmo cache.
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export const overviewKey = ["patients", "overview"] as const;
export const notificationsKey = ["notifications"] as const;
export const agendaKey = (date?: string) => ["agenda", date ?? "today"] as const;

/** Lista enriquecida de pacientes (status/dias/diagnóstico/última evolução). */
export function usePatientsOverview() {
  return useQuery({
    queryKey: overviewKey,
    queryFn: apiClient.patients.overview,
    retry: false,
  });
}

/** Compromissos de um dia (default: hoje). */
export function useAgenda(date?: string) {
  return useQuery({
    queryKey: agendaKey(date),
    queryFn: () => apiClient.agenda.list(date),
    retry: false,
  });
}

/** Notificações do profissional. */
export function useNotifications() {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: apiClient.notifications.list,
    retry: false,
    refetchInterval: 60_000,
  });
}
