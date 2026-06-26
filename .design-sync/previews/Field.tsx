import { Field, Input, Select, Textarea } from "sopsi";

export function WithHint() {
  return (
    <div className="max-w-sm">
      <Field
        label="Dose diária de lítio"
        hint="Mantenha litemia entre 0,6 e 1,2 mEq/L; reavalie a cada 7 dias."
      >
        <Input defaultValue="900 mg/dia" />
      </Field>
    </div>
  );
}

export function Required() {
  return (
    <div className="max-w-sm">
      <Field
        label="Diagnóstico nosológico (CID-10)"
        required
        hint="Campo obrigatório para fechamento da internação."
      >
        <Input placeholder="Ex.: F31.1 — Transtorno afetivo bipolar" />
      </Field>
    </div>
  );
}

export function ComposedControls() {
  return (
    <div className="max-w-sm">
      <Field label="Modalidade de cuidado" required>
        <Select defaultValue="caps">
          <option value="ambulatorio">Ambulatório</option>
          <option value="caps">CAPS III</option>
          <option value="internacao">Internação integral</option>
        </Select>
      </Field>
      <Field
        label="Conduta e plano terapêutico"
        hint="Resumo do plano singular discutido em equipe."
      >
        <Textarea
          rows={3}
          defaultValue="Titular quetiapina para 300 mg/noite; manter acompanhamento com terapia ocupacional."
        />
      </Field>
    </div>
  );
}
