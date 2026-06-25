import { useState, type FormEvent } from "react";
import { Brain, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao entrar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Brain className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              SOPsi 2.0
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Acesso restrito a profissionais autorizados
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <Field label="E-mail" required>
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="profissional@clinica.com"
              autoFocus
              required
            />
          </Field>
          <Field label="Senha" required>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            icon={<LogIn className="h-4 w-4" />}
          >
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Dados clínicos protegidos — acesso registrado para fins de LGPD.
        </p>
      </Card>
    </div>
  );
}
