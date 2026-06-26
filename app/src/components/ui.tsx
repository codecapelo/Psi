import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { HelpCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// --------------------------------------------------------------------------
// Button
// --------------------------------------------------------------------------
type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline"
  | "ai";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-900/15 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/20 focus-visible:ring-brand-500",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-900/15 hover:bg-red-700 hover:shadow-md hover:shadow-red-900/20 focus-visible:ring-red-500",
  outline:
    "border border-slate-300 bg-transparent text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-brand-500 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800",
  ai: "bg-gradient-to-r from-violet-600 to-brand-600 text-white shadow-sm shadow-violet-900/20 hover:from-violet-700 hover:to-brand-700 hover:shadow-md hover:shadow-violet-900/25 focus-visible:ring-violet-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-lg font-medium transition-all duration-150 active:translate-y-px",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
        "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

// --------------------------------------------------------------------------
// Input / Textarea / Select
// --------------------------------------------------------------------------
const fieldBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...rest} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-[96px] resize-y leading-relaxed", className)}
    {...rest}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, "select-chevron cursor-pointer appearance-none pr-9", className)}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = "Select";

// --------------------------------------------------------------------------
// Field wrapper
// --------------------------------------------------------------------------
export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// --------------------------------------------------------------------------
// Card
// --------------------------------------------------------------------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// --------------------------------------------------------------------------
// Tooltip clínico (definição de achado)
// --------------------------------------------------------------------------
export function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <HelpCircle className="h-3.5 w-3.5 text-slate-400 transition-colors hover:text-brand-500" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs leading-snug text-white shadow-pop group-hover:block dark:bg-slate-700">
        {text}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-800 dark:bg-slate-700" />
      </span>
    </span>
  );
}

// --------------------------------------------------------------------------
// Checkbox com rótulo e tooltip de definição
// --------------------------------------------------------------------------
export function CheckboxItem({
  checked,
  onChange,
  label,
  tooltip,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tooltip?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
        checked && !disabled && "bg-brand-50/60 dark:bg-brand-900/15",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800"
      />
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      {tooltip && <Tooltip text={tooltip} />}
    </label>
  );
}

// --------------------------------------------------------------------------
// Badge
// --------------------------------------------------------------------------
export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?: "slate" | "green" | "red" | "amber" | "brand";
}) {
  const colors: Record<string, string> = {
    slate:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    green:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800/60",
    red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-800/60",
    amber:
      "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800/60",
    brand:
      "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-800/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        colors[color],
      )}
    >
      {children}
    </span>
  );
}

// --------------------------------------------------------------------------
// Modal
// --------------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-pop ring-1 ring-slate-900/5 animate-scale-in dark:bg-slate-900 dark:ring-white/10",
          sizes[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="-mr-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Estados utilitários
// --------------------------------------------------------------------------
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/40 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/30">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
