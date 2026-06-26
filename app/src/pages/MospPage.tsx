import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookText, Plus, Pencil, Trash2, Search, Sprout, AlertCircle } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import apiClient from "@/lib/api";
import type { MospMemory } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Card,
  Input,
  Textarea,
  Field,
  Modal,
  Badge,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// ---------------------------------------------------------------------------
// Helper: renderiza Markdown com segurança
// ---------------------------------------------------------------------------
function renderMd(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }) as string);
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export default function MospPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [toEdit, setToEdit] = useState<MospMemory | null>(null);
  const [toDelete, setToDelete] = useState<MospMemory | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Query ──────────────────────────────────────────────────────────────────
  const mospQ = useQuery({
    queryKey: ["mosp", search],
    queryFn: () => apiClient.mosp.list(search || undefined),
  });

  // ── Seed ──────────────────────────────────────────────────────────────────
  const seedMut = useMutation({
    mutationFn: () => apiClient.mosp.seed(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["mosp"] });
      toast(
        data.inserted === 0
          ? "Padrões já presentes — nenhum novo inserido."
          : `${data.inserted} memória(s) padrão inserida(s) com sucesso.`,
        data.inserted === 0 ? "info" : "success",
      );
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao semear padrões.", "error"),
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.mosp.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mosp"] });
      toast("Memória excluída.", "success");
      setToDelete(null);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao excluir.", "error"),
  });

  const memories = mospQ.data ?? [];

  return (
    <div className="mx-auto max-w-4xl animate-fade-in p-6">
      {/* Cabeçalho */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 sm:flex dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
            <BookText className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              MOSP — Memória Operacional SOPsi
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Diretrizes clínicas em Markdown ordenadas por prioridade, injetadas na IA por gatilhos.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            icon={<Sprout className="h-4 w-4" />}
            loading={seedMut.isPending}
            onClick={() => seedMut.mutate()}
          >
            Semear Padrões do App
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate(true)}
          >
            Nova Memória
          </Button>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Escrita restrita ao criador do app / usuários autorizados{" "}
          <span className="font-medium">(nesta versão, aberta)</span>.
        </span>
      </div>

      {/* Busca */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, gatilho ou conteúdo…"
          className="pl-9"
        />
      </div>

      {/* Estados: loading / erro / vazio / lista */}
      {mospQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : mospQ.isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50/40 px-6 py-14 text-center dark:border-red-700 dark:bg-red-900/10">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            Não foi possível carregar as memórias
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            O servidor pode estar indisponível ou sem banco de dados configurado (503). Tente novamente em instantes.
          </p>
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          icon={<BookText className="h-10 w-10" />}
          title={search ? "Nenhuma memória encontrada" : "Nenhuma memória cadastrada"}
          description={
            search
              ? "Tente outros termos de busca."
              : "Adicione a primeira diretriz clínica ou semeie os padrões do app."
          }
          action={
            !search && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  icon={<Sprout className="h-4 w-4" />}
                  loading={seedMut.isPending}
                  onClick={() => seedMut.mutate()}
                >
                  Semear Padrões
                </Button>
                <Button
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowCreate(true)}
                >
                  Nova Memória
                </Button>
              </div>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {memories.map((mem) => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              onEdit={() => setToEdit(mem)}
              onDelete={() => setToDelete(mem)}
            />
          ))}
        </div>
      )}

      {/* Modal — criar */}
      <MemoryFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["mosp"] });
          setShowCreate(false);
        }}
      />

      {/* Modal — editar */}
      <MemoryFormModal
        open={!!toEdit}
        memory={toEdit ?? undefined}
        onClose={() => setToEdit(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["mosp"] });
          setToEdit(null);
        }}
      />

      {/* ConfirmDialog — excluir */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Excluir memória"
        message={
          <>
            Excluir a memória <strong>{toDelete?.title}</strong>?
            Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        danger
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card de memória
// ---------------------------------------------------------------------------
function MemoryCard({
  memory,
  onEdit,
  onDelete,
}: {
  memory: MospMemory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const html = renderMd(memory.contentMd);

  return (
    <Card className="p-5 transition-all hover:border-slate-300 hover:shadow-card-hover dark:hover:border-slate-700">
      {/* Linha de título + ações */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {memory.title}
            </span>
            <Badge color="brand">Prioridade {memory.order}</Badge>
          </div>
          {/* Chips de gatilhos */}
          {memory.triggers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {memory.triggers.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" title="Editar" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Excluir" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Preview do conteúdo Markdown */}
      <div
        className="prose-clinical max-h-48 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Modal de criação / edição
// ---------------------------------------------------------------------------
function MemoryFormModal({
  open,
  onClose,
  onSaved,
  memory,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  memory?: MospMemory;
}) {
  const isEdit = !!memory;
  const { toast } = useToast();

  const [title, setTitle] = useState(memory?.title ?? "");
  const [order, setOrder] = useState(String(memory?.order ?? "10"));
  const [triggersRaw, setTriggersRaw] = useState(memory?.triggers.join(", ") ?? "");
  const [contentMd, setContentMd] = useState(memory?.contentMd ?? "");

  // Reset when memory changes (modal re-opens for a different item)
  const resetToMemory = (m?: MospMemory) => {
    setTitle(m?.title ?? "");
    setOrder(String(m?.order ?? "10"));
    setTriggersRaw(m?.triggers.join(", ") ?? "");
    setContentMd(m?.contentMd ?? "");
  };

  const handleClose = () => {
    resetToMemory(memory);
    onClose();
  };

  const buildPayload = () => ({
    title: title.trim(),
    order: parseInt(order, 10) || 10,
    triggers: triggersRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    contentMd: contentMd.trim(),
  });

  const createMut = useMutation({
    mutationFn: () => apiClient.mosp.create(buildPayload()),
    onSuccess: () => {
      toast("Memória criada com sucesso.", "success");
      resetToMemory();
      onSaved();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao criar memória.", "error"),
  });

  const updateMut = useMutation({
    mutationFn: () => apiClient.mosp.update(memory!.id, buildPayload()),
    onSuccess: () => {
      toast("Memória atualizada.", "success");
      onSaved();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao atualizar.", "error"),
  });

  const isPending = createMut.isPending || updateMut.isPending;
  const canSubmit = title.trim().length > 0 && contentMd.trim().length > 0;

  const handleSubmit = () => {
    if (isEdit) updateMut.mutate();
    else createMut.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar Memória" : "Nova Memória"}
      size="lg"
    >
      <Field label="Título" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Risco Suicida — Protocolo de Avaliação"
          autoFocus
        />
      </Field>

      <Field
        label="Ordem / Prioridade"
        hint="Número inteiro. Menor = maior prioridade na injeção ao prompt."
      >
        <Input
          type="number"
          min={1}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="max-w-[120px]"
        />
      </Field>

      <Field
        label="Gatilhos (palavras-chave)"
        hint="Separados por vírgula. A IA injeta esta memória quando detectar qualquer um desses termos."
      >
        <Input
          value={triggersRaw}
          onChange={(e) => setTriggersRaw(e.target.value)}
          placeholder="Ex.: suicídio, ideação suicida, automutilação"
        />
      </Field>

      <Field label="Conteúdo (Markdown)" required>
        <Textarea
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
          placeholder={"## Protocolo\n\n- Passo 1…\n- Passo 2…"}
          className="min-h-[220px] font-mono text-xs"
        />
      </Field>

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isPending}
          disabled={!canSubmit}
        >
          {isEdit ? "Salvar alterações" : "Criar memória"}
        </Button>
      </div>
    </Modal>
  );
}
