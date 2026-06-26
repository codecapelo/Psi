import { Spinner, Card } from "sopsi";

export function LoadingCard() {
  return (
    <Card className="max-w-sm">
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
        <Spinner className="h-7 w-7 text-brand-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Carregando atendimentos…
        </p>
      </div>
    </Card>
  );
}

export function InlineRow() {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <Spinner className="h-4 w-4 text-brand-600" />
      Assinando documento…
    </div>
  );
}
