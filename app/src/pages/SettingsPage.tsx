import { useQuery } from "@tanstack/react-query";
import { Moon, Sun, Cpu, Database, Sparkles, Settings } from "lucide-react";
import apiClient from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardHeader, Button, Badge } from "@/components/ui";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const health = useQuery({
    queryKey: ["health"],
    queryFn: apiClient.health,
    retry: false,
  });

  return (
    <div className="mx-auto max-w-3xl animate-fade-in p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 sm:flex dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Configurações
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Preferências do aplicativo e status do sistema.
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader title="Aparência" />
        <div className="flex items-center justify-between p-5">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Tema {theme === "dark" ? "escuro" : "claro"}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            onClick={toggle}
          >
            Alternar
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Status do sistema" />
        <div className="space-y-3 p-5">
          <StatusRow
            icon={<Database className="h-4 w-4" />}
            label="Banco de dados (Neon)"
            ok={health.data?.db}
          />
          <StatusRow
            icon={<Sparkles className="h-4 w-4" />}
            label="IA (OpenAI)"
            ok={health.data?.ai}
          />
          <StatusRow
            icon={<Cpu className="h-4 w-4" />}
            label="Servidor"
            ok={health.data?.ok}
          />
          <p className="pt-2 text-xs text-slate-400">
            As credenciais (DATABASE_URL, OPENAI_API_KEY) são configuradas via
            variáveis de ambiente no servidor/Railway.
          </p>
        </div>
      </Card>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
      <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-700">
          {icon}
        </span>
        {label}
      </span>
      <Badge color={ok ? "green" : "red"}>
        {ok ? "Configurado" : "Não configurado"}
      </Badge>
    </div>
  );
}
