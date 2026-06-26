import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users as UsersIcon, Trash2, KeyRound, UserPlus, Mail } from "lucide-react";
import apiClient, { ApiError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/utils";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Spinner,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toDelete, setToDelete] = useState<User | null>(null);

  const list = useQuery({
    queryKey: ["users"],
    queryFn: apiClient.users.list,
    retry: false,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });
  const onError = (e: unknown) =>
    toast(e instanceof ApiError ? e.message : "Erro inesperado.", "error");

  const create = useMutation({
    mutationFn: () => apiClient.users.create(email.trim(), password),
    onSuccess: () => {
      toast("Profissional cadastrado.", "success");
      setEmail("");
      setPassword("");
      invalidate();
    },
    onError,
  });

  const resetPwd = useMutation({
    mutationFn: ({ id, pwd }: { id: string; pwd: string }) =>
      apiClient.users.setPassword(id, pwd),
    onSuccess: () => {
      toast("Senha redefinida.", "success");
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.users.remove(id),
    onSuccess: () => {
      toast("Profissional removido.", "success");
      setToDelete(null);
      invalidate();
    },
    onError: (e) => {
      onError(e);
      setToDelete(null);
    },
  });

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 8) {
      toast("Informe um e-mail e uma senha com ao menos 8 caracteres.", "error");
      return;
    }
    create.mutate();
  }

  const errorMessage =
    list.isError &&
    "Não foi possível carregar os usuários (configure o banco e o admin).";
  const data = list.data ?? [];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 sm:flex dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
          <UsersIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Profissionais com acesso ao sistema. O administrador é definido por
            variável de ambiente e não aparece nesta lista.
          </p>
        </div>
      </div>

      {/* Cadastro */}
      <Card className="mb-6">
        <CardHeader title="Novo profissional" subtitle="E-mail e senha de acesso" />
        <form onSubmit={onCreate} className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" required className="mb-0">
              <Input
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="profissional@clinica.com"
              />
            </Field>
            <Field label="Senha (mín. 8 caracteres)" required className="mb-0">
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              loading={create.isPending}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Cadastrar
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista */}
      {list.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : errorMessage ? (
        <EmptyState
          icon={<UsersIcon className="h-10 w-10" />}
          title="Usuários indisponíveis"
          description={errorMessage}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-10 w-10" />}
          title="Nenhum profissional cadastrado"
          description="Cadastre o primeiro profissional no formulário acima."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:from-brand-900/40 dark:to-brand-900/20 dark:text-brand-300 dark:ring-brand-900/40">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {u.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      desde {formatDate(u.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<KeyRound className="h-4 w-4" />}
                    loading={resetPwd.isPending}
                    onClick={() => {
                      const pwd = window.prompt(
                        `Nova senha para ${u.email} (mín. 8 caracteres):`,
                      );
                      if (pwd == null) return;
                      if (pwd.length < 8) {
                        toast("A senha deve ter ao menos 8 caracteres.", "error");
                        return;
                      }
                      resetPwd.mutate({ id: u.id, pwd });
                    }}
                  >
                    Senha
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setToDelete(u)}
                  >
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="Remover profissional"
        message={
          <>
            Remover o acesso de <strong>{toDelete?.email}</strong>? Esta ação não
            pode ser desfeita.
          </>
        }
        confirmLabel="Remover"
        danger
        loading={remove.isPending}
      />
    </div>
  );
}
