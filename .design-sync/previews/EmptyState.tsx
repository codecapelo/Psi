import { EmptyState, Button } from "sopsi";
import { Inbox, Plus, FileText } from "lucide-react";

export function NoAtendimentos() {
  return (
    <div className="max-w-md">
      <EmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="Nenhum atendimento registrado"
        description="Este paciente ainda não possui atendimentos neste episódio. Inicie o primeiro registro para começar a evolução clínica."
        action={
          <Button icon={<Plus className="h-4 w-4" />}>Novo atendimento</Button>
        }
      />
    </div>
  );
}

export function NoDocuments() {
  return (
    <div className="max-w-md">
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="Nenhum documento assinado"
        description="Os laudos e receituários assinados aparecerão aqui. Conclua e assine um exame para gerar o primeiro documento."
        action={
          <Button variant="outline" size="sm">
            Ver exames pendentes
          </Button>
        }
      />
    </div>
  );
}
