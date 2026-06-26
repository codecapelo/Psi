// ==========================================================================
// Painel "Acompanhar até a alta" — exibido na lateral do wizard de evolução.
// Lista, a partir da ADMISSÃO do episódio, os pontos que devem ser reavaliados
// em cada evolução até a alta: diagnóstico, achados do EEM e conduta inicial.
// É uma referência de leitura (não edita nada) derivada da linha de base.
// ==========================================================================

import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import apiClient from "@/lib/api";
import { DOMAINS } from "@/modules/psicopatologia/domains";

interface AdmissionData {
  diagnostico?: { sindromico?: string; nosologico?: string };
  pts?: { orientacoes?: string };
  psicopatologia?: Record<string, { selected?: string[] }>;
}

const DOMAIN_TITLE = new Map(DOMAINS.map((d) => [d.id, d.shortTitle || d.title]));

/** Achados do EEM da admissão, agrupados por domínio (na ordem dos domínios). */
function eemFindings(data: AdmissionData): { domain: string; itens: string[] }[] {
  const psico = data.psicopatologia ?? {};
  const out: { domain: string; itens: string[] }[] = [];
  for (const d of DOMAINS) {
    const sel = psico[d.id]?.selected;
    if (Array.isArray(sel) && sel.length > 0) {
      out.push({ domain: DOMAIN_TITLE.get(d.id) ?? d.id, itens: sel });
    }
  }
  return out;
}

export function EvolucaoWatchlist({
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
  // Linha de base = admissão do episódio (fallback: 1º atendimento).
  const admission =
    episode?.exams.find((e) => e.tipo === "admissao") ??
    [...(episode?.exams ?? [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))[0];

  const data = (admission?.data ?? {}) as AdmissionData;
  const sindromico = data.diagnostico?.sindromico?.trim();
  const nosologico = data.diagnostico?.nosologico?.trim();
  const orientacoes = data.pts?.orientacoes?.trim();
  const findings = eemFindings(data);
  const hasContent = !!(sindromico || nosologico || orientacoes || findings.length);

  return (
    <div className="border-t border-slate-100 p-3 dark:border-slate-800">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <ClipboardList className="h-4 w-4 text-brand-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Acompanhar até a alta
        </p>
      </div>

      {!hasContent ? (
        <p className="px-1 text-xs text-slate-400">
          Preencha a admissão (diagnóstico, EEM e conduta) para listar os pontos
          a reavaliar em cada evolução.
        </p>
      ) : (
        <div className="space-y-3 px-1 text-xs">
          {(sindromico || nosologico) && (
            <div>
              <p className="font-semibold text-slate-600 dark:text-slate-300">Diagnóstico</p>
              {sindromico && <p className="text-slate-500 dark:text-slate-400">{sindromico}</p>}
              {nosologico && (
                <p className="text-slate-400">{nosologico}</p>
              )}
            </div>
          )}

          {findings.length > 0 && (
            <div>
              <p className="mb-0.5 font-semibold text-slate-600 dark:text-slate-300">
                Achados a reavaliar
              </p>
              <ul className="space-y-1">
                {findings.map((f) => (
                  <li key={f.domain} className="leading-snug text-slate-500 dark:text-slate-400">
                    <span className="text-slate-400">{f.domain}: </span>
                    {f.itens.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {orientacoes && (
            <div>
              <p className="font-semibold text-slate-600 dark:text-slate-300">Conduta inicial</p>
              <p className="whitespace-pre-wrap leading-snug text-slate-500 dark:text-slate-400">
                {orientacoes}
              </p>
            </div>
          )}

          <p className="text-[10px] italic text-slate-400">
            Reavalie estes pontos a cada evolução, registrando melhora ou piora.
          </p>
        </div>
      )}
    </div>
  );
}
