import { CheckboxItem } from "sopsi";

export function Checklist() {
  return (
    <div className="w-72">
      <CheckboxItem checked label="Humor deprimido" onChange={() => {}} />
      <CheckboxItem checked label="Anedonia" onChange={() => {}} />
      <CheckboxItem checked={false} label="Ideação suicida" onChange={() => {}} />
      <CheckboxItem checked={false} label="Sintomas psicóticos" onChange={() => {}} />
    </div>
  );
}

export function WithTooltip() {
  return (
    <div className="w-72">
      <CheckboxItem
        checked
        label="Lentificação psicomotora"
        tooltip="Redução global da velocidade dos movimentos, da fala e do pensamento, observada à entrevista."
        onChange={() => {}}
      />
      <CheckboxItem
        checked={false}
        label="Embotamento afetivo"
        tooltip="Diminuição acentuada da expressividade e da modulação do afeto."
        onChange={() => {}}
      />
    </div>
  );
}

export function Disabled() {
  return (
    <div className="w-72">
      <CheckboxItem
        checked
        disabled
        label="Risco confirmado em triagem"
        onChange={() => {}}
      />
      <CheckboxItem
        checked={false}
        disabled
        label="Avaliação pendente da equipe"
        onChange={() => {}}
      />
    </div>
  );
}
