import { Construction } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { EmptyState } from "@/components/ui";

/** Placeholder de etapa do wizard ainda não implementada. */
export function ModuleStub({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <StepShell title={title} description={description}>
      <EmptyState
        icon={<Construction className="h-10 w-10" />}
        title="Módulo em construção"
        description="Esta etapa será preenchida em breve."
      />
    </StepShell>
  );
}
