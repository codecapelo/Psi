import { Card, CardHeader, Badge, Button } from "sopsi";
import { Plus } from "lucide-react";

export function WithActions() {
  return (
    <Card className="max-w-lg">
      <CardHeader
        title="Evolução de enfermaria"
        subtitle="Atualizada há 12 minutos por Dra. Helena Costa"
        actions={
          <Button variant="ai" size="sm">
            Sugerir com IA
          </Button>
        }
      />
      <div className="px-5 py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Paciente refere melhora do humor e do padrão de sono. Nega ideação
        suicida. Mantém boa adesão à sertralina 100 mg. Conduta inalterada,
        reavaliar em 48 horas.
      </div>
    </Card>
  );
}

export function WithBadge() {
  return (
    <Card className="max-w-lg">
      <CardHeader
        title="Exame psíquico de admissão"
        subtitle="Seq. 1 · 03/02/2026 às 09h15"
        actions={<Badge color="green">assinada</Badge>}
      />
      <div className="px-5 py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Humor deprimido, afeto hiporreativo e congruente. Pensamento com curso
        lentificado, sem alterações de conteúdo. Juízo crítico preservado.
      </div>
    </Card>
  );
}

export function ListHeader() {
  return (
    <Card className="max-w-lg">
      <CardHeader
        title="Atendimentos do plantão"
        subtitle="Unidade de internação · turno da manhã"
        actions={
          <Button size="sm" icon={<Plus className="h-4 w-4" />}>
            Novo
          </Button>
        }
      />
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        <li className="flex items-center justify-between px-5 py-3 text-sm">
          <span className="text-slate-700 dark:text-slate-200">
            Mariana Alves de Souza
          </span>
          <Badge color="amber">internada</Badge>
        </li>
        <li className="flex items-center justify-between px-5 py-3 text-sm">
          <span className="text-slate-700 dark:text-slate-200">
            Carlos Eduardo Pereira
          </span>
          <Badge color="green">alta hoje</Badge>
        </li>
      </ul>
    </Card>
  );
}
