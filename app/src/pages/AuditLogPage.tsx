import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import apiClient from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui";
import type { AuditAction } from "@/lib/types";

// --------------------------------------------------------------------------
// Configuração de filtros
// --------------------------------------------------------------------------
type FilterOption = "ALL" | AuditAction;

const FILTERS: { label: string; value: FilterOption }[] = [
  { label: "Todos", value: "ALL" },
  { label: "CREATE", value: "CREATE" },
  { label: "READ", value: "READ" },
  { label: "UPDATE", value: "UPDATE" },
  { label: "DELETE", value: "DELETE" },
];

// --------------------------------------------------------------------------
// Mapeamento de cores por ação
// --------------------------------------------------------------------------
const ACTION_COLOR: Record<AuditAction, "green" | "slate" | "amber" | "red"> =
  {
    CREATE: "green",
    READ: "slate",
    UPDATE: "amber",
    DELETE: "red",
  };

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------
export default function AuditLogPage() {
  const [filter, setFilter] = useState<FilterOption>("ALL");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit", filter],
    queryFn: () =>
      apiClient.audit.list(filter === "ALL" ? undefined : filter),
    retry: false,
  });

  const entries = data ?? [];

  // Mensagem de erro amigável (ex: 503 sem banco configurado)
  const errorMessage =
    isError
      ? "Configure o banco de dados para ver a trilha de auditoria."
      : null;

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Cabeçalho */}
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Log de Auditoria
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Trilha completa de ações (CREATE, READ, UPDATE, DELETE) para compliance
        com a LGPD.
      </p>

      {/* Filtros por tipo de operação */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={
                active
                  ? "rounded-full px-3 py-1 text-sm font-medium bg-brand-600 text-white"
                  : "rounded-full px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : errorMessage ? (
        <EmptyState
          icon={<ScrollText className="h-10 w-10" />}
          title="Trilha indisponível"
          description={errorMessage}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-10 w-10" />}
          title="Nenhum registro encontrado"
          description={
            filter === "ALL"
              ? "Nenhuma ação foi registrada ainda."
              : `Nenhuma ação do tipo ${filter} foi registrada.`
          }
        />
      ) : (
        <Card>
          {/* Cabeçalho da tabela */}
          <div className="hidden grid-cols-[150px_72px_90px_90px_150px_1fr] gap-3 border-b border-slate-100 px-4 py-2 dark:border-slate-800 sm:grid">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Data / Hora
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ação
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Entidade
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ID
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Usuário
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Detalhe
            </span>
          </div>

          {/* Linhas */}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[150px_72px_90px_90px_150px_1fr]"
              >
                {/* Data / hora */}
                <span className="whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(entry.createdAt, true)}
                </span>

                {/* Ação */}
                <span>
                  <Badge color={ACTION_COLOR[entry.action]}>
                    {entry.action}
                  </Badge>
                </span>

                {/* Entidade */}
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {entry.entity}
                </span>

                {/* entityId truncado */}
                <span
                  className="truncate font-mono text-xs text-slate-400"
                  title={entry.entityId ?? "—"}
                >
                  {entry.entityId
                    ? entry.entityId.length > 8
                      ? `${entry.entityId.slice(0, 8)}…`
                      : entry.entityId
                    : "—"}
                </span>

                {/* Usuário (actor) */}
                <span
                  className="truncate text-xs text-slate-500 dark:text-slate-400"
                  title={entry.actor ?? "—"}
                >
                  {entry.actor ?? "—"}
                </span>

                {/* Detalhe */}
                <span className="truncate text-slate-500 dark:text-slate-400">
                  {entry.detail ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Rodapé informativo */}
      {!isLoading && !isError && entries.length > 0 && (
        <p className="mt-3 text-right text-xs text-slate-400">
          {entries.length} registro{entries.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
