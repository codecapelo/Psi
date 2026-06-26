import { AiAssistButton } from "sopsi";

export function Variantes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AiAssistButton
        label="Sugerir hipóteses diagnósticas"
        variant="ai"
        request={() => ({})}
        onResult={() => {}}
      />
      <AiAssistButton
        label="Resumir evolução"
        variant="secondary"
        request={() => ({})}
        onResult={() => {}}
      />
      <AiAssistButton
        label="Revisar redação"
        variant="outline"
        request={() => ({})}
        onResult={() => {}}
      />
    </div>
  );
}

export function Tamanhos() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AiAssistButton
        label="Gerar resumo de alta"
        size="sm"
        request={() => ({})}
        onResult={() => {}}
      />
      <AiAssistButton
        label="Gerar resumo de alta"
        size="md"
        request={() => ({})}
        onResult={() => {}}
      />
    </div>
  );
}
