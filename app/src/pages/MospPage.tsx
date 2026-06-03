import { BookText } from "lucide-react";
import { EmptyState } from "@/components/ui";

// Stub — implementado pelo módulo "MOSP".
export default function MospPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        MOSP — Memória Operacional SOPsi
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Diretrizes clínicas em Markdown injetadas na IA por gatilhos.
      </p>
      <EmptyState
        icon={<BookText className="h-10 w-10" />}
        title="Módulo em construção"
      />
    </div>
  );
}
