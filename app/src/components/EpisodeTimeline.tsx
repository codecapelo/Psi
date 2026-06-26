// ==========================================================================
// Linha do tempo da trajetória de um episódio de cuidado
// (admissão → evoluções → alta).
//
// Fonte única de verdade para o que antes estava triplicado: no passo de Alta
// (variante "document"), no painel lateral do wizard de alta (variante "rail")
// e na vista de documento assinado (variante "document").
// ==========================================================================

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Check, DoorOpen, FileText } from "lucide-react";
import apiClient from "@/lib/api";
import { Badge } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import type { Exam } from "@/lib/types";

interface EvolucaoShape {
  s?: string;
  o?: string;
  a?: string;
  p?: string;
}

/** Extrai uma linha de trajetória legível (título + detalhe) de um atendimento. */
export function describeExam(ex: Exam): { titulo: string; detalhe: string } {
  const data = ex.data as Record<string, unknown>;
  if (ex.tipo === "admissao" || ex.tipo === "consulta") {
    const diag = (data.diagnostico ?? {}) as Record<string, string>;
    const detalhe = [diag.sindromico, diag.nosologico].filter(Boolean).join(" — ");
    return { titulo: ex.tipo === "admissao" ? "Admissão" : "Consulta", detalhe };
  }
  if (ex.tipo === "evolucao") {
    const ev = (data.evolucao ?? {}) as EvolucaoShape;
    return { titulo: `Evolução ${ex.seq ?? ""}`.trim(), detalhe: ev.a?.trim() || ev.p?.trim() || "" };
  }
  return { titulo: ex.tipo ?? "Atendimento", detalhe: "" };
}

/**
 * Busca os atendimentos do episódio (exceto a própria alta), ordenados por seq.
 * Reusa o cache do react-query via a chave ["episodes", patientId] — a mesma
 * usada pelos demais consumidores de episódios.
 */
export function useEpisodeTrajetoria(patientId?: string, episodeId?: string | null) {
  const q = useQuery({
    queryKey: ["episodes", patientId],
    queryFn: () => apiClient.episodes.listByPatient(patientId as string),
    enabled: !!patientId,
  });
  const episode = q.data?.find((ep) => ep.id === episodeId);
  const trajetoria = (episode?.exams ?? [])
    .filter((ex) => ex.tipo !== "alta")
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  return { trajetoria, isLoading: q.isLoading };
}

type TimelineVariant = "rail" | "document";

/** Um nó da trajetória (um atendimento). */
function EpisodeTimelineNode({ exam, variant }: { exam: Exam; variant: TimelineVariant }) {
  const rail = variant === "rail";
  const { titulo, detalhe } = describeExam(exam);
  const NodeIcon =
    exam.tipo === "admissao" ? DoorOpen : exam.tipo === "evolucao" ? Activity : FileText;
  return (
    <li className={cn("relative", !rail && "break-inside-avoid")}>
      <span
        className={cn(
          "absolute top-0 flex items-center justify-center rounded-full",
          rail
            ? "-left-[1.85rem] h-5 w-5 bg-white text-accent-500 ring-1 ring-accent-200 dark:bg-slate-900 dark:text-accent-400 dark:ring-accent-900/50"
            : "-left-[2.1rem] h-6 w-6 bg-accent-50 text-accent-600 ring-2 ring-white dark:bg-accent-900/30 dark:text-accent-300 dark:ring-slate-900",
        )}
      >
        <NodeIcon className={rail ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "font-medium",
            rail
              ? "text-xs text-slate-700 dark:text-slate-200"
              : "text-sm text-slate-800 dark:text-slate-100",
          )}
        >
          {titulo}
        </span>
        <span
          className={cn("tabular-nums text-slate-400", rail ? "text-[10px]" : "text-xs")}
        >
          {formatDate(exam.createdAt, true)}
        </span>
        {exam.lockedAt &&
          (rail ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Badge color="green">assinada</Badge>
          ))}
      </div>
      {detalhe && (
        <p
          className={cn(
            "mt-0.5 text-slate-500 dark:text-slate-400",
            rail ? "line-clamp-1 text-[11px]" : "line-clamp-2 text-sm",
          )}
        >
          {detalhe}
        </p>
      )}
    </li>
  );
}

/**
 * Renderiza a lista (ol) da trajetória. O contêiner/cabeçalho ao redor fica a
 * cargo de cada chamador (Card, DocSection, painel lateral). `children` permite
 * acrescentar nós extras dentro da mesma linha (ex.: "Alta em elaboração").
 */
export function EpisodeTimeline({
  exams,
  variant = "document",
  children,
}: {
  exams: Exam[];
  variant?: TimelineVariant;
  children?: ReactNode;
}) {
  const rail = variant === "rail";
  return (
    <ol
      className={cn(
        "relative border-l-2 border-accent-200 dark:border-accent-900/40",
        rail ? "space-y-3.5 pl-5" : "space-y-4 pl-6",
      )}
    >
      {exams.map((ex) => (
        <EpisodeTimelineNode key={ex.id} exam={ex} variant={variant} />
      ))}
      {children}
    </ol>
  );
}
