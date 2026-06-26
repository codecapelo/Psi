// ==========================================================================
// Painel "Caminho do episódio" — exibido na lateral do wizard de alta.
// Espelha a ideia do painel da evolução, mas mostra a TRAJETÓRIA: da admissão,
// pelas evoluções, até a alta (nó atual em destaque). Só leitura.
// ==========================================================================

import { Route, LogOut } from "lucide-react";
import { Badge } from "@/components/ui";
import { EpisodeTimeline, useEpisodeTrajetoria } from "@/components/EpisodeTimeline";

export function AltaJourney({
  patientId,
  episodeId,
}: {
  patientId: string;
  episodeId: string;
}) {
  const { trajetoria } = useEpisodeTrajetoria(patientId, episodeId);

  return (
    <div className="border-t border-slate-100 p-3 dark:border-slate-800">
      <div className="mb-2.5 flex items-center gap-1.5 px-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100 dark:bg-accent-900/30 dark:text-accent-300 dark:ring-accent-900/40">
          <Route className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Caminho do episódio
        </p>
      </div>

      <EpisodeTimeline exams={trajetoria} variant="rail">
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
      </EpisodeTimeline>

      <p className="mt-3 rounded-lg bg-accent-50/60 px-2.5 py-1.5 text-[10px] italic leading-relaxed text-accent-700 dark:bg-accent-900/15 dark:text-accent-300/90">
        Da admissão às evoluções até a alta — sintetize a trajetória no resumo.
      </p>
    </div>
  );
}
