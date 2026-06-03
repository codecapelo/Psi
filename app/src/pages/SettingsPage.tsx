import { useQuery } from "@tanstack/react-query";
import { Moon, Sun, Cpu, Database, Sparkles } from "lucide-react";
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
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Configurações
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Preferências do aplicativo e status do sistema.
      </p>

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
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        {icon}
        {label}
      </span>
      <Badge color={ok ? "green" : "red"}>
        {ok ? "Configurado" : "Não configurado"}
      </Badge>
    </div>
  );
}
