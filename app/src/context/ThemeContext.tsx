import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// --------------------------------------------------------------------------
// Preferências de aparência (SOPsi 2.0). Além de claro/escuro, o shell suporta
// densidade, cor de destaque, animações e escala de fonte — aplicadas como
// classes/variáveis no <html> que o shell.css consome:
//   dark · density-compact · no-motion · accent-teal · --font-scale
// --------------------------------------------------------------------------
export type Density = "confortavel" | "compacto";
export type Accent = "azul" | "teal";

export interface ThemePrefs {
  dark: boolean;
  density: Density;
  accent: Accent;
  motion: boolean;
  fontScale: number;
}

const DEFAULTS: ThemePrefs = {
  dark: false,
  density: "confortavel",
  accent: "azul",
  motion: true,
  fontScale: 1,
};

interface ThemeCtx {
  prefs: ThemePrefs;
  setPref: <K extends keyof ThemePrefs>(key: K, value: ThemePrefs[K]) => void;
  /** Compat: tema atual derivado de `prefs.dark`. */
  theme: "light" | "dark";
  /** Compat: alterna claro/escuro. */
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const STORAGE_KEY = "sopsi.prefs";
// Chave antiga (só claro/escuro) — migrada na primeira leitura.
const LEGACY_KEY = "sopsi.theme";

function getInitial(): ThemePrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ThemePrefs>) };
  } catch {
    /* json inválido — cai no fallback */
  }
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === "dark" || legacy === "light") {
    return { ...DEFAULTS, dark: legacy === "dark" };
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return { ...DEFAULTS, dark: prefersDark };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePrefs>(getInitial);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", prefs.dark);
    el.classList.toggle("density-compact", prefs.density === "compacto");
    el.classList.toggle("no-motion", !prefs.motion);
    el.classList.toggle("accent-teal", prefs.accent === "teal");
    el.style.setProperty("--font-scale", String(prefs.fontScale || 1));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setPref = useCallback<ThemeCtx["setPref"]>((key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  const toggle = useCallback(() => {
    setPrefs((p) => ({ ...p, dark: !p.dark }));
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ prefs, setPref, theme: prefs.dark ? "dark" : "light", toggle }),
    [prefs, setPref, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
