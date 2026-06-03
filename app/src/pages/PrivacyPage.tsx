import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui";

// Stub — implementado pelo módulo "Dados & Privacidade (LGPD)".
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Dados & Privacidade
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Consentimento, armazenamento e direito ao esquecimento (LGPD).
      </p>
      <EmptyState
        icon={<ShieldCheck className="h-10 w-10" />}
        title="Módulo em construção"
      />
    </div>
  );
}
