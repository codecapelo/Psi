// ==========================================================================
// Painel "Caminho do episódio" — exibido na lateral do wizard de alta.
// Espelha a ideia do painel da evolução, mas mostra a TRAJETÓRIA: da admissão,
// pelas evoluções, até a alta (nó atual em destaque). Só leitura.
// ==========================================================================

import { useQuery } from "@tanstack/react-query";
import { Route, Check } from "lucide-react";
import apiClient from "@/lib/api";
import { Badge } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { describeExam } from "./index";

export function AltaJourney({
  patientId,
  episodeId,
}: {
  patientId: string;
  episodeId: string;
}) {
  const episodesQ = useQuery({
    queryKey: ["episodes", patientId],
    queryFn: () => apiClient.episodes.listByPatient(patientId),
    enabled: !!patientId,
  });

  const episode = episodesQ.data?.find((ep) => ep.id === episodeId);
  // Trajetória = atendimentos do episódio, exceto a própria alta, em ordem.
  const trajetoria = (episode?.exams ?? [])
    .filter((ex) => ex.tipo !== "alta")
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  return (
    <div className="border-t border-slate-100 p-3 dark:border-slate-800">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <Route className="h-4 w-4 text-brand-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Caminho do episódio
        </p>
      </div>

      <ol className="relative space-y-3 border-l border-slate-200 pl-4 dark:border-slate-700">
        {trajetoria.map((ex) => {
          const { titulo, detalhe } = describeExam(ex);
          const isAdm = ex.tipo === "admissao";
          return (
            <li key={ex.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.25rem] top-1 h-2 w-2 rounded-full",
                  isAdm ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600",
                )}
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {titulo}
                </span>
                {ex.lockedAt && <Check className="h-3 w-3 text-emerald-500" />}
              </div>
              <span className="text-[10px] text-slate-400">
                {formatDate(ex.createdAt, true)}
              </span>
              {detalhe && (
                <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {detalhe}
                </p>
              )}
            </li>
          );
        })}

        {/* Nó atual: a alta em elaboração (destino da trajetória). */}
        <li className="relative">
          <span className="absolute -left-[1.34rem] top-0.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-2 ring-brand-200 dark:ring-brand-900/50" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              Alta
            </span>
            <Badge color="amber">em elaboração</Badge>
          </div>
          <span className="text-[10px] text-slate-400">você está aqui</span>
        </li>
      </ol>

      <p className="mt-2 px-1 text-[10px] italic text-slate-400">
        Da admissão às evoluções até a alta — sintetize a trajetória no resumo.
      </p>
    </div>
  );
}
