import { Modal, Button, Badge } from "sopsi";
import { ShieldCheck } from "lucide-react";

export function ConfirmacaoAssinatura() {
  return (
    <Modal
      open={true}
      onClose={() => {}}
      title="Assinar e arquivar evolução"
      size="md"
    >
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          A evolução será bloqueada para edição e incorporada ao prontuário, com
          carimbo de data, hora e identificação do profissional.
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Evolução nº 3 — Episódio depressivo
            </span>
            <Badge color="amber">Não assinada</Badge>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">Paciente</dt>
            <dd className="text-right text-slate-700 dark:text-slate-200">
              M. A. Ferreira
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">Profissional</dt>
            <dd className="text-right text-slate-700 dark:text-slate-200">
              Dra. Helena Prado — CRM 84.221
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">Data e hora</dt>
            <dd className="text-right text-slate-700 dark:text-slate-200">
              26/06/2026 14:38
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">Cancelar</Button>
        <Button variant="primary" icon={<ShieldCheck className="h-4 w-4" />}>
          Assinar documento
        </Button>
      </div>
    </Modal>
  );
}
