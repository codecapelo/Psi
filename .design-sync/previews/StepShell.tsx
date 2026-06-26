import { StepShell, Button, Field, Input, Textarea, Card } from "sopsi";

export function Default() {
  return (
    <StepShell
      title="Exame psíquico"
      description="Registre o estado mental atual do paciente. As alterações são salvas automaticamente."
      actions={
        <Button variant="ai" size="sm">
          Sugerir com IA
        </Button>
      }
    >
      <Card className="p-5">
        <Field
          label="Humor e afeto"
          hint="Descreva o humor relatado e o afeto observado durante a entrevista."
        >
          <Textarea placeholder="Ex.: humor deprimido, afeto congruente e hiporreativo…" />
        </Field>
        <Field label="Curso do pensamento" required>
          <Input placeholder="Curso, forma e conteúdo do pensamento" />
        </Field>
      </Card>
    </StepShell>
  );
}
