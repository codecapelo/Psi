import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Database,
  AlertTriangle,
  FileText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Card, CardHeader, Badge, Button, Input, Modal } from "@/components/ui";

const CONSENT_KEY = "sopsi.consent";

function getConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

function setConsent(value: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, String(value));
  } catch {
    /* sem acesso ao localStorage */
  }
}

export default function PrivacyPage() {
  const { toast } = useToast();

  // ----- Consentimento -----
  const [consentActive, setConsentActive] = useState<boolean>(getConsent);

  function handleToggleConsent() {
    const next = !consentActive;
    setConsent(next);
    setConsentActive(next);
    toast(
      next
        ? "Consentimento informado registrado."
        : "Consentimento revogado. Seus dados permanecem no servidor até solicitação formal de exclusão.",
      next ? "success" : "info",
    );
  }

  // ----- Health -----
  const health = useQuery({
    queryKey: ["health"],
    queryFn: apiClient.health,
    retry: false,
  });

  // ----- Wipe All -----
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState("");

  const wipeMutation = useMutation({
    mutationFn: apiClient.privacy.wipeAll,
    onSuccess: () => {
      setWipeOpen(false);
      setWipeConfirmText("");
      toast("Todos os dados foram apagados permanentemente.", "success");
    },
    onError: (err: Error) => {
      toast(`Erro ao apagar dados: ${err.message}`, "error");
    },
  });

  function handleWipeConfirm() {
    wipeMutation.mutate();
  }

  const wipeButtonEnabled = wipeConfirmText === "APAGAR";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Dados &amp; Privacidade
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Consentimento informado, armazenamento de dados e direito ao
        esquecimento (LGPD).
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Card 1 — Consentimento                                              */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Status de Consentimento"
          subtitle="Registre ou revogue o consentimento informado para coleta e tratamento dos dados clínicos."
          actions={
            <Badge color={consentActive ? "green" : "red"}>
              {consentActive ? "Ativo" : "Inativo"}
            </Badge>
          }
        />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {consentActive ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            )}
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {consentActive
                ? "O titular dos dados concordou com a coleta e tratamento das informações clínicas nos termos da LGPD."
                : "Consentimento não registrado. O titular não autorizou formalmente o tratamento dos dados."}
            </p>
          </div>
          <Button
            variant={consentActive ? "outline" : "primary"}
            size="sm"
            onClick={handleToggleConsent}
            className="shrink-0"
          >
            {consentActive ? "Revogar consentimento" : "Registrar consentimento"}
          </Button>
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-slate-800">
          O registro de consentimento é salvo localmente neste navegador. Em
          ambientes de produção, recomenda-se armazenar o consentimento
          assinado no prontuário físico ou sistema de gestão documental.
        </p>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Card 2 — Onde seus dados estão                                      */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Onde seus dados estão"
          subtitle="Transparência sobre o armazenamento e fluxo das informações clínicas."
        />
        <div className="space-y-4 p-5">
          {/* Banco de dados */}
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Banco de dados do servidor (Neon / PostgreSQL)
                </p>
                <Badge
                  color={
                    health.isLoading
                      ? "slate"
                      : health.data?.db
                        ? "green"
                        : "red"
                  }
                >
                  {health.isLoading
                    ? "Verificando…"
                    : health.data?.db
                      ? "Conectado"
                      : "Sem conexão"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Todos os dados clínicos — pacientes, exames, laudos e memórias
                MOSP — são armazenados exclusivamente no banco de dados
                centralizado (Neon/Postgres) acessado pelo backend. Não há
                dados clínicos gravados no navegador ou em dispositivo local.
              </p>
            </div>
          </div>

          {/* Auditoria */}
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Trilha de auditoria (LGPD)
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Toda operação sensível (criação, edição e exclusão de
                registros) é registrada na tabela de auditoria com data, hora
                e ação realizada, em conformidade com o art. 37 da LGPD.
              </p>
            </div>
          </div>

          {/* IA */}
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Integrações de IA (OpenAI)
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Trechos de texto clínico são enviados à API da OpenAI
                exclusivamente sob demanda — ao acionar transcrição ou geração
                de laudo. Os dados transitam de forma criptografada (TLS) e
                não são utilizados para treinar modelos (configuração
                Enterprise/zero data retention). Nenhum dado fica armazenado
                permanentemente nos servidores da OpenAI.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Card 3 — Princípios LGPD                                           */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-4">
        <CardHeader
          title="Princípios LGPD aplicados"
          subtitle="Como este sistema respeita a Lei Geral de Proteção de Dados (Lei 13.709/2018)."
        />
        <ul className="divide-y divide-slate-100 p-5 dark:divide-slate-800">
          {[
            {
              titulo: "Finalidade",
              descricao:
                "Os dados são coletados e tratados exclusivamente para fins de assistência psicológica e elaboração de laudos clínicos.",
            },
            {
              titulo: "Minimização",
              descricao:
                "Apenas as informações estritamente necessárias ao atendimento são coletadas. Dados sensíveis são tratados com proteção reforçada.",
            },
            {
              titulo: "Segurança",
              descricao:
                "A comunicação entre cliente e servidor utiliza HTTPS/TLS. O banco de dados é acessado por credenciais restritas ao ambiente de servidor.",
            },
            {
              titulo: "Direitos do titular",
              descricao:
                "O titular pode solicitar acesso, correção, portabilidade e exclusão dos seus dados. O botão 'Apagar Todos os Dados' abaixo executa o direito ao esquecimento.",
            },
          ].map((p) => (
            <li
              key={p.titulo}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {p.titulo}:{" "}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {p.descricao}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Card 4 — Zona de Perigo                                            */}
      {/* ------------------------------------------------------------------ */}
      <Card className="border-red-300 dark:border-red-800">
        <CardHeader
          title={
            <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Zona de Perigo — Direito ao Esquecimento
            </span>
          }
          subtitle="Ações irreversíveis de exclusão permanente de dados."
        />
        <div className="p-5">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            O <strong>Direito ao Esquecimento</strong> (art. 18, IV, LGPD)
            permite apagar todos os dados pessoais armazenados no sistema.
            Esta ação removerá permanentemente todos os pacientes, exames,
            laudos, memórias MOSP e a trilha de auditoria do banco de dados.
          </p>
          <Button
            variant="danger"
            size="md"
            icon={<AlertTriangle className="h-4 w-4" />}
            onClick={() => {
              setWipeConfirmText("");
              setWipeOpen(true);
            }}
          >
            Apagar Todos os Dados
          </Button>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Modal de confirmação do Wipe                                        */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        open={wipeOpen}
        onClose={() => {
          if (!wipeMutation.isPending) {
            setWipeOpen(false);
            setWipeConfirmText("");
          }
        }}
        title="Apagar todos os dados permanentemente"
        size="sm"
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Esta ação irá <strong>apagar permanentemente</strong> todos os
            registros do banco de dados:
          </p>
          <ul className="list-inside list-disc space-y-1 text-slate-500 dark:text-slate-400">
            <li>Todos os pacientes</li>
            <li>Todos os exames e laudos</li>
            <li>Todas as memórias MOSP</li>
            <li>Toda a trilha de auditoria</li>
          </ul>
          <p className="font-semibold text-red-600 dark:text-red-400">
            Esta operação é irreversível e não pode ser desfeita.
          </p>
          <div className="pt-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Para confirmar, digite{" "}
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                APAGAR
              </span>{" "}
              abaixo:
            </label>
            <Input
              value={wipeConfirmText}
              onChange={(e) => setWipeConfirmText(e.target.value)}
              placeholder="APAGAR"
              disabled={wipeMutation.isPending}
              className="font-mono"
            />
            {!wipeButtonEnabled && wipeConfirmText.length > 0 && (
              <p className="mt-1 text-xs text-red-500">
                Digite exatamente "APAGAR" para habilitar a exclusão.
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setWipeOpen(false);
              setWipeConfirmText("");
            }}
            disabled={wipeMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleWipeConfirm}
            loading={wipeMutation.isPending}
            disabled={!wipeButtonEnabled || wipeMutation.isPending}
          >
            Apagar definitivamente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
