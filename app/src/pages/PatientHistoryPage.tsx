import { type ReactNode, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { ageFromISO, formatDate, relativeFromNow } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Button, Card, CardHeader, Badge, EmptyState, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EpisodeTimeline } from "@/components/EpisodeTimeline";
import { StartExamModal } from "@/components/StartExamModal";
import { Icon, type IconName } from "@/components/Icon";
import { PatientAvatar, StatusPill, RiskPill } from "@/components/shell-ui";
import { overviewKey } from "@/lib/queries";
import type {
  Exam,
  EpisodeWithExams,
  Patient,
  PatientClinical,
} from "@/lib/types";

const EPISODE_LABEL: Record<string, string> = {
  internacao: "Internação",
  ambulatorial: "Ambulatorial",
  consulta: "Consulta avulsa",
};

function InfoCard({
  icon,
  tint,
  title,
  children,
}: {
  icon: IconName;
  tint: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="surface surface-pad">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span className={"kpi-ico " + tint} style={{ width: 32, height: 32, flex: "0 0 32px", borderRadius: 9 }}>
          <Icon name={icon} size={16} />
        </span>
        <span className="sec-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** Diagnóstico/CID derivados do exame de admissão de um episódio. */
function diagOf(ep?: EpisodeWithExams): { sindromico: string; nosologico: string; cid: string } | null {
  const adm = ep?.exams.find((e) => e.tipo === "admissao");
  const d = (adm?.data?.diagnostico ?? {}) as Record<string, string>;
  if (d.sindromico || d.nosologico || d.cid)
    return { sindromico: d.sindromico ?? "", nosologico: d.nosologico ?? "", cid: d.cid ?? "" };
  return null;
}

function lastEvolucaoOf(ep?: EpisodeWithExams): { quando: string; texto: string } | null {
  const evols = (ep?.exams ?? []).filter((e) => e.tipo === "evolucao");
  const last = evols[evols.length - 1];
  if (!last) return null;
  const ev = (last.data?.evolucao ?? {}) as Record<string, string>;
  return { quando: last.createdAt, texto: (ev.a || ev.p || "").toString().trim() };
}

export default function PatientHistoryPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [toDiscard, setToDiscard] = useState<EpisodeWithExams | null>(null);
  const [startFor, setStartFor] = useState<Patient | null>(null);

  const patientQ = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => apiClient.patients.get(patientId!),
    enabled: !!patientId,
  });
  const episodesQ = useQuery({
    queryKey: ["episodes", patientId],
    queryFn: () => apiClient.episodes.listByPatient(patientId!),
    enabled: !!patientId,
  });
  const examsQ = useQuery({
    queryKey: ["exams", patientId],
    queryFn: () => apiClient.exams.listByPatient(patientId!),
    enabled: !!patientId,
  });
  const prescQ = useQuery({
    queryKey: ["prescription", patientId],
    queryFn: () => apiClient.prescriptions.get(patientId!),
    enabled: !!patientId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["episodes", patientId] });
    qc.invalidateQueries({ queryKey: ["exams", patientId] });
    qc.invalidateQueries({ queryKey: overviewKey });
  };
  const openFresh = (exam: { id: string }) => {
    invalidate();
    navigate(`/exame/${exam.id}`);
  };

  const addEvolucao = useMutation({
    mutationFn: (episodeId: string) => apiClient.episodes.addExam(episodeId, "evolucao"),
    onSuccess: openFresh,
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao criar a evolução.", "error"),
  });
  const darAlta = useMutation({
    mutationFn: (episodeId: string) => apiClient.episodes.addExam(episodeId, "alta"),
    onSuccess: openFresh,
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao registrar a alta.", "error"),
  });
  const discardEpisode = useMutation({
    mutationFn: (id: string) => apiClient.episodes.remove(id),
    onSuccess: () => {
      invalidate();
      toast("Internação descartada.", "success");
      setToDiscard(null);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro ao descartar.", "error"),
  });

  const patient = patientQ.data;
  const clinical = (patient?.clinical ?? {}) as PatientClinical;
  const episodes = [...(episodesQ.data ?? [])].sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
  );
  const looseExams = (examsQ.data ?? [])
    .filter((e) => !e.episodeId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const openInternacao = episodes.find((ep) => ep.tipo === "internacao" && ep.status === "aberto");
  const primary = openInternacao ?? episodes[0];
  const altaDraft = openInternacao?.exams.find((e) => e.tipo === "alta" && !e.lockedAt);
  const hasAlta = !!openInternacao?.exams.some((e) => e.tipo === "alta");
  const status = openInternacao ? (hasAlta ? "alta-elaboracao" : "internado") : null;
  const diagnostico = diagOf(primary);
  const ultimaEvolucao = lastEvolucaoOf(primary);
  const diasInternado = openInternacao
    ? Math.max(0, Math.floor((Date.now() - new Date(openInternacao.openedAt).getTime()) / 86_400_000))
    : null;

  const meds = (prescQ.data?.items ?? []).filter((m) => m.status !== "suspenso");
  const idade = ageFromISO(patient?.details?.nascimento);
  const sexo = patient?.details?.sexo;

  const loading = episodesQ.isLoading || examsQ.isLoading;
  const busy = addEvolucao.isPending || darAlta.isPending;

  return (
    <div className="page page-wide screen-enter">
      {/* Cabeçalho do paciente */}
      <div className="surface surface-pad" style={{ marginBottom: "var(--section-gap)" }}>
        <button
          className="link-btn"
          style={{ marginBottom: 12, marginLeft: -6 }}
          onClick={() => navigate("/pacientes")}
        >
          <Icon name="arrowLeft" size={15} /> Pacientes
        </button>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <PatientAvatar name={patient?.name ?? "—"} size={56} />
          <div className="grow" style={{ minWidth: 200, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 className="h1" style={{ fontSize: "1.4rem" }}>
                {patient?.name ?? (patientQ.isLoading ? "Carregando…" : "Paciente")}
              </h1>
              <StatusPill status={status} />
              <RiskPill risco={clinical.risco} />
            </div>
            <div className="muted" style={{ marginTop: 5, fontSize: ".92rem" }}>
              {[
                idade != null ? `${idade} anos` : null,
                sexo,
                clinical.leito,
                diagnostico?.cid ? "CID " + diagnostico.cid : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Sem dados cadastrais"}
            </div>
            {diagnostico && (diagnostico.nosologico || diagnostico.sindromico) && (
              <div className="clin" style={{ marginTop: 8, fontSize: ".95rem" }}>
                <strong>{diagnostico.nosologico || diagnostico.sindromico}</strong>
                {diagnostico.nosologico && diagnostico.sindromico ? " — " + diagnostico.sindromico : ""}
              </div>
            )}
          </div>
          <div className="desktop-only" style={{ display: "flex", gap: 9, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {openInternacao && !hasAlta && (
              <Button
                variant="ai"
                size="sm"
                icon={<Icon name="mic" size={15} />}
                onClick={() => navigate(`/ia/${patientId}`)}
              >
                Evolução com IA
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<Icon name="plus" size={15} />}
              onClick={() => patient && setStartFor(patient)}
            >
              Novo atendimento
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="text-brand-600" />
        </div>
      ) : (
        <div className="split">
          {/* esquerda — trajetória + última evolução */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {episodes.length === 0 && looseExams.length === 0 ? (
              <div className="surface surface-pad">
                <EmptyState
                  icon={<Icon name="stethoscope" size={26} />}
                  title="Nenhum atendimento registrado"
                  description="Inicie uma internação ou registre uma consulta avulsa."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => patient && setStartFor(patient)}
                    >
                      Novo atendimento
                    </Button>
                  }
                />
              </div>
            ) : (
              episodes.map((ep) => {
                const exams = [...ep.exams].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
                const isOpen = ep.tipo === "internacao" && ep.status === "aberto";
                const epAlta = exams.some((e) => e.tipo === "alta");
                const epAltaDraft = exams.find((e) => e.tipo === "alta" && !e.lockedAt);
                const canDiscard = !exams.some((e) => e.lockedAt);
                return (
                  <Card key={ep.id}>
                    <CardHeader
                      title={ep.tipo === "internacao" ? "Trajetória do episódio" : EPISODE_LABEL[ep.tipo] ?? ep.tipo}
                      subtitle={`${formatDate(ep.openedAt)}${ep.closedAt ? " → " + formatDate(ep.closedAt) : ""}`}
                      actions={
                        <Badge color={ep.status === "aberto" ? "amber" : "green"}>
                          {ep.status === "aberto" ? "Aberto" : "Encerrado"}
                        </Badge>
                      }
                    />
                    <div style={{ padding: "16px 22px 18px" }}>
                      {exams.length ? (
                        <EpisodeTimeline exams={exams} onExamClick={(ex) => navigate(`/exame/${ex.id}`)} />
                      ) : (
                        <p className="muted" style={{ fontSize: ".9rem" }}>
                          Internação aberta sem atendimentos.
                        </p>
                      )}

                      {isOpen && (
                        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 16 }}>
                          {epAltaDraft ? (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Icon name="alta" size={15} />}
                              onClick={() => navigate(`/exame/${epAltaDraft.id}`)}
                            >
                              Continuar alta
                            </Button>
                          ) : !epAlta ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Icon name="plus" size={15} />}
                                disabled={busy}
                                onClick={() => addEvolucao.mutate(ep.id)}
                              >
                                Nova evolução
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Icon name="alta" size={15} />}
                                disabled={busy}
                                onClick={() => darAlta.mutate(ep.id)}
                              >
                                Dar alta
                              </Button>
                            </>
                          ) : null}
                          {canDiscard && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setToDiscard(ep)}
                              title="Descartar (nenhum atendimento assinado)"
                            >
                              Descartar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}

            {/* consultas avulsas */}
            {looseExams.length > 0 && (
              <Card>
                <CardHeader title="Consultas avulsas" subtitle={`${looseExams.length} atendimento(s)`} />
                <div style={{ padding: "16px 22px 18px" }}>
                  <EpisodeTimeline exams={looseExams} onExamClick={(ex) => navigate(`/exame/${ex.id}`)} />
                </div>
              </Card>
            )}

            {ultimaEvolucao && (
              <InfoCard icon="penLine" tint="tint-brand" title="Última evolução">
                <div className="faint" style={{ fontSize: ".8rem", marginBottom: 6 }}>
                  {relativeFromNow(ultimaEvolucao.quando)}
                </div>
                <p className="clin" style={{ margin: 0 }}>
                  {ultimaEvolucao.texto || "—"}
                </p>
              </InfoCard>
            )}
          </div>

          {/* direita — resumo / medicações / alergias */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <InfoCard icon="prontuario" tint="tint-brand" title="Resumo do caso">
              <dl className="dl">
                {diagnostico?.nosologico && (
                  <>
                    <dt>Diagnóstico</dt>
                    <dd>{diagnostico.nosologico}</dd>
                  </>
                )}
                {diagnostico?.cid && (
                  <>
                    <dt>CID-10</dt>
                    <dd className="tnum">{diagnostico.cid}</dd>
                  </>
                )}
                {openInternacao && (
                  <>
                    <dt>Internado em</dt>
                    <dd>{formatDate(openInternacao.openedAt)}</dd>
                    <dt>Tempo</dt>
                    <dd className="tnum">{diasInternado} dias</dd>
                  </>
                )}
                <dt>Atualizado</dt>
                <dd>{formatDate(patient?.updatedAt)}</dd>
              </dl>
            </InfoCard>

            <InfoCard icon="pill" tint="tint-teal" title="Medicações em uso">
              {meds.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {meds.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "baseline",
                        paddingBottom: i < meds.length - 1 ? 10 : 0,
                        borderBottom: i < meds.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: ".92rem" }}>
                          {m.nome}
                        </div>
                        <div className="faint" style={{ fontSize: ".8rem" }}>
                          {[m.via, m.freq].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <span className="pill pill-teal tnum">{m.dose}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: ".9rem", margin: 0 }}>
                  Nenhuma medicação registrada.
                </p>
              )}
              <div style={{ marginTop: 14 }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Icon name="pill" size={15} />}
                  className="w-full"
                  onClick={() => navigate(`/prescricao/${patientId}`)}
                >
                  Gerenciar prescrição
                </Button>
              </div>
            </InfoCard>

            <InfoCard icon="warning" tint="tint-amber" title="Alergias">
              {clinical.alergias && clinical.alergias.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {clinical.alergias.map((a, i) => (
                    <Badge key={i} color="red">
                      {a}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="muted" style={{ fontSize: ".9rem" }}>
                  Nenhuma alergia conhecida
                </span>
              )}
            </InfoCard>
          </div>
        </div>
      )}

      <StartExamModal patient={startFor} onClose={() => setStartFor(null)} />

      <ConfirmDialog
        open={!!toDiscard}
        onClose={() => setToDiscard(null)}
        onConfirm={() => toDiscard && discardEpisode.mutate(toDiscard.id)}
        title="Descartar internação"
        message={
          <>
            Descartar esta internação
            {toDiscard && toDiscard.exams.length > 0
              ? ` e seus ${toDiscard.exams.length} atendimento(s) não assinado(s)`
              : ""}
            ? Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Descartar"
        danger
        loading={discardEpisode.isPending}
      />
    </div>
  );
}
