import { Card, Badge } from "sopsi";

export function PatientSummary() {
  return (
    <Card className="max-w-md p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Mariana Alves de Souza
          </h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            42 anos · Leito 12B · Enfermaria de Psiquiatria
          </p>
        </div>
        <Badge color="amber">internada</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">
            Diagnóstico
          </dt>
          <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
            Episódio depressivo grave
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">
            Médico assistente
          </dt>
          <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
            Dr. Rafael Lima
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">
            Admissão
          </dt>
          <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
            03/02/2026
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">
            Risco de suicídio
          </dt>
          <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
            Moderado
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export function MetricTiles() {
  return (
    <div className="flex flex-wrap gap-4">
      <Card className="min-w-[9rem] flex-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Atendimentos hoje
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          14
        </p>
      </Card>
      <Card className="min-w-[9rem] flex-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Pacientes internados
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          8
        </p>
      </Card>
      <Card className="min-w-[9rem] flex-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Altas pendentes
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          3
        </p>
      </Card>
    </div>
  );
}
