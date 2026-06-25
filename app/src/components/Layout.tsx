import { type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookText,
  ScrollText,
  ShieldCheck,
  Settings,
  Moon,
  Sun,
  Brain,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";

const NAV = [
  { to: "/", label: "Meus Pacientes", icon: Users, end: true },
  { to: "/mosp", label: "MOSP — Memória", icon: BookText },
  { to: "/auditoria", label: "Log de Auditoria", icon: ScrollText },
  { to: "/privacidade", label: "Dados & Privacidade", icon: ShieldCheck },
  { to: "/config", label: "Configurações", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  // Esconde a sidebar global dentro do wizard de exame (que tem rail próprio).
  const inExam = location.pathname.startsWith("/exame/");

  const health = useQuery({
    queryKey: ["health"],
    queryFn: apiClient.health,
    refetchInterval: 30_000,
    retry: false,
  });
  const online = health.data?.ok ?? false;

  return (
    <div className="flex h-full">
      {!inExam && (
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
          <Brand />
          <nav className="flex-1 space-y-1 p-3">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sistema
            </p>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-100 p-3 text-xs text-slate-400 dark:border-slate-800">
            SOPsi 2.0 · Registro Clínico Estruturado
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            {inExam && <Brand compact />}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                online
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  online ? "bg-emerald-500" : "bg-slate-400",
                )}
              />
              {online ? "Online" : "Offline"}
            </span>
            <span className="hidden text-xs text-slate-400 sm:inline">v2.0</span>
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {user && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-700">
                <span
                  className="hidden max-w-[160px] truncate text-xs text-slate-500 sm:inline dark:text-slate-400"
                  title={user.email}
                >
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact ? "" : "border-b border-slate-100 px-5 py-4 dark:border-slate-800",
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Brain className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <div className="font-bold text-slate-900 dark:text-slate-100">SOPsi</div>
        {!compact && (
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            Saúde Mental
          </div>
        )}
      </div>
    </div>
  );
}
