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
import { useQuery } from "@tanstack/react-query";
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
  /** Força o flush imediato do que estiver pendente. */
  flush: () => Promise<void>;
  setStatus: (status: ExamStatus) => Promise<void>;
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

  // Sincroniza o estado local quando o exame carrega.
  useEffect(() => {
    if (query.data) {
      const d = query.data.data || {};
      dataRef.current = d;
      setData(d);
    }
  }, [query.data]);

  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const patch = pendingRef.current;
    if (!patch || Object.keys(patch).length === 0) return;
    pendingRef.current = {};
    setSaveState("saving");
    try {
      await apiClient.exams.patchData(examId, patch);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      // Reagenda o patch que falhou para nova tentativa.
      pendingRef.current = { ...patch, ...pendingRef.current };
    }
  }, [examId]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  }, [flush]);

  const updateSlice = useCallback(
    (key: string, value: unknown) => {
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
      refetch: query.refetch,
    }),
    [examId, query.data, query.isLoading, data, saveState, updateSlice, getData, flush, setStatus, query.refetch],
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
