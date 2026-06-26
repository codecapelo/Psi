import { Badge } from "sopsi";

export function Colors() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge color="green">assinada</Badge>
      <Badge color="slate">rascunho</Badge>
      <Badge color="red">urgente</Badge>
      <Badge color="amber">internado</Badge>
      <Badge color="brand">novo episódio</Badge>
    </div>
  );
}
