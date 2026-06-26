import { Button } from "sopsi";
import { Plus, Trash2, Sparkles } from "lucide-react";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Salvar atendimento</Button>
      <Button variant="secondary">Cancelar</Button>
      <Button variant="outline">Pré-visualizar</Button>
      <Button variant="ghost">Descartar</Button>
      <Button variant="danger" icon={<Trash2 className="h-4 w-4" />}>
        Excluir
      </Button>
      <Button variant="ai" icon={<Sparkles className="h-4 w-4" />}>
        Gerar com IA
      </Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Pequeno</Button>
      <Button size="md">Médio</Button>
      <Button size="lg">Grande</Button>
      <Button size="icon" aria-label="Adicionar">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<Plus className="h-4 w-4" />}>Novo paciente</Button>
      <Button loading>Salvando…</Button>
      <Button disabled>Indisponível</Button>
    </div>
  );
}
