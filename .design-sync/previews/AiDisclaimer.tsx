import { AiDisclaimer } from "sopsi";

export function Padrao() {
  return (
    <div className="max-w-xl">
      <AiDisclaimer />
    </div>
  );
}

export function TextoPersonalizado() {
  return (
    <div className="max-w-xl">
      <AiDisclaimer text="Resumo de alta gerado automaticamente a partir das evoluções do episódio. Confira medicações, doses e datas antes de assinar — a responsabilidade pelo conteúdo é do profissional." />
    </div>
  );
}
