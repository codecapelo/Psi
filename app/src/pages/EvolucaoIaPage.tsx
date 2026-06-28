import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { Button, Card, CardHeader, Badge, Spinner, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PatientRow } from "@/components/shell-ui";
import { useAi, AiDisclaimer } from "@/components/ai";
import { useToast } from "@/context/ToastContext";
import { usePatientsOverview } from "@/lib/queries";

type Soap = { s: string; o: string; a: string; p: string };
const SOAP_LABELS: { k: keyof Soap; titulo: string }[] = [
  { k: "s", titulo: "Subjetivo" },
  { k: "o", titulo: "Objetivo" },
  { k: "a", titulo: "Avaliação" },
  { k: "p", titulo: "Plano" },
];

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function parseSoap(text: string): Soap {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const o = JSON.parse(cleaned) as Record<string, unknown>;
    return { s: str(o.s), o: str(o.o), a: str(o.a), p: str(o.p) };
  } catch {
    return { s: "", o: "", a: cleaned, p: "" };
  }
}
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// --------------------------------------------------------------------------
// Seletor de paciente (quando a rota é /ia sem paciente). Só internados.
// --------------------------------------------------------------------------
function PatientPicker() {
  const navigate = useNavigate();
  const overview = usePatientsOverview();
  const internados = (overview.data ?? []).filter((p) => p.episodeId);
  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div className="grow">
          <div className="eyebrow">Documentação clínica</div>
          <h1 className="h1" style={{ marginTop: 5, fontSize: "1.4rem" }}>
            Evolução com IA
          </h1>
          <div className="sub">Escolha o paciente internado a evoluir com transcrição.</div>
        </div>
      </div>
      <div className="surface" style={{ padding: "8px 10px" }}>
        {internados.length ? (
          <div className="rows">
            {internados.map((p) => (
              <PatientRow key={p.id} p={p} onClick={() => navigate(`/ia/${p.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ padding: "28px 12px" }}>
            <EmptyState
              icon={<Icon name="pacientes" size={26} />}
              title={overview.isLoading ? "Carregando…" : "Nenhum paciente internado"}
              description="A evolução com IA é registrada dentro de uma internação aberta."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvolucaoIaPage() {
  const { patientId } = useParams<{ patientId: string }>();
  if (!patientId) return <PatientPicker />;
  return <Recorder patientId={patientId} />;
}

// --------------------------------------------------------------------------
function Recorder({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { complete, loading: aiLoading } = useAi();

  const patientQ = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => apiClient.patients.get(patientId),
  });
  const episodesQ = useQuery({
    queryKey: ["episodes", patientId],
    queryFn: () => apiClient.episodes.listByPatient(patientId),
  });
  const openEp = episodesQ.data?.find((ep) => ep.tipo === "internacao" && ep.status === "aberto");

  type Phase = "idle" | "recording" | "transcribing" | "transcrito" | "resumo";
  const [phase, setPhase] = useState<Phase>("idle");
  const [secs, setSecs] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [soap, setSoap] = useState<Soap | null>(null);
  const [inserting, setInserting] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Ao desmontar (sair da tela): encerra o cronômetro, o gravador e — sobretudo —
  // as faixas do microfone. Sem isto, navegar para fora durante a gravação deixa
  // o microfone capturando áudio depois que o clínico já saiu da tela.
  useEffect(
    () => () => {
      mountedRef.current = false;
      if (timer.current) clearInterval(timer.current);
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
        // Desmontado durante a gravação: apenas libera o microfone, sem transcrever
        // nem atualizar estado de um componente que já saiu de tela.
        if (!mountedRef.current) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setPhase("transcribing");
        try {
          const res = await apiClient.ai.transcribe(blob);
          setTranscript(res.text);
          setPhase("transcrito");
        } catch (err) {
          toast(err instanceof Error ? err.message : "Falha na transcrição.", "error");
          setPhase("idle");
        }
      };
      mr.start();
      mediaRef.current = mr;
      streamRef.current = stream;
      setSecs(0);
      setPhase("recording");
      timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      toast("Não foi possível acessar o microfone.", "error");
    }
  };
  const stopRec = () => mediaRef.current?.stop();

  const resumir = async () => {
    const txt = await complete({
      task: "organize",
      jsonMode: true,
      messages: [
        {
          role: "user",
          content:
            "Transcrição de uma consulta psiquiátrica de evolução. Organize o conteúdo em uma nota " +
            'SOAP e responda APENAS um objeto JSON com as chaves "s", "o", "a", "p" (valores em ' +
            "português, texto clínico conciso). Transcrição:\n\n" +
            transcript,
        },
      ],
    });
    if (txt) {
      setSoap(parseSoap(txt));
      setPhase("resumo");
    }
  };

  // Cria a evolução no episódio aberto, grava o rascunho e abre o wizard p/ assinar.
  const inserir = async () => {
    if (!openEp || !soap) return;
    setInserting(true);
    try {
      const exam = await apiClient.episodes.addExam(openEp.id, "evolucao");
      const ev = (exam.data?.evolucao ?? {}) as Record<string, unknown>;
      await apiClient.exams.patchData(exam.id, {
        evolucao: { ...ev, s: soap.s, o: soap.o, a: soap.a, p: soap.p },
      });
      navigate(`/exame/${exam.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao inserir a evolução.", "error");
      setInserting(false);
    }
  };

  const patient = patientQ.data;

  return (
    <div className="page page-narrow screen-enter">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button
          className="link-btn"
          style={{ marginLeft: -6 }}
          onClick={() => navigate(`/pacientes/${patientId}`)}
        >
          <Icon name="arrowLeft" size={15} />
          Prontuário
        </button>
        <div className="grow" />
      </div>
      <div className="page-head" style={{ marginBottom: "var(--section-gap)" }}>
        <div className="grow">
          <div className="eyebrow">
            Evolução assistida por IA{patient ? " · " + patient.name : ""}
          </div>
          <h1 className="h1" style={{ marginTop: 5, fontSize: "1.4rem" }}>
            Transcrição inteligente
          </h1>
        </div>
      </div>

      {!episodesQ.isLoading && !openEp && (
        <div className="surface surface-pad" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="kpi-ico tint-amber" style={{ width: 36, height: 36, flex: "0 0 36px", borderRadius: 10 }}>
              <Icon name="warning" size={18} />
            </span>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-strong)" }}>Sem internação aberta</div>
              <div className="faint" style={{ fontSize: ".86rem" }}>
                A evolução com IA é registrada dentro de uma internação. Abra uma no prontuário.
              </div>
            </div>
            <span style={{ flex: 1 }} />
            <Button variant="outline" size="sm" onClick={() => navigate(`/pacientes/${patientId}`)}>
              Ir ao prontuário
            </Button>
          </div>
        </div>
      )}

      {/* gravador */}
      <div className="ai-surface" style={{ marginBottom: 20 }}>
        <div className="ai-head">
          <span className="ai-spark">
            <Icon name="mic" size={16} />
          </span>
          <div className="grow">
            <div className="ai-title">Gravar consulta</div>
            <div className="ai-sub">
              {phase === "recording" ? "Ouvindo… fale naturalmente" : "O áudio é transcrito automaticamente"}
            </div>
          </div>
          {phase === "recording" && <span className="pill pill-amber tnum">{fmt(secs)}</span>}
        </div>
        <div
          className={phase === "recording" ? "recording" : ""}
          style={{ padding: 22, display: "flex", alignItems: "center", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
        >
          {phase === "recording" ? (
            <>
              <span className="rec-dot" />
              <span className="wave">
                {Array.from({ length: 22 }).map((_, i) => (
                  <i key={i} />
                ))}
              </span>
              <Button variant="danger" icon={<Icon name="check" size={16} />} onClick={stopRec}>
                Parar e transcrever
              </Button>
            </>
          ) : phase === "transcribing" ? (
            <span className="pill pill-brand">
              <Spinner className="h-3.5 w-3.5" /> Transcrevendo…
            </span>
          ) : phase === "idle" ? (
            <Button
              variant="ai"
              icon={<Icon name="mic" size={17} />}
              onClick={startRec}
              disabled={!openEp}
            >
              Iniciar gravação
            </Button>
          ) : (
            <span className="pill pill-emerald">
              <Icon name="check" size={13} /> Transcrição concluída
            </span>
          )}
        </div>
      </div>

      {/* transcrição */}
      {(phase === "transcrito" || phase === "resumo") && (
        <Card>
          <CardHeader
            title="Transcrição da consulta"
            subtitle="Revise antes de resumir"
            actions={<Badge color="slate">{transcript.length} caracteres</Badge>}
          />
          <div style={{ padding: "16px 22px 20px", maxHeight: 300, overflowY: "auto" }}>
            <p className="clin" style={{ margin: 0, fontSize: ".92rem", whiteSpace: "pre-wrap" }}>
              {transcript || "—"}
            </p>
          </div>
          {phase === "transcrito" && (
            <div
              className="form-foot"
              style={{ position: "static", margin: 0, borderRadius: "0 0 var(--r-lg) var(--r-lg)" }}
            >
              <span style={{ flex: 1 }} />
              <Button
                variant="ai"
                icon={<Icon name="sparkles" size={16} />}
                loading={aiLoading}
                onClick={resumir}
              >
                Resumir em SOAP com IA
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* SOAP */}
      {phase === "resumo" && soap && (
        <div className="ai-surface" style={{ marginTop: 20 }}>
          <div className="ai-head">
            <span className="ai-spark">
              <Icon name="sparkles" size={16} />
            </span>
            <div className="grow">
              <div className="ai-title">Rascunho de evolução (SOAP)</div>
              <div className="ai-sub">Revise, edite e assine no prontuário</div>
            </div>
          </div>
          <div style={{ padding: "18px 22px 8px" }}>
            {SOAP_LABELS.map(({ k, titulo }) => (
              <div key={k} className="screen-enter" style={{ display: "flex", gap: 13, marginBottom: 16 }}>
                <span className="step-dot done" style={{ flex: "0 0 26px", textTransform: "uppercase" }}>
                  {k}
                </span>
                <div>
                  <div style={{ fontWeight: 640, color: "var(--text-strong)", fontSize: ".88rem", marginBottom: 3 }}>
                    {titulo}
                  </div>
                  <p className="clin" style={{ margin: 0, fontSize: ".93rem", whiteSpace: "pre-wrap" }}>
                    {soap[k] || <span className="faint">—</span>}
                  </p>
                </div>
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <AiDisclaimer />
            </div>
          </div>
          <div
            className="form-foot"
            style={{ position: "static", margin: 0, borderRadius: "0 0 var(--r-lg) var(--r-lg)" }}
          >
            <Button variant="ghost" onClick={resumir} loading={aiLoading}>
              <Icon name="refresh" size={15} /> Refazer
            </Button>
            <span style={{ flex: 1 }} />
            <Button
              variant="primary"
              icon={<Icon name="penLine" size={16} />}
              loading={inserting}
              onClick={inserir}
            >
              Revisar e assinar no prontuário
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
