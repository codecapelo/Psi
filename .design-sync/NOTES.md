# design-sync NOTES — SOPsi

Repo-specific gotchas for syncing the SOPsi UI to claude.ai/design. **Read before every re-sync.**

## What this DS is
SOPsi is an **app, not a packaged component library**: `app/` is a Vite + React + Tailwind SPA with no library `dist/`/`.d.ts` build. The design system is the reusable UI in `app/src/components/` — 19 components scoped in: the `ui.tsx` primitives, the presentational `ai.tsx` pieces, `ConfirmDialog`, `StepShell`, `EpisodeTimeline`.

## Converter command (run from repo root)
```
# 1. regenerate the compiled Tailwind CSS (cfg.buildCmd):
cd app && npx tailwindcss -c tailwind.config.js -i src/index.css -o ../.design-sync/.cache/styles.css --minify && cd ..
# 2. build + validate:
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules app/node_modules --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```
`entry`, `tsconfig`, `cssEntry`, `extraFonts` all come from `.design-sync/config.json`.

## Why the config looks the way it does (each is a load-bearing workaround)
- **Custom barrel entry** (`cfg.entry = .design-sync/ds-entry.tsx`): synth-entry mode needs `node_modules/<pkg>/src`, which an app doesn't have. The barrel re-exports the 19 scoped components + `PreviewProviders` from `@/components/*`. `--entry` makes PKG_DIR resolve to the repo root (walk-up to the first named `package.json`).
- **`node_modules` symlink → `app/node_modules`** (gitignored): the DTS prop parser (`lib/dts.mjs`) finds `@types/react` by walking UP from PKG_DIR (repo root). `app/node_modules` is a *child*, so it's never found → React utility types collapse to `any` → empty prop bodies + `[DTS_REACT]`. The symlink `ln -sfn app/node_modules node_modules` fixes it. **MUST be recreated on a fresh clone** (it's gitignored).
- **Dedicated paths-only tsconfig** (`cfg.tsconfig = .design-sync/ds-tsconfig.json`): the converter's `tsconfigPathsPlugin` (`lib/bundle.mjs`) strips comments with a regex that mis-parses the `/* … */` span between `"@/*"` and the `**/*.test.*` globs in the real `app/tsconfig.json`, corrupting the JSON so `@/` aliases don't resolve. The dedicated tsconfig has only `baseUrl` + `paths` (`@/*` → `../app/src/*`) + `jsx`, no glob `*/` sequences. **Do not point cfg.tsconfig at app/tsconfig.json.**
- **`cfg.dtsPropsFor` for all 19**: the app ships no `.d.ts`, and `--entry` mode reads props from a `.d.ts` tree (none) → every prop body came out `[key: string]: unknown`. The bodies are hand-written from source. **Re-sync risk:** if a component's props change in `app/src/components/*`, update its `dtsPropsFor` entry by hand — it does NOT auto-update.
- **Compiled CSS** (`cfg.cssEntry = .design-sync/.cache/styles.css`): standalone Tailwind compile via **`.design-sync/tailwind.ds.config.mjs`** (extends `app/tailwind.config.js` — same brand/accent/shadow/font theme — but widens `content` to ALSO scan `.design-sync/previews/**`). The app's own config scans only `app/src/**`, so utility classes used ONLY in preview layout glue (e.g. `max-w-xl`, `w-72`) were silently dropped → preview cards rendered with wrong widths. The DS config fixes that. Gives every utility used app-wide + in previews + the custom `@layer` classes (`field-label`, `field-hint`, `app-canvas`, `select-chevron`, `prose-clinical`, …). `.cache/` is gitignored, so **`cfg.buildCmd` MUST run before the converter** to regenerate it (it depends on the `node_modules` symlink to resolve the `tailwindcss` binary).
- **Fonts**: Inter Variable is self-hosted via `@fontsource-variable/inter` (extraFonts → its `index.css`). `.design-sync/fonts-inter-alias.css` also aliases the bare `"Inter"` family (the app font stack is `"Inter Variable", "Inter", …`) to the same woff2 — without it validate prints `[FONT_MISSING]` for `Inter`.
- **`PreviewProviders`** (`.design-sync/preview-providers.tsx`, referenced by `cfg.provider`): 3 components need React context — `StepShell` → `ExamProvider` (+ react-query), `AiAssistButton`/`TranscribeButton` → `ToastProvider`. The wrapper nests `QueryClient → Toast → Exam(examId="preview")`. The exam query fires once at `/api/exams/preview`, fails harmlessly (`retry:false`), and ExamProvider renders its idle/unlocked state — exactly the read-only frame StepShell shows pre-edit. Exported from the barrel so it lives on `window.SOPsi` without becoming a card.
- **Groups via `cfg.docsMap`**: all 19 components live flat in `app/src/components/`, so group can't be derived from the path. `docsMap` points each component at a category stub (`.design-sync/groups/{primitives,ai,patterns}.md`). This is a deliberate enumeration *for grouping only* (the stubs have no doc body — prompts are synthesized). **A newly-added component defaults to group `general` until added to docsMap.**
- **Overlays**: `Modal` and `ConfirmDialog` are `position:fixed` overlays → `cfg.overrides` sets `cardMode:single` + a viewport so the open dialog renders inside its card.

## Component authoring notes (from the fan-out waves)
- **Spinner** has no default color (renders at `currentColor`) — pass `className="text-brand-600"` for the brand spinner; compose it in a loading context so the card has body.
- **CardHeader** must be rendered inside a `<Card>` (it's the card's header band); `actions` are right-aligned.
- **grid grid-cols-2** on a `<dl>` collapsed to one column in the capture renderer — prefer explicit flex rows for a true two-column field grid in preview files.
- Preview authors: verify a utility class exists before relying on it (`grep '<class>' .design-sync/.cache/styles.css`) — though the DS tailwind config now scans previews, so newly-used classes compile after a `cfg.buildCmd` run.

## Known render warns (legitimate — not new)
- **Tooltip**: the tooltip popup is `hidden group-hover:block` → it does NOT appear in a static screenshot; the card shows only the help icon(s) in context. Expected.
- **Spinner**: a ~20px loader icon — small by nature; composed in a loading context.
- **Modal / ConfirmDialog**: fixed-overlay (`position:fixed`, centered) components — `maxHeight` reports a meaningless `32` (the in-flow root is empty). They use `cardMode:single` + a viewport override. The dialog BODIES render fully; if a thumbnail clips the sticky title bar, that's a capture artifact of centered fixed overlays, not a component fault.

## Re-sync risks (what can silently go stale)
- The `node_modules` symlink is gitignored → recreate it on a fresh clone or the DTS parse silently emits empty props again.
- `.design-sync/.cache/styles.css` is gitignored and regenerated by `cfg.buildCmd` → if you skip the buildCmd, the converter copies a stale/missing stylesheet.
- `cfg.dtsPropsFor` is hand-authored from source at sync time → drifts if component props change. Re-verify against `app/src/components/*` on a major change.
- The two converter-script workarounds (the tsconfig-glob regex bug, and the DTS up-only node_modules walk) live in the bundled `lib/*.mjs`; if a future skill version fixes them, the `ds-tsconfig.json` / symlink become harmless no-ops — but check.
- Fonts ship all Inter subsets (cyrillic/greek/vietnamese/latin) — only latin/latin-ext are needed for pt-BR; trim `extraFonts` if upload size matters.
