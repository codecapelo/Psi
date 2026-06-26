import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback(
    (id: string) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-pop ring-1 ring-slate-900/5 animate-slide-in-right dark:bg-slate-800 dark:ring-white/5",
              t.kind === "success" &&
                "border-l-4 border-l-emerald-500 border-y-emerald-100 border-r-emerald-100 dark:border-y-emerald-900/40 dark:border-r-emerald-900/40",
              t.kind === "error" &&
                "border-l-4 border-l-red-500 border-y-red-100 border-r-red-100 dark:border-y-red-900/40 dark:border-r-red-900/40",
              t.kind === "info" &&
                "border-l-4 border-l-brand-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-700 dark:border-r-slate-700",
            )}
          >
            {t.kind === "success" && (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            )}
            {t.kind === "error" && (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            )}
            {t.kind === "info" && (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            )}
            <span className="flex-1 text-sm leading-snug text-slate-700 dark:text-slate-200">
              {t.message}
            </span>
            <button
              onClick={() => remove(t.id)}
              className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
