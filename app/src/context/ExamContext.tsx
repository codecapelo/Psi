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

  // Sincroniza o estado local quando o exame carrega.
  useEffect(() => {
    if (query.data) setData(query.data.data || {});
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
      setData((prev) => ({ ...prev, [key]: value }));
      pendingRef.current[key] = value;
      setSaveState("saving");
      scheduleFlush();
    },
    [scheduleFlush],
  );

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
      flush,
      setStatus,
      refetch: query.refetch,
    }),
    [examId, query.data, query.isLoading, data, saveState, updateSlice, flush, setStatus, query.refetch],
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
): [T, (patch: Partial<T>) => void, (value: T) => void] {
  const { data, updateSlice } = useExam();
  const current = { ...defaults, ...((data[key] as T) || {}) };

  const patch = useCallback(
    (p: Partial<T>) => {
      const next = { ...defaults, ...((data[key] as T) || {}), ...p };
      updateSlice(key, next);
    },
    [data, key, updateSlice, defaults],
  );

  const replace = useCallback(
    (value: T) => updateSlice(key, value),
    [key, updateSlice],
  );

  return [current, patch, replace];
}

export type { Exam, ExamWithPatient };
