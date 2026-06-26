import { type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCog,
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

interface NavItem {
  to: string;
  label: string;
  icon: typeof Users;
  end?: boolean;
}

function buildNav(isAdmin: boolean): NavItem[] {
  return [
    { to: "/", label: "Meus Pacientes", icon: Users, end: true },
    { to: "/mosp", label: "MOSP — Memória", icon: BookText },
    ...(isAdmin ? [{ to: "/usuarios", label: "Usuários", icon: UserCog }] : []),
    { to: "/auditoria", label: "Log de Auditoria", icon: ScrollText },
    { to: "/privacidade", label: "Dados & Privacidade", icon: ShieldCheck },
    { to: "/config", label: "Configurações", icon: Settings },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = buildNav(!!user?.isAdmin);
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
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
          <Brand />
          <nav className="flex-1 space-y-1 p-3">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Sistema
            </p>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300",
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-100 p-3 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800">
            SOPsi 2.0 · Registro Clínico Estruturado
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex items-center gap-2">
            {inExam && <Brand compact />}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                online
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800/60"
                  : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
              )}
            >
              <span className="relative flex h-2 w-2">
                {online && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
                <span
                  className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    online ? "bg-emerald-500" : "bg-slate-400",
                  )}
                />
              </span>
              {online ? "Online" : "Offline"}
            </span>
            <span className="hidden text-xs text-slate-400 sm:inline">v2.0</span>
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="app-canvas min-h-0 flex-1 overflow-y-auto">
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
        "flex items-center gap-2.5",
        compact ? "" : "border-b border-slate-100 px-5 py-4 dark:border-slate-800",
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/25">
        <Brain className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <div className="font-bold tracking-tight text-slate-900 dark:text-slate-100">
          SOPsi
        </div>
        {!compact && (
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Saúde Mental
          </div>
        )}
      </div>
    </div>
  );
}
