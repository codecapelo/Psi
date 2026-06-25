import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Exam, ExamData, ExamStatus, ExamWithPatient } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

interface ExamCtx {
  examId: string;
  exam: ExamWithPatient | undefined;
  data: ExamData;
  isLoading: boolean;
  saveState: SaveState;
  /** Grava (merge no topo) a fatia `key` do JSON do exame, com autosave. */
  updateSlice: (key: string, value: unknown) => void;
  /** Lê o JSON do exame mais recente (ref síncrona, válida fora do render). */
  getData: () => ExamData;
  /** Força o flush imediato do que estiver pendente. Retorna false se falhou. */
  flush: () => Promise<boolean>;
  setStatus: (status: ExamStatus) => Promise<void>;
  /** Documento assinado/imutável — edições são ignoradas. */
  locked: boolean;
  /** Assina o atendimento (gera hash, torna imutável). */
  lock: () => Promise<void>;
  refetch: () => void;
}

const Ctx = createContext<ExamCtx | null>(null);

const AUTOSAVE_MS = 900;

export function ExamProvider({
  examId,
  children,
}: {
  examId: string;
  children: ReactNode;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => apiClient.exams.get(examId),
  });

  const [data, setData] = useState<ExamData>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Patch pendente acumulado entre flushes do autosave.
  const pendingRef = useRef<ExamData>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Espelho SÍNCRONO de `data`: fonte de verdade para leituras/merges fora do
  // ciclo de render (ex.: aplicar resultado de IA após um await) — evita
  // sobrescrever edições feitas enquanto a operação assíncrona estava pendente.
  const dataRef = useRef<ExamData>({});
  // Espelho síncrono do estado "assinado" — consultado por updateSlice sem
  // recriar o callback a cada mudança do exame.
  const lockedRef = useRef(false);

  const locked = !!query.data?.lockedAt;

  // Sincroniza o estado local quando o exame carrega.
  useEffect(() => {
    if (query.data) {
      const d = query.data.data || {};
      dataRef.current = d;
      setData(d);
      lockedRef.current = !!query.data.lockedAt;
    }
  }, [query.data]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const patch = pendingRef.current;
    if (!patch || Object.keys(patch).length === 0) return true;
    pendingRef.current = {};
    setSaveState("saving");
    try {
      await apiClient.exams.patchData(examId, patch);
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("error");
      // Reagenda o patch que falhou para nova tentativa.
      pendingRef.current = { ...patch, ...pendingRef.current };
      return false;
    }
  }, [examId]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  }, [flush]);

  const updateSlice = useCallback(
    (key: string, value: unknown) => {
      // Documento assinado é imutável: ignora qualquer edição.
      if (lockedRef.current) return;
      // Atualiza a ref síncrona ANTES do setData, para que merges/leituras
      // subsequentes no mesmo tick (ou em callbacks async) já enxerguem o valor.
      dataRef.current = { ...dataRef.current, [key]: value };
      setData(dataRef.current);
      pendingRef.current[key] = value;
      setSaveState("saving");
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const getData = useCallback(() => dataRef.current, []);

  const lock = useCallback(async () => {
    // 1) Bloqueia novas edições ANTES de tudo, para nada escapar durante a
    //    assinatura, e cancela o autosave agendado.
    lockedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    // 2) Persiste o que estiver pendente. Se a gravação falhar, NÃO assina —
    //    senão lacraríamos um documento sem as últimas edições do profissional.
    const saved = await flush();
    if (!saved) {
      lockedRef.current = !!query.data?.lockedAt; // reverte: edições voltam a ser possíveis
      throw new Error(
        "Não foi possível salvar as alterações antes de assinar. Verifique a conexão e tente novamente.",
      );
    }
    // 3) Tudo salvo e bloqueado — assina.
    try {
      await apiClient.exams.lock(examId);
    } catch (err) {
      lockedRef.current = !!query.data?.lockedAt;
      throw err;
    }
    const pid = query.data?.patientId;
    if (pid) {
      qc.invalidateQueries({ queryKey: ["episodes", pid] });
      qc.invalidateQueries({ queryKey: ["exams", pid] });
    }
    query.refetch();
  }, [examId, flush, query, qc]);

  const setStatus = useCallback(
    async (status: ExamStatus) => {
      await flush();
      await apiClient.exams.setStatus(examId, status);
      query.refetch();
    },
    [examId, flush, query],
  );

  // Flush ao desmontar / fechar a aba.
  useEffect(() => {
    const handler = () => void flush();
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      void flush();
    };
  }, [flush]);

  const value = useMemo<ExamCtx>(
    () => ({
      examId,
      exam: query.data,
      data,
      isLoading: query.isLoading,
      saveState,
      updateSlice,
      getData,
      flush,
      setStatus,
      locked,
      lock,
      refetch: query.refetch,
    }),
    [examId, query.data, query.isLoading, data, saveState, updateSlice, getData, flush, setStatus, locked, lock, query.refetch],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExam(): ExamCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExam deve ser usado dentro de ExamProvider");
  return ctx;
}

/**
 * Acesso tipado a uma fatia do JSON do exame, com autosave.
 *
 * Uso num módulo:
 *   interface MinhaFatia { campoA: string; }
 *   const [slice, patch] = useExamSlice<MinhaFatia>("meuModulo", { campoA: "" });
 *   patch({ campoA: "novo valor" }); // merge raso + autosave
 */
export function useExamSlice<T extends object>(
  key: string,
  defaults: T,
): [T, (patch: Partial<T>) => void, (value: T) => void, () => T] {
  const { data, updateSlice, getData } = useExam();
  const current = { ...defaults, ...((data[key] as T) || {}) };

  const patch = useCallback(
    (p: Partial<T>) => {
      // Mescla sobre o estado MAIS RECENTE (getData), não sobre o snapshot
      // capturado no render. Evita reverter edições feitas pelo profissional
      // enquanto uma operação assíncrona (ex.: IA) estava pendente.
      const base = (getData()[key] as T) || {};
      updateSlice(key, { ...defaults, ...base, ...p });
    },
    [key, updateSlice, defaults, getData],
  );

  const replace = useCallback(
    (value: T) => updateSlice(key, value),
    [key, updateSlice],
  );

  /** Lê a fatia mais recente — use em callbacks async antes de aplicar patch. */
  const getLatest = useCallback(
    () => ({ ...defaults, ...((getData()[key] as T) || {}) }),
    [key, defaults, getData],
  );

  return [current, patch, replace, getLatest];
}

export type { Exam, ExamWithPatient };
