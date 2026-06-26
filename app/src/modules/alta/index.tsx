import { useState } from "react";
import { PenLine, Stethoscope } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { Card, CardHeader, Field, Textarea, Button, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AiAssistButton, AiDisclaimer } from "@/components/ai";
import {
  EpisodeTimeline,
  useEpisodeTrajetoria,
  describeExam,
} from "@/components/EpisodeTimeline";
import { useExam, useExamSlice } from "@/context/ExamContext";
import { useToast } from "@/context/ToastContext";
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
  const { trajetoria, isLoading } = useEpisodeTrajetoria(patientId, episodeId);

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
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : trajetoria.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhum atendimento anterior encontrado neste episódio.
            </p>
          ) : (
            <EpisodeTimeline exams={trajetoria} variant="document" />
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
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
            <Stethoscope className="h-3.5 w-3.5 shrink-0 text-slate-400" />
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
