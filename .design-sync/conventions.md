# SOPsi design system — how to build with it

SOPsi is a calm, clinical UI for psychiatry / mental-health records (pt-BR). Components are real, compiled React on `window.SOPsi` (e.g. `window.SOPsi.Button`). They're styled with **Tailwind CSS** — so you write your own layout/glue with the SOPsi Tailwind classes below, and the design system's `styles.css` must be loaded for any of it to render.

## Setup
- **Load `styles.css`** (it `@import`s the compiled Tailwind + tokens + the self-hosted **Inter Variable** font). Without it, components and your utility classes render unstyled.
- **No provider needed** for the primitives, `AiDisclaimer`, `ConfirmDialog`, `Card`, `EpisodeTimeline`, etc. — pass props and go. (`StepShell` and the AI buttons read app context that only exists inside the SOPsi app; for design work, prefer the primitives.)
- **Dark mode** is opt-in: add `class="dark"` on an ancestor and the `dark:` variants activate.

## Styling idiom — Tailwind utilities, with SOPsi's token families
Style your own layout with these (real classes in `styles.css`):

| Need | Use |
|---|---|
| Brand color (primary, links, focus) | `bg-brand-600` `text-brand-700` `ring-brand-500` `border-brand-500` (scale `brand-50…950`, calm blue) |
| Longitudinal accent (timelines, calm highlights — use sparingly) | `text-accent-600` `bg-accent-50` `border-accent-200` (teal, scale `accent-50…950`) |
| Neutrals / text / surfaces | `slate-*` (e.g. `text-slate-600`, `bg-slate-50`, `border-slate-200`) |
| Semantic | success `emerald-*`, danger `red-*`, warning `amber-*`; **AI** = `violet`→`brand` gradient (`from-violet-600 to-brand-600`) |
| Elevation | `shadow-xs` `shadow-card` `shadow-card-hover` `shadow-pop` |
| Motion | `animate-fade-in` `animate-scale-in` `animate-slide-in-right` |
| Type | Inter Variable is the page default (set in base styles); use `tabular-nums` for aligned dates/scores |
| Radius | `rounded-lg` (controls), `rounded-xl` (cards), `rounded-2xl` (modals) |

Custom component classes also available: `.app-canvas` (page background with subtle brand/teal glow), `.field-label`, `.field-hint`, `.prose-clinical` (rendered clinical markdown), `.select-chevron`.

## Where the truth is
Read the design system's `styles.css` (and its `@import`s) for the exact token utilities, and each component's `.d.ts` (props) and `.prompt.md` (usage) before composing.

## Idiomatic example
```tsx
// Card + CardHeader + Badge + Button from SOPsi; layout glue in SOPsi Tailwind classes.
<div className="app-canvas p-6">
  <Card className="mx-auto max-w-2xl">
    <CardHeader
      title="Evolução clínica"
      subtitle="Episódio depressivo — 3º dia de internação"
      actions={<Badge color="green">assinada</Badge>}
    />
    <div className="space-y-4 px-6 py-5">
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Paciente refere melhora do humor e do sono; mantém apetite reduzido.
      </p>
      <Button variant="ai">Resumir com IA</Button>
    </div>
  </Card>
</div>
```
