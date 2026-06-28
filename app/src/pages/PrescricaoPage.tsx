import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { Button, Card, CardHeader, Field, Input, Select, Badge, Spinner } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PatientAvatar } from "@/components/shell-ui";
import { useAi, AiDisclaimer } from "@/components/ai";
import { useToast } from "@/context/ToastContext";
import type { PrescriptionItem, PrescriptionItemStatus, PatientClinical } from "@/lib/types";

const DRUGS = [
  "Sertralina",
  "Fluoxetina",
  "Escitalopram",
  "Quetiapina",
  "Olanzapina",
  "Risperidona",
  "Lítio (carbonato)",
  "Valproato de sódio",
  "Clonazepam",
  "Diazepam",
  "Haloperidol",
  "Biperideno",
];

const STATUS: Record<PrescriptionItemStatus, { color: "green" | "brand" | "red"; label: string }> = {
  ativo: { color: "green", label: "em uso" },
  novo: { color: "brand", label: "novo" },
  suspenso: { color: "red", label: "suspenso" },
};

export default function PrescricaoPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const patientQ = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => apiClient.patients.get(patientId!),
    enabled: !!patientId,
  });
  const prescQ = useQuery({
    queryKey: ["prescription", patientId],
    queryFn: () => apiClient.prescriptions.get(patientId!),
    enabled: !!patientId,
  });

  const [meds, setMeds] = useState<PrescriptionItem[]>([]);
  const loadedRef = useRef(false);
  useEffect(() => {
    if (prescQ.data && !loadedRef.current) {
      setMeds(prescQ.data.items);
      loadedRef.current = true;
    }
  }, [prescQ.data]);

  const [showAdd, setShowAdd] = useState(false);
  const [add, setAdd] = useState<{ nome: string; dose: string; via: string; freq: string }>({
    nome: "",
    dose: "",
    via: "VO",
    freq: "",
  });
  const [ai, setAi] = useState("");
  const { complete, loading: aiLoading } = useAi();
  const [done, setDone] = useState(false);

  const setA = (k: keyof typeof add, v: string) => setAdd((x) => ({ ...x, [k]: v }));
  const toggle = (i: number) =>
    setMeds((L) =>
      L.map((m, j) => (j === i ? { ...m, status: m.status === "suspenso" ? "ativo" : "suspenso" } : m)),
    );
  const addMed = () => {
    if (!add.nome || !add.dose) return;
    setMeds((L) => [{ ...add, status: "novo" }, ...L]);
    setAdd({ nome: "", dose: "", via: "VO", freq: "" });
    setShowAdd(false);
  };

  const revisar = async () => {
    setAi("");
    const lista = meds
      .map((m) => `${m.nome} ${m.dose} ${m.via} ${m.freq} (${m.status})`)
      .join("; ");
    const txt = await complete({
      task: "generic",
      messages: [
        {
          role: "user",
          content:
            "Você é um psiquiatra revisando uma prescrição. Liste, em até 4 linhas, interações " +
            "medicamentosas relevantes e cuidados de monitorização para o esquema a seguir. " +
            "Seja conciso e técnico. Esquema: " +
            (lista || "(vazio)"),
        },
      ],
    });
    if (txt) setAi(txt);
  };

  const salvar = useMutation({
    mutationFn: () => apiClient.prescriptions.upsert(patientId!, meds, prescQ.data?.episodeId ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescription", patientId] });
      toast("Prescrição salva.", "success");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro", "error"),
  });

  const assinar = useMutation({
    mutationFn: async () => {
      const p = await apiClient.prescriptions.upsert(patientId!, meds, prescQ.data?.episodeId ?? null);
      return apiClient.prescriptions.lock(p.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescription", patientId] });
      setDone(true);
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Erro", "error"),
  });

  const patient = patientQ.data;
  const leito = (patient?.clinical as PatientClinical | undefined)?.leito;

  if (done) {
    return (
      <div className="page page-narrow screen-enter">
        <Card>
          <div style={{ padding: "44px 28px", textAlign: "center" }}>
            <div
              className="kpi-ico tint-emerald"
              style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px" }}
            >
              <Icon name="checkCircle" size={28} />
            </div>
            <h2 className="h1" style={{ fontSize: "1.3rem" }}>
              Prescrição assinada
            </h2>
            <p className="muted" style={{ maxWidth: 420, margin: "8px auto 22px" }}>
              A prescrição de {patient?.name ?? "o paciente"} foi atualizada e assinada eletronicamente.
            </p>
            <Button variant="primary" onClick={() => navigate(`/pacientes/${patientId}`)}>
              Voltar ao prontuário
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page page-narrow screen-enter has-form-foot">
      {/* header compacto */}
      <div className="surface surface-pad" style={{ marginBottom: "var(--section-gap)" }}>
        <button
          className="link-btn"
          style={{ marginBottom: 12, marginLeft: -6 }}
          onClick={() => navigate(`/pacientes/${patientId}`)}
        >
          <Icon name="arrowLeft" size={15} />
          Prontuário
        </button>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <PatientAvatar name={patient?.name ?? "—"} size={48} />
          <div>
            <div className="h2">{patient?.name ?? (patientQ.isLoading ? "Carregando…" : "Paciente")}</div>
            <div className="faint" style={{ fontSize: ".86rem", marginTop: 2 }}>
              Prescrição médica{leito ? " · " + leito : ""}
            </div>
          </div>
        </div>
      </div>

      {/* revisão de interações por IA */}
      <div className="ai-surface" style={{ marginBottom: "var(--section-gap)" }}>
        <div className="ai-head">
          <span className="ai-spark">
            <Icon name="sparkles" size={16} />
          </span>
          <div className="grow">
            <div className="ai-title">Revisão de interações</div>
            <div className="ai-sub">Checagem assistida do esquema atual</div>
          </div>
          <Button
            variant={ai ? "outline" : "ai"}
            size="sm"
            loading={aiLoading}
            icon={!aiLoading ? <Icon name="shield" size={14} /> : undefined}
            onClick={revisar}
          >
            {ai ? "Revisar de novo" : "Revisar com IA"}
          </Button>
        </div>
        {(ai || aiLoading) && (
          <div style={{ padding: "16px 22px" }}>
            <p className="clin" style={{ margin: 0, fontSize: ".92rem", whiteSpace: "pre-wrap" }}>
              {ai}
            </p>
            {ai && !aiLoading && <AiDisclaimer />}
          </div>
        )}
      </div>

      <Card>
        <CardHeader
          title="Prescrição ativa"
          subtitle={`${meds.filter((m) => m.status !== "suspenso").length} medicações em uso`}
          actions={
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="plus" size={14} />}
              onClick={() => setShowAdd((s) => !s)}
            >
              Adicionar
            </Button>
          }
        />
        {showAdd && (
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface-sunk)" }}>
            <div className="grid grid-cols-2 gap-x-4" style={{ marginBottom: 12 }}>
              <Field label="Medicamento">
                <Select className="select-chevron" value={add.nome} onChange={(e) => setA("nome", e.target.value)}>
                  <option value="">Selecionar…</option>
                  {DRUGS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dose">
                <Input value={add.dose} onChange={(e) => setA("dose", e.target.value)} placeholder="Ex.: 50 mg" />
              </Field>
              <Field label="Via">
                <Select className="select-chevron" value={add.via} onChange={(e) => setA("via", e.target.value)}>
                  {["VO", "IM", "EV", "SC"].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Frequência">
                <Input value={add.freq} onChange={(e) => setA("freq", e.target.value)} placeholder="Ex.: 1x/dia (manhã)" />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" disabled={!add.nome || !add.dose} onClick={addMed}>
                Adicionar à prescrição
              </Button>
            </div>
          </div>
        )}
        <div style={{ padding: "6px 22px 14px" }}>
          {prescQ.isLoading && !loadedRef.current ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <Spinner className="text-brand-600" />
            </div>
          ) : meds.length ? (
            meds.map((m, i) => {
              const st = STATUS[m.status];
              const off = m.status === "suspenso";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: i < meds.length - 1 ? "1px solid var(--border)" : "none",
                    opacity: off ? 0.55 : 1,
                  }}
                >
                  <span className="kpi-ico tint-teal" style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: 10 }}>
                    <Icon name="pill" size={16} />
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-strong)",
                        fontSize: ".93rem",
                        textDecoration: off ? "line-through" : "none",
                      }}
                    >
                      {m.nome}
                    </div>
                    <div className="faint" style={{ fontSize: ".8rem" }}>
                      {[m.dose, m.via, m.freq].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Badge color={st.color}>{st.label}</Badge>
                  <button
                    className="link-btn"
                    style={{ color: off ? "var(--accent)" : "var(--text-muted)" }}
                    onClick={() => toggle(i)}
                  >
                    {off ? "Reativar" : "Suspender"}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="muted" style={{ padding: "16px 0", fontSize: ".9rem" }}>
              Nenhuma medicação na prescrição. Use “Adicionar”.
            </p>
          )}
        </div>
      </Card>

      <div className="form-foot">
        <Button variant="ghost" onClick={() => navigate(`/pacientes/${patientId}`)}>
          Cancelar
        </Button>
        <span style={{ flex: 1 }} />
        <Button variant="outline" loading={salvar.isPending} onClick={() => salvar.mutate()}>
          Salvar
        </Button>
        <Button
          variant="primary"
          icon={<Icon name="penLine" size={16} />}
          loading={assinar.isPending}
          onClick={() => assinar.mutate()}
        >
          Assinar prescrição
        </Button>
      </div>
    </div>
  );
}
