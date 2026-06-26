// Tailwind config for the design-sync CSS compile ONLY.
//
// It extends the app's Tailwind config (same theme: brand/accent palettes,
// shadows, fonts, animations) but widens `content` to ALSO scan
// `.design-sync/previews/**` — otherwise utility classes used only in preview
// layout glue (e.g. max-w-xl, w-72) are dropped from the compiled stylesheet
// and preview cards render with wrong widths/spacing.
//
// Run from the repo root: content globs are cwd-relative.
import appConfig from "../app/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
  ...appConfig,
  content: [
    "app/index.html",
    "app/src/**/*.{js,ts,jsx,tsx}",
    ".design-sync/previews/**/*.{ts,tsx}",
  ],
};
