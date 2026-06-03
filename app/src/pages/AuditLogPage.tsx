import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/ui";

// Stub — implementado pelo módulo "Log de Auditoria".
export default function AuditLogPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Log de Auditoria
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Trilha de ações (CREATE, READ, UPDATE, DELETE) para compliance com a LGPD.
      </p>
      <EmptyState
        icon={<ScrollText className="h-10 w-10" />}
        title="Módulo em construção"
      />
    </div>
  );
}
