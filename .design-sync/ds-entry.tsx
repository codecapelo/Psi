// Design-sync bundle entry (synthetic barrel).
//
// This file is NOT part of the SOPsi app — it exists only so the design-sync
// converter has a single entry that re-exports exactly the components scoped
// into the design system, plus the preview provider wrapper. Everything here
// is the app's own real code, re-exported; nothing is reimplemented.
//
// `@/…` resolves to app/src via cfg.tsconfig (app/tsconfig.json).

export {
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Card,
  CardHeader,
  Tooltip,
  CheckboxItem,
  Badge,
  Modal,
  Spinner,
  EmptyState,
} from "@/components/ui";

export { AiAssistButton, TranscribeButton, AiDisclaimer } from "@/components/ai";
export { ConfirmDialog } from "@/components/ConfirmDialog";
export { StepShell } from "@/components/StepShell";
export { EpisodeTimeline } from "@/components/EpisodeTimeline";

// Preview-only context wrapper (referenced by cfg.provider). Ships in the
// bundle global but is never carded.
export { PreviewProviders } from "./preview-providers";
