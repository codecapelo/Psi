import { Textarea } from "sopsi";

export function Empty() {
  return (
    <div className="max-w-lg">
      <Textarea placeholder="Descreva a queixa principal e a história da doença atual…" />
    </div>
  );
}

export function Filled() {
  return (
    <div className="max-w-lg">
      <Textarea
        rows={5}
        defaultValue={
          "Paciente refere humor deprimido há cerca de oito semanas, com anedonia, insônia terminal e perda de apetite. Nega ideação suicida estruturada. Lentificação psicomotora evidente à entrevista; afeto hiporreativo e congruente com o humor."
        }
      />
    </div>
  );
}

export function Disabled() {
  return (
    <div className="max-w-lg">
      <Textarea
        disabled
        rows={3}
        defaultValue={
          "Evolução assinada eletronicamente em 22/03/2026 por Dra. Helena Prado (CRM 142887). Registro bloqueado para edição."
        }
      />
    </div>
  );
}
