import { Select } from "sopsi";

export function Default() {
  return (
    <div className="w-72">
      <Select defaultValue="">
        <option value="" disabled>
          Selecione o risco de suicídio…
        </option>
        <option value="baixo">Risco baixo</option>
        <option value="moderado">Risco moderado</option>
        <option value="alto">Risco alto</option>
      </Select>
    </div>
  );
}

export function Selected() {
  return (
    <div className="w-72">
      <Select defaultValue="grave">
        <option value="leve">Episódio depressivo leve</option>
        <option value="moderado">Episódio depressivo moderado</option>
        <option value="grave">Episódio depressivo grave</option>
        <option value="psicotico">Grave com sintomas psicóticos</option>
      </Select>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="w-72">
      <Select disabled defaultValue="internacao">
        <option value="ambulatorio">Ambulatório</option>
        <option value="internacao">Internação integral</option>
        <option value="caps">CAPS III</option>
      </Select>
    </div>
  );
}
