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
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-lg",
              "bg-white dark:bg-slate-800",
              t.kind === "success" &&
                "border-emerald-200 dark:border-emerald-900",
              t.kind === "error" && "border-red-200 dark:border-red-900",
              t.kind === "info" && "border-slate-200 dark:border-slate-700",
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
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
              {t.message}
            </span>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
