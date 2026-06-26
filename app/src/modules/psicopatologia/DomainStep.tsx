import { CheckCircle2 } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CheckboxItem, Field, Textarea, Button } from "@/components/ui";
import { useExamSlice } from "@/context/ExamContext";
import { SLICE } from "@/modules/sliceKeys";
import { getDomain } from "./domains";

interface DomainState {
  selected: string[];
  notes: string;
}
type PsicoState = Record<string, DomainState>;

const EMPTY: DomainState = { selected: [], notes: "" };

/** Cria o componente de etapa para um domínio semiológico específico. */
export function makeDomainStep(domainId: string) {
  function DomainStep() {
    const domain = getDomain(domainId);
    const [psico, patch] = useExamSlice<PsicoState>(SLICE.psicopatologia, {});

    if (!domain) return <div>Domínio não encontrado: {domainId}</div>;

    const state: DomainState = { ...EMPTY, ...(psico[domainId] || {}) };

    const setState = (next: Partial<DomainState>) => {
      patch({ [domainId]: { ...state, ...next } } as Partial<PsicoState>);
    };

    const toggle = (label: string, checked: boolean) => {
      const selected = checked
        ? [...state.selected, label]
        : state.selected.filter((l) => l !== label);
      setState({ selected });
    };

    const fillNormal = () => {
      const normals = domain.categories
        .flatMap((c) => c.items)
        .filter((i) => i.normal)
        .map((i) => i.label);
      setState({ selected: normals });
    };

    return (
      <StepShell
        title={domain.title}
        description={domain.description}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={fillNormal}
          >
            Marcar normais
          </Button>
        }
      >
        <Card className="divide-y divide-slate-100 p-5 dark:divide-slate-800">
          {domain.categories.map((cat, ci) => (
            <div key={ci} className="py-4 first:pt-0 last:pb-0">
              {cat.name && (
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {cat.name}
                </h4>
              )}
              <div className="grid gap-0.5 sm:grid-cols-2">
                {cat.items.map((item) => (
                  <CheckboxItem
                    key={item.label}
                    label={item.label}
                    tooltip={item.tooltip}
                    checked={state.selected.includes(item.label)}
                    onChange={(v) => toggle(item.label, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card className="mt-4 p-5">
          <Field
            label="Observações / descrição livre"
            hint="Detalhe os achados deste domínio."
          >
            <Textarea
              value={state.notes}
              onChange={(e) => setState({ notes: e.target.value })}
              placeholder={`Descreva os achados em ${domain.title.toLowerCase()}…`}
              rows={4}
            />
          </Field>
        </Card>
      </StepShell>
    );
  }
  DomainStep.displayName = `DomainStep(${domainId})`;
  return DomainStep;
}
