import { Input } from "sopsi";

export function Default() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Input placeholder="Nome completo do paciente" />
      <Input defaultValue="Mariana Alves de Souza" />
    </div>
  );
}

export function Types() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Input type="text" defaultValue="CID-10 F31.1" />
      <Input type="date" defaultValue="2026-03-14" />
      <Input type="number" defaultValue={18} placeholder="Escore PHQ-9" />
      <Input type="tel" defaultValue="(11) 98472-3310" />
    </div>
  );
}

export function States() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Input required placeholder="Cartão SUS (obrigatório)" />
      <Input defaultValue="600 mg/dia — carbonato de lítio" />
      <Input disabled defaultValue="Prontuário 248.913 (bloqueado)" />
    </div>
  );
}
