// ==========================================================================
// Painel "Estado na admissão" — exibido na lateral do wizard de evolução.
// Resumo VISUAL da linha de base do episódio (a admissão): diagnóstico em
// chips, escalas pontuadas em badges, achados do EEM e conduta inicial.
// O texto longo do diagnóstico fica recolhido para não poluir a lateral.
// É só leitura (não edita nada) — referência para reavaliar a cada evolução.
// ==========================================================================

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Activity, ChevronDown, ChevronUp } from "lucide-react";
import apiClient from "@/lib/api";
import { Badge } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { DOMAINS } from "@/modules/psicopatologia/domains";
import { getScale } from "@/modules/escalas/registry";
import { SEVERITY_COLOR, type Severity } from "@/modules/escalas/types";

interface ScaleLite {
  score?: number;
  band?: { label?: string; severity?: Severity };
  completedAt?: string;
}

interface AdmissionData {
  diagnostico?: { sindromico?: string; nosologico?: string };
  pts?: { orientacoes?: string };
  psicopatologia?: Record<string, { selected?: string[] }>;
  escalas?: Record<string, ScaleLite>;
}

const DOMAIN_TITLE = new Map(DOMAINS.map((d) => [d.id, d.shortTitle || d.title]));

/** Remove a marcação Markdown, deixando texto corrido legível. */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extrai os termos em negrito (**assim**) — viram chips do diagnóstico. */
function extractHighlights(md: string): string[] {
  const out: string[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const t = m[1].trim().replace(/[:.]$/, "");
    if (t && t.length <= 64 && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 12);
}

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

/** Escalas pontuadas na admissão (badge sigla · escore, cor por gravidade). */
function admissionScales(data: AdmissionData) {
  const escalas = data.escalas ?? {};
  // Só escalas CONCLUÍDAS entram na linha de base — uma escala parcial tem
  // score/band sem completedAt e apareceria como um basal válido enganoso.
  return Object.entries(escalas)
    .filter(([, r]) => r && r.completedAt)
    .map(([id, r]) => ({
      id,
      acronym: getScale(id)?.acronym ?? id.toUpperCase(),
      score: r.score,
      severity: (r.band?.severity ?? "normal") as Severity,
    }));
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </span>
  );
}

/** Bloco de diagnóstico: CID em badges + termos-chave em chips + texto recolhido. */
function DiagnosisBlock({ sindromico, nosologico }: { sindromico?: string; nosologico?: string }) {
  const [open, setOpen] = useState(false);
  const cids = (nosologico ?? "")
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const highlights = sindromico ? extractHighlights(sindromico) : [];
  const fullText = sindromico ? stripMarkdown(sindromico) : "";

  return (
    <div>
      <p className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Diagnóstico</p>

      {cids.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {cids.map((c) => (
            <Badge key={c} color="brand">
              {c}
            </Badge>
          ))}
        </div>
      )}

      {highlights.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {highlights.map((h) => (
            <Chip key={h}>{h}</Chip>
          ))}
        </div>
      ) : (
        fullText && (
          <p className={cn("whitespace-pre-wrap leading-snug text-slate-500 dark:text-slate-400", !open && "line-clamp-4")}>
            {fullText}
          </p>
        )
      )}

      {fullText && (highlights.length > 0 || fullText.length > 160) && (
        <>
          {open && highlights.length > 0 && (
            <p className="mt-1.5 whitespace-pre-wrap leading-snug text-slate-500 dark:text-slate-400">
              {fullText}
            </p>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-600 hover:underline"
          >
            {open ? (
              <>
                <ChevronUp className="h-3 w-3" /> Recolher
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Ver diagnóstico completo
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

/** Conduta inicial — recolhida quando longa. */
function ConductaBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 160;
  return (
    <div>
      <p className="font-semibold text-slate-600 dark:text-slate-300">Conduta inicial</p>
      <p className={cn("whitespace-pre-wrap leading-snug text-slate-500 dark:text-slate-400", long && !open && "line-clamp-3")}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-600 hover:underline"
        >
          {open ? "Recolher" : "Ver mais"}
        </button>
      )}
    </div>
  );
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
  const scales = admissionScales(data);
  const hasContent = !!(sindromico || nosologico || orientacoes || findings.length || scales.length);

  return (
    <div className="border-t border-slate-100 p-3 dark:border-slate-800">
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100 dark:bg-accent-900/30 dark:text-accent-300 dark:ring-accent-900/40">
            <ClipboardList className="h-3.5 w-3.5" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Estado na admissão
          </p>
        </div>
        {admission && (
          <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
            {formatDate(admission.createdAt)}
          </span>
        )}
      </div>

      {!hasContent ? (
        <p className="px-1 text-xs text-slate-400">
          Preencha a admissão (diagnóstico, escalas, EEM e conduta) para visualizar
          aqui o estado de base do paciente.
        </p>
      ) : (
        <div className="space-y-3 px-1 text-xs">
          {(sindromico || nosologico) && (
            <DiagnosisBlock sindromico={sindromico} nosologico={nosologico} />
          )}

          {scales.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                <Activity className="h-3.5 w-3.5 text-accent-500" /> Escalas na admissão
              </p>
              <div className="flex flex-wrap gap-1">
                {scales.map((s) => (
                  <Badge key={s.id} color={SEVERITY_COLOR[s.severity]}>
                    {s.acronym}
                    {typeof s.score === "number" ? ` · ${s.score}` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {findings.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-slate-600 dark:text-slate-300">
                Achados a reavaliar
              </p>
              <div className="space-y-1.5">
                {findings.map((f) => (
                  <div key={f.domain}>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                      {f.domain}
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {f.itens.map((it) => (
                        <Chip key={it}>{it}</Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orientacoes && <ConductaBlock text={orientacoes} />}

          <p className="rounded-lg bg-accent-50/60 px-2.5 py-1.5 text-[10px] italic leading-relaxed text-accent-700 dark:bg-accent-900/15 dark:text-accent-300/90">
            Reavalie estes pontos a cada evolução, registrando melhora ou piora.
          </p>
        </div>
      )}
    </div>
  );
}
