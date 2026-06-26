// Context wrapper for design-sync previews ONLY.
//
// Most SOPsi components (the ui.tsx primitives, AiDisclaimer, ConfirmDialog,
// EpisodeTimeline) are pure and need no context. Three do:
//   - StepShell           → useExam()  (ExamContext, which itself needs react-query)
//   - AiAssistButton       → useToast() (ToastContext)
//   - TranscribeButton     → useToast()
//
// This wrapper supplies all of them. The exams query fires once against
// /api/exams/preview, fails harmlessly in the preview sandbox (retry: false),
// and ExamProvider then renders children in its idle/unlocked state — exactly
// the read-only frame StepShell shows before any edit.
//
// Referenced by cfg.provider.component = "PreviewProviders"; exported from the
// bundle entry barrel so it lives on window.SOPsi without becoming a card.

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/context/ToastContext";
import { ExamProvider } from "@/context/ExamContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: Infinity },
  },
});

export function PreviewProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ExamProvider examId="preview">{children}</ExamProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
