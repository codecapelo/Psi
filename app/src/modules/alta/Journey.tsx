// ==========================================================================
// Painel "Caminho do episódio" — exibido na lateral do wizard de alta.
// Espelha a ideia do painel da evolução, mas mostra a TRAJETÓRIA: da admissão,
// pelas evoluções, até a alta (nó atual em destaque). Só leitura.
// ==========================================================================

import { useQuery } from "@tanstack/react-query";
import { Route, Check, DoorOpen, Activity, FileText, LogOut } from "lucide-react";
import apiClient from "@/lib/api";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
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
      <div className="mb-2.5 flex items-center gap-1.5 px-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100 dark:bg-accent-900/30 dark:text-accent-300 dark:ring-accent-900/40">
          <Route className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Caminho do episódio
        </p>
      </div>

      <ol className="relative space-y-3.5 border-l-2 border-accent-200 pl-5 dark:border-accent-900/40">
        {trajetoria.map((ex) => {
          const { titulo, detalhe } = describeExam(ex);
          const NodeIcon =
            ex.tipo === "admissao" ? DoorOpen : ex.tipo === "evolucao" ? Activity : FileText;
          return (
            <li key={ex.id} className="relative">
              <span className="absolute -left-[1.85rem] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-accent-500 ring-1 ring-accent-200 dark:bg-slate-900 dark:text-accent-400 dark:ring-accent-900/50">
                <NodeIcon className="h-3 w-3" />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {titulo}
                </span>
                {ex.lockedAt && <Check className="h-3 w-3 text-emerald-500" />}
              </div>
              <span className="text-[10px] tabular-nums text-slate-400">
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
          <span className="absolute -left-[1.95rem] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-brand-200 dark:ring-brand-900/50">
            <LogOut className="h-3.5 w-3.5" />
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              Alta
            </span>
            <Badge color="amber">em elaboração</Badge>
          </div>
          <span className="text-[10px] text-slate-400">você está aqui</span>
        </li>
      </ol>

      <p className="mt-3 rounded-lg bg-accent-50/60 px-2.5 py-1.5 text-[10px] italic leading-relaxed text-accent-700 dark:bg-accent-900/15 dark:text-accent-300/90">
        Da admissão às evoluções até a alta — sintetize a trajetória no resumo.
      </p>
    </div>
  );
}
