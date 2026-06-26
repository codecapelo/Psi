import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenLine, Stethoscope } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Button, Badge, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AiAssistButton, AiDisclaimer } from "@/components/ai";
import { useExam, useExamSlice } from "@/context/ExamContext";
import { useToast } from "@/context/ToastContext";
import apiClient from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Exam } from "@/lib/types";

// --------------------------------------------------------------------------
// Modelo da alta (fatia data.alta)
// --------------------------------------------------------------------------
interface AltaData {
  resumo: string;
  diagnosticos: string;
  conduta: string;
  encaminhamentos: string;
  prognostico: string;
}

const DEFAULTS: AltaData = {
  resumo: "",
  diagnosticos: "",
  conduta: "",
  encaminhamentos: "",
  prognostico: "",
};

interface EvolucaoShape {
  s?: string;
  o?: string;
  a?: string;
  p?: string;
}

/** Extrai uma linha de trajetória legível de um atendimento do episódio. */
function describeExam(ex: Exam): { titulo: string; detalhe: string } {
  const data = ex.data as Record<string, unknown>;
  if (ex.tipo === "admissao" || ex.tipo === "consulta") {
    const diag = (data.diagnostico ?? {}) as Record<string, string>;
    const detalhe = [diag.sindromico, diag.nosologico].filter(Boolean).join(" — ");
    return { titulo: ex.tipo === "admissao" ? "Admissão" : "Consulta", detalhe };
  }
  if (ex.tipo === "evolucao") {
    const ev = (data.evolucao ?? {}) as EvolucaoShape;
    return { titulo: `Evolução ${ex.seq ?? ""}`.trim(), detalhe: ev.a?.trim() || ev.p?.trim() || "" };
  }
  return { titulo: ex.tipo ?? "Atendimento", detalhe: "" };
}

/** Monta o texto da trajetória completa do episódio para envio à IA. */
function buildTrajetoria(exams: Exam[]): string {
  return exams
    .map((ex) => {
      const { titulo, detalhe } = describeExam(ex);
      const data = ex.data as Record<string, unknown>;
      const ev = (data.evolucao ?? {}) as EvolucaoShape;
      const linhas = [
        `### ${titulo} — ${formatDate(ex.createdAt, true)}`,
        ex.tipo === "evolucao"
          ? [
              ev.s && `S: ${ev.s}`,
              ev.o && `O: ${ev.o}`,
              ev.a && `A: ${ev.a}`,
              ev.p && `P: ${ev.p}`,
            ]
              .filter(Boolean)
              .join("\n")
          : detalhe,
      ];
      return linhas.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

const ALTA_SYSTEM =
  "Você é um psiquiatra redigindo o RESUMO DE ALTA de um episódio de cuidado. " +
  "A partir da trajetória (admissão → evoluções), escreva um resumo clínico claro e cronológico: " +
  "estado na admissão, evolução durante o acompanhamento e condição na alta. " +
  "Use APENAS o que está no material; não invente. Texto técnico, objetivo, em português.";

export default function AltaStep() {
  const [alta, patch] = useExamSlice<AltaData>("alta", DEFAULTS);
  const { exam, locked, lock } = useExam();
  const { toast } = useToast();
  const [signing, setSigning] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);

  const patientId = exam?.patientId;
  const episodeId = exam?.episodeId ?? null;

  const episodesQ = useQuery({
    queryKey: ["episodes", patientId],
    queryFn: () => apiClient.episodes.listByPatient(patientId!),
    enabled: !!patientId,
  });

  const episode = episodesQ.data?.find((ep) => ep.id === episodeId);
  // Trajetória = atendimentos do episódio, exceto a própria alta, em ordem.
  const trajetoria = (episode?.exams ?? [])
    .filter((ex) => ex.tipo !== "alta")
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  const doSign = async () => {
    setConfirmSign(false);
    setSigning(true);
    try {
      await lock();
      toast("Alta assinada — episódio encerrado.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao assinar a alta.", "error");
    } finally {
      setSigning(false);
    }
  };

  return (
    <StepShell
      title="Alta"
      description="Resumo de alta do episódio — organiza a trajetória da admissão até este momento."
      actions={
        !locked && (
          <Button
            variant="primary"
            size="sm"
            icon={<PenLine className="h-4 w-4" />}
            loading={signing}
            onClick={() => setConfirmSign(true)}
          >
            Assinar alta
          </Button>
        )
      }
    >
      {/* ── Trajetória do episódio (somente leitura) ──────────────────── */}
      <Card className="mb-4">
        <CardHeader
          title="Trajetória do episódio"
          subtitle="Admissão e evoluções que compõem este episódio de cuidado."
        />
        <div className="p-5">
          {episodesQ.isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : trajetoria.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhum atendimento anterior encontrado neste episódio.
            </p>
          ) : (
            <ol className="relative space-y-3 border-l border-slate-200 pl-5 dark:border-slate-700">
              {trajetoria.map((ex) => {
                const { titulo, detalhe } = describeExam(ex);
                return (
                  <li key={ex.id} className="relative">
                    <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {titulo}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(ex.createdAt, true)}
                      </span>
                      {ex.lockedAt && <Badge color="green">assinada</Badge>}
                    </div>
                    {detalhe && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {detalhe}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Card>

      {/* ── Documento de alta ─────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Resumo de Alta"
          subtitle="Redija ou gere o resumo do episódio. Revise sempre — a decisão clínica é do profissional."
          actions={
            !locked && (
              <AiAssistButton
                label="Gerar resumo (IA)"
                request={() => ({
                  task: "synthesize",
                  messages: [
                    { role: "system", content: ALTA_SYSTEM },
                    {
                      role: "user",
                      content: `TRAJETÓRIA DO EPISÓDIO:\n\n${buildTrajetoria(trajetoria) || "(sem atendimentos)"}`,
                    },
                  ],
                })}
                onResult={(text) => patch({ resumo: text })}
              />
            )
          }
        />
        <div className="p-5">
          <Field label="Resumo da internação / acompanhamento" hint="Estado na admissão, evolução e condição na alta.">
            <Textarea
              value={alta.resumo}
              onChange={(e) => patch({ resumo: e.target.value })}
              rows={8}
              disabled={locked}
            />
          </Field>
          <Field label="Diagnósticos de alta">
            <Textarea
              value={alta.diagnosticos}
              onChange={(e) => patch({ diagnosticos: e.target.value })}
              rows={3}
              disabled={locked}
            />
          </Field>
          <Field label="Conduta / medicação na alta">
            <Textarea
              value={alta.conduta}
              onChange={(e) => patch({ conduta: e.target.value })}
              rows={4}
              disabled={locked}
            />
          </Field>
          <Field label="Encaminhamentos e seguimento" hint="Referência, retorno ambulatorial, rede de apoio.">
            <Textarea
              value={alta.encaminhamentos}
              onChange={(e) => patch({ encaminhamentos: e.target.value })}
              rows={3}
              disabled={locked}
            />
          </Field>
          <Field label="Prognóstico">
            <Textarea
              value={alta.prognostico}
              onChange={(e) => patch({ prognostico: e.target.value })}
              rows={2}
              disabled={locked}
            />
          </Field>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Stethoscope className="h-3.5 w-3.5" />
            O resumo de alta integra os dados do episódio — confira antes de assinar.
          </div>
          {alta.resumo && <AiDisclaimer />}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmSign}
        onClose={() => setConfirmSign(false)}
        onConfirm={() => void doSign()}
        title="Assinar alta"
        message="Assinar a alta? O documento fica imutável e o episódio é encerrado."
        confirmLabel="Assinar alta"
        loading={signing}
      />
    </StepShell>
  );
}
