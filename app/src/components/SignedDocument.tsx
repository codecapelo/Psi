// ==========================================================================
// Vista de documento assinado (somente leitura).
//
// Após a assinatura, um atendimento é imutável e só será CONSULTADO — não há
// motivo para voltar ao formato de preenchimento. Este componente consolida o
// conteúdo do `Exam.data` num documento clínico limpo, organizado e pronto para
// leitura/impressão (Imprimir → "Salvar como PDF"), conforme o tipo do
// atendimento (admissão, consulta, evolução, alta).
//
// É puramente de apresentação: lê os dados já gravados, não edita nada.
// ==========================================================================

import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Brain,
  CalendarClock,
  ClipboardList,
  DoorOpen,
  FileText,
  Fingerprint,
  Gauge,
  HeartPulse,
  Lock,
  type LucideIcon,
  Printer,
  Stethoscope,
  Target,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { EpisodeTimeline, useEpisodeTrajetoria } from "@/components/EpisodeTimeline";
import { formatDate, ENCOUNTER_TIPO_LABEL as TIPO_LABEL } from "@/lib/utils";
import type { ExamData, ExamWithPatient } from "@/lib/types";
import { DOMAINS } from "@/modules/psicopatologia/domains";
import { getScale } from "@/modules/escalas/registry";
import { SEVERITY_COLOR, type ScaleResult } from "@/modules/escalas/types";

// --------------------------------------------------------------------------
// Formas parciais das fatias que renderizamos (espelham os módulos do wizard).
// --------------------------------------------------------------------------
interface AnamneseShape {
  context?: string;
  identificacao?: string;
  qp?: string;
  hda?: string;
  hpp?: string;
  alergias?: string;
  medicacoes?: string;
  familiar?: string;
  pessoalSocial?: string;
  habitos?: string;
  substancias?: SubstanceRow[];
  drogaEscolha?: string;
  criteriosTUS?: string;
  usoSubstanciasNotas?: string;
  examesComplementares?: string;
  exameFisico?: string;
  examePsiquico?: string;
  examePsiquicoSintese?: string;
}
interface SubstanceRow {
  substancia?: string;
  inicio?: string;
  via?: string;
  quantidade?: string;
  frequencia?: string;
  ultimoUso?: string;
  padrao?: string;
}
interface FenomenologiaShape {
  cenaEncontro?: string;
  fenomenoNuclear?: string;
  temporalidadeVivida?: string;
  espacialidadeCorporeidade?: string;
  intersubjetividade?: string;
  ipseidade?: string;
  tonalidadeAfetiva?: string;
  sintese?: string;
}
type PsicoShape = Record<string, { selected?: string[]; notes?: string }>;
interface DiagnosticoShape {
  sindromico?: string;
  temporalidade?: string;
  nosologico?: string;
  triangulacao?: string;
  diferenciais?: string;
  justificativa?: string;
}
interface Atividade {
  acao?: string;
  responsavel?: string;
  prazo?: string;
}
interface PtsShape {
  resumoNecessidades?: string;
  genograma?: string;
  ecomapa?: string;
  farmacoterapia?: string;
  interacoes?: string;
  orientacoes?: string;
  tempoReavaliacao?: string;
  fatoresRisco?: string;
  fatoresProtecao?: string;
  atividades?: { preventivo?: Atividade[]; assistencial?: Atividade[]; gestao?: Atividade[] };
  acoesPactuadas?: string;
}
interface AltaShape {
  resumo?: string;
  diagnosticos?: string;
  conduta?: string;
  encaminhamentos?: string;
  prognostico?: string;
}
interface EvolucaoShape {
  s?: string;
  o?: string;
  a?: string;
  p?: string;
  eem?: Record<string, string[]>;
  prev?: { sourceTipo?: string; sourceDate?: string } | null;
}

const txt = (v?: string | null) => (v ?? "").trim();
const any = (...vals: (string | null | undefined)[]) => vals.some((v) => txt(v));
/** Garante array a partir de JSON livre (Exam.data) — evita crash em dado legado/malformado. */
const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Idade em anos completos a partir da data de nascimento (yyyy-mm-dd), no fuso local. */
function ageFrom(nascimento?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(nascimento ?? "");
  if (!m) return "";
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const now = new Date();
  let years = now.getFullYear() - y;
  const monthDiff = now.getMonth() + 1 - mo;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d)) years--;
  return years >= 0 && years < 150 ? `${years} anos` : "";
}

// --------------------------------------------------------------------------
// Primitivos de documento
// --------------------------------------------------------------------------
function DocField({ label, value }: { label: string; value?: string | null }) {
  if (!txt(value)) return null;
  return (
    <div className="break-inside-avoid">
      <dt className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {value}
      </dd>
    </div>
  );
}

function DocSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="doc-section break-inside-avoid">
      <div className="mb-4 flex items-center gap-2.5 border-b border-slate-200 pb-2.5 dark:border-slate-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Grupo de campos em grade de duas colunas (rótulo curto + valor). */
function DocGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it}
          className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40"
        >
          {it}
        </span>
      ))}
    </div>
  );
}

/**
 * Achados por domínio semiológico em linhas compactas "rótulo → valores".
 *
 * O rótulo ocupa uma coluna estreita à esquerda e os chips preenchem o espaço
 * à direita, na mesma linha. Substitui o empilhamento "rótulo sozinho acima de
 * um único chip", que deixava a lista alta e cheia de espaço vazio. Com os
 * rótulos alinhados numa coluna, o exame fica mais fácil de percorrer.
 *
 * Compartilhado pelo Exame Psicopatológico (admissão/consulta, com observações)
 * e pelo Exame do Estado Mental da evolução (sem observações).
 */
function DomainFindings({
  rows,
}: {
  rows: { id: string; label: string; items: string[]; notes?: string }[];
}) {
  return (
    <dl className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-1 break-inside-avoid py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-4"
        >
          <dt className="shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300 sm:w-44">
            {r.label}
          </dt>
          <dd className="min-w-0 flex-1">
            <Chips items={r.items} />
            {r.notes && (
              <p
                className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200 ${
                  r.items.length ? "mt-1.5" : ""
                }`}
              >
                {r.notes}
              </p>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------
export function SignedDocument({ exam }: { exam: ExamWithPatient }) {
  const tipo = exam.tipo ?? "consulta";
  // Laudos/relatórios (atestados, encaminhamentos…) são gerados sob demanda e
  // não ficam no Exam.data — seguem acessíveis após a assinatura.
  const hasLaudos = tipo === "consulta" || tipo === "admissao";
  const data = (exam.data ?? {}) as ExamData;
  const patient = exam.patient;
  const details = patient.details ?? {};
  const anamnese = (data.anamnese ?? {}) as AnamneseShape;
  const local = txt(anamnese.context) || txt(exam.context);

  const idItems: { label: string; value?: string }[] = [
    { label: "Nascimento", value: details.nascimento ? formatDate(details.nascimento) : "" },
    { label: "Idade", value: ageFrom(details.nascimento) },
    { label: "Sexo / Gênero", value: details.sexo },
    { label: "CPF", value: details.cpf },
    { label: "RG", value: details.rg },
    { label: "Nome da mãe", value: details.nomeMae },
    { label: "Estado civil", value: details.estadoCivil },
    { label: "Profissão", value: details.profissao },
    { label: "Escolaridade", value: details.escolaridade },
    { label: "Naturalidade", value: details.naturalidade },
    { label: "Nacionalidade", value: details.nacionalidade },
    { label: "Telefone", value: details.telefone },
    { label: "Endereço", value: details.endereco },
  ].filter((x) => txt(x.value));

  const handlePrint = () => {
    // Imprime sempre no tema claro (legível no papel), restaurando depois.
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    if (!wasDark) {
      window.print();
      return;
    }
    root.classList.remove("dark");
    // Restauração idempotente com várias salvaguardas: afterprint pode não
    // disparar (cancelamento, Safari/webview). Sem isso, o tema escuro ficaria
    // perdido — a manipulação direta da classe não passa pelo ThemeContext.
    let done = false;
    const restore = () => {
      if (done) return;
      done = true;
      root.classList.add("dark");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    // Fallback caso afterprint nunca seja emitido.
    window.setTimeout(restore, 1500);
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-in p-6 print:p-0">
      {/* Barra de ações — oculta na impressão */}
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link
          to={`/pacientes/${exam.patientId}/historico`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" /> Cronologia
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800/60">
            <Lock className="h-3.5 w-3.5" /> Documento assinado
          </span>
          {hasLaudos && (
            <Link
              to={`/exame/${exam.id}/laudos`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FileText className="h-4 w-4" /> Relatórios e Laudos
            </Link>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-900/15 transition-all hover:bg-brand-700 hover:shadow-md active:translate-y-px"
          >
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* A "folha" do documento */}
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 print:rounded-none print:border-0 print:shadow-none">
        {/* Cabeçalho */}
        <header className="border-b border-slate-200 bg-gradient-to-br from-brand-50/70 to-white px-8 py-6 dark:border-slate-800 dark:from-brand-900/15 dark:to-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/25">
                <Brain className="h-6 w-6" />
              </span>
              <div className="leading-tight">
                <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  SOPsi
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Registro Clínico Estruturado
                </div>
              </div>
            </div>
            <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {TIPO_LABEL[tipo] ?? tipo}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-slate-800 dark:text-brand-300 dark:ring-brand-900/40">
              <User className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {patient.name}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                {patient.externalId && (
                  <span>
                    ID: <span className="tabular-nums">{patient.externalId}</span>
                  </span>
                )}
                {local && (
                  <span className="inline-flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" /> {local}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Datas / assinatura */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Realizado em{" "}
              <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                {formatDate(exam.createdAt, true)}
              </span>
            </span>
            {exam.lockedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Assinado em{" "}
                <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                  {formatDate(exam.lockedAt, true)}
                </span>
              </span>
            )}
          </div>
        </header>

        {/* Corpo */}
        <div className="space-y-9 px-8 py-7">
          {idItems.length > 0 && (
            <DocSection icon={User} title="Identificação">
              <DocGrid>
                {idItems.map((it) => (
                  <DocField key={it.label} label={it.label} value={it.value} />
                ))}
              </DocGrid>
            </DocSection>
          )}

          {tipo === "alta" ? (
            <AltaBody exam={exam} data={data} />
          ) : tipo === "evolucao" ? (
            <EvolucaoBody data={data} />
          ) : (
            <ClinicalBody data={data} />
          )}
        </div>

        {/* Rodapé — assinatura/integridade (sempre presente em documento assinado,
            inclusive na impressão, mesmo que o hash não exista em registros antigos). */}
        {exam.lockedAt && (
          <footer className="break-inside-avoid border-t border-slate-200 bg-slate-50/60 px-8 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Fingerprint className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <div className="font-medium text-slate-600 dark:text-slate-300">
                  Documento assinado e imutável em{" "}
                  <span className="tabular-nums">{formatDate(exam.lockedAt, true)}</span>
                  {exam.hash ? " — prova de integridade (SHA-256)" : "."}
                </div>
                {exam.hash && (
                  <div className="mt-0.5 break-all font-mono text-[11px] leading-relaxed text-slate-400">
                    {exam.hash}
                  </div>
                )}
              </div>
            </div>
          </footer>
        )}
      </article>
    </div>
  );
}

// --------------------------------------------------------------------------
// Corpo: admissão / consulta (registro clínico completo)
// --------------------------------------------------------------------------
function ClinicalBody({ data }: { data: ExamData }) {
  const a = (data.anamnese ?? {}) as AnamneseShape;
  const f = (data.fenomenologia ?? {}) as FenomenologiaShape;
  const psico = (data.psicopatologia ?? {}) as PsicoShape;
  const sum = (data.sumula ?? {}) as { interpretacao?: string };
  const escalas = (data.escalas ?? {}) as Record<string, ScaleResult>;
  const d = (data.diagnostico ?? {}) as DiagnosticoShape;
  const p = (data.pts ?? {}) as PtsShape;

  const subs = asArray<SubstanceRow>(a.substancias).filter((r) =>
    any(r.substancia, r.inicio, r.via, r.quantidade, r.frequencia, r.ultimoUso, r.padrao),
  );
  const psicoDomains = DOMAINS.map((dom) => ({
    dom,
    sel: asArray<string>(psico[dom.id]?.selected).filter(Boolean),
    notes: txt(psico[dom.id]?.notes),
  })).filter((x) => x.sel.length || x.notes);
  const scaleEntries = Object.entries(escalas).filter(([, r]) => r && typeof r.score === "number");

  const sections: React.ReactNode[] = [];

  // Anamnese
  if (
    any(
      a.identificacao, a.qp, a.hda, a.hpp, a.alergias, a.medicacoes, a.familiar,
      a.pessoalSocial, a.habitos, a.examesComplementares, a.exameFisico,
      a.drogaEscolha, a.criteriosTUS, a.usoSubstanciasNotas,
    ) || subs.length
  ) {
    sections.push(
      <DocSection key="anamnese" icon={FileText} title="Anamnese">
        <DocField label="Identificação (dados sociodemográficos)" value={a.identificacao} />
        <DocField label="Queixa Principal (QP)" value={a.qp} />
        <DocField label="História da Doença Atual (HDA)" value={a.hda} />
        <DocField label="História Patológica Pregressa (HPP)" value={a.hpp} />
        <DocField label="Alergias e Reações Adversas" value={a.alergias} />
        <DocField label="Medicações de Uso Contínuo" value={a.medicacoes} />
        <DocField label="História do Contexto Familiar" value={a.familiar} />
        <DocField label="História Pessoal e Social" value={a.pessoalSocial} />
        <DocField label="Hábitos e Substâncias" value={a.habitos} />
        {subs.length > 0 && <SubstancesTable rows={subs} />}
        <DocField label="Droga de escolha" value={a.drogaEscolha} />
        <DocField label="Gravidade / critérios (DSM-5-TR / CID-11)" value={a.criteriosTUS} />
        <DocField label="Observações sobre uso de substâncias" value={a.usoSubstanciasNotas} />
        <DocField label="Exames Complementares" value={a.examesComplementares} />
        <DocField label="Exame Físico" value={a.exameFisico} />
      </DocSection>,
    );
  }

  // Exame psíquico (transcrição + síntese)
  if (any(a.examePsiquico, a.examePsiquicoSintese)) {
    sections.push(
      <DocSection key="psiquico" icon={Brain} title="Exame Psíquico">
        <DocField label="Síntese" value={a.examePsiquicoSintese} />
        <DocField label="Transcrição na íntegra" value={a.examePsiquico} />
      </DocSection>,
    );
  }

  // Fenomenologia
  if (
    any(
      f.cenaEncontro, f.fenomenoNuclear, f.temporalidadeVivida, f.espacialidadeCorporeidade,
      f.intersubjetividade, f.ipseidade, f.tonalidadeAfetiva, f.sintese,
    )
  ) {
    sections.push(
      <DocSection key="feno" icon={HeartPulse} title="Fenomenologia">
        <DocField label="1. Cena do encontro e modo de presença" value={f.cenaEncontro} />
        <DocField label="2. Fenômeno nuclear" value={f.fenomenoNuclear} />
        <DocField label="3. Temporalidade vivida" value={f.temporalidadeVivida} />
        <DocField label="4. Espacialidade e corporeidade" value={f.espacialidadeCorporeidade} />
        <DocField label="5. Intersubjetividade (ser-com-o-outro)" value={f.intersubjetividade} />
        <DocField label="6. Ipseidade / self" value={f.ipseidade} />
        <DocField label="7. Tonalidade afetiva de fundo (Stimmung)" value={f.tonalidadeAfetiva} />
        <DocField label="8. Síntese fenomenológica" value={f.sintese} />
      </DocSection>,
    );
  }

  // Exame psicopatológico (domínios)
  if (psicoDomains.length) {
    sections.push(
      <DocSection key="psico" icon={ClipboardList} title="Exame Psicopatológico">
        <DomainFindings
          rows={psicoDomains.map(({ dom, sel, notes }) => ({
            id: dom.id,
            label: dom.shortTitle || dom.title,
            items: sel,
            notes,
          }))}
        />
      </DocSection>,
    );
  }

  // Súmula
  if (txt(sum.interpretacao)) {
    sections.push(
      <DocSection key="sumula" icon={FileText} title="Súmula Geral">
        <DocField label="Interpretação técnica dos achados" value={sum.interpretacao} />
      </DocSection>,
    );
  }

  // Escalas
  if (scaleEntries.length) {
    sections.push(
      <DocSection key="escalas" icon={Gauge} title="Escalas Aplicadas">
        <div className="space-y-2.5">
          {scaleEntries.map(([id, r]) => {
            const def = getScale(id);
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {def?.acronym ?? id}
                    </span>
                    {def?.name && (
                      <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {def.name}
                      </span>
                    )}
                  </div>
                  {r.completedAt && (
                    <div className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                      Aplicada em {formatDate(r.completedAt, true)}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-slate-100">
                    {r.score}
                  </span>
                  {r.band && (
                    <Badge color={SEVERITY_COLOR[r.band.severity ?? "normal"]}>
                      {r.band.label}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DocSection>,
    );
  }

  // Diagnóstico
  if (
    any(d.sindromico, d.temporalidade, d.nosologico, d.triangulacao, d.diferenciais, d.justificativa)
  ) {
    sections.push(
      <DocSection key="diag" icon={Stethoscope} title="Diagnóstico">
        <DocField label="Síndrome(s) identificada(s)" value={d.sindromico} />
        <DocField label="Temporalidade e Curso Clínico" value={d.temporalidade} />
        <DocField label="Hipótese(s) Nosológica(s)" value={d.nosologico} />
        <DocField label="Triangulação (hipóteses com raciocínio)" value={d.triangulacao} />
        <DocField label="Diagnósticos Diferenciais" value={d.diferenciais} />
        <DocField label="Justificativa e Evidências Clínicas" value={d.justificativa} />
      </DocSection>,
    );
  }

  // PTS
  const ativ = p.atividades ?? {};
  const ativBlocks: { label: string; rows: Atividade[] }[] = [
    { label: "Preventivo", rows: asArray<Atividade>(ativ.preventivo).filter((r) => any(r.acao, r.responsavel, r.prazo)) },
    { label: "Assistencial", rows: asArray<Atividade>(ativ.assistencial).filter((r) => any(r.acao, r.responsavel, r.prazo)) },
    { label: "Gestão do cuidado", rows: asArray<Atividade>(ativ.gestao).filter((r) => any(r.acao, r.responsavel, r.prazo)) },
  ].filter((b) => b.rows.length);
  if (
    any(
      p.resumoNecessidades, p.genograma, p.ecomapa, p.farmacoterapia, p.interacoes,
      p.orientacoes, p.tempoReavaliacao, p.fatoresRisco, p.fatoresProtecao, p.acoesPactuadas,
    ) || ativBlocks.length
  ) {
    sections.push(
      <DocSection key="pts" icon={Target} title="PTS — Projeto Terapêutico Singular">
        <DocField label="Resumo das Necessidades" value={p.resumoNecessidades} />
        {(txt(p.fatoresRisco) || txt(p.fatoresProtecao)) && (
          <DocGrid>
            <DocField label="Fatores de risco" value={p.fatoresRisco} />
            <DocField label="Fatores de proteção" value={p.fatoresProtecao} />
          </DocGrid>
        )}
        <DocField label="Genograma" value={p.genograma} />
        <DocField label="Ecomapa" value={p.ecomapa} />
        <DocField label="Farmacoterapia (prescrição)" value={p.farmacoterapia} />
        <DocField label="Análise de Interações" value={p.interacoes} />
        {ativBlocks.map((b) => (
          <div key={b.label} className="break-inside-avoid">
            <h3 className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Atividades — {b.label}
            </h3>
            <ActivitiesTable rows={b.rows} />
          </div>
        ))}
        <DocField label="Ações Pactuadas" value={p.acoesPactuadas} />
        <DocField label="Orientações e Observações" value={p.orientacoes} />
        <DocField label="Tempo de Reavaliação" value={p.tempoReavaliacao} />
      </DocSection>,
    );
  }

  if (!sections.length) return <EmptyDoc />;
  return <>{sections}</>;
}

function SubstancesTable({ rows }: { rows: SubstanceRow[] }) {
  const cols: { key: keyof SubstanceRow; label: string }[] = [
    { key: "substancia", label: "Substância" },
    { key: "inicio", label: "Início" },
    { key: "via", label: "Via" },
    { key: "quantidade", label: "Quantidade" },
    { key: "frequencia", label: "Frequência" },
    { key: "ultimoUso", label: "Último uso" },
    { key: "padrao", label: "Padrão" },
  ];
  return (
    <div className="break-inside-avoid">
      <h3 className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        Uso de Substâncias
      </h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              {cols.map((c) => (
                <th key={c.key} className="px-3 py-2 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-200"
              >
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-2 align-top">
                    {txt(r[c.key]) || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivitiesTable({ rows }: { rows: Atividade[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <th className="px-3 py-2 font-semibold">Ação</th>
            <th className="px-3 py-2 font-semibold">Responsável</th>
            <th className="px-3 py-2 font-semibold">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-200"
            >
              <td className="px-3 py-2 align-top">{txt(r.acao) || "—"}</td>
              <td className="px-3 py-2 align-top">{txt(r.responsavel) || "—"}</td>
              <td className="px-3 py-2 align-top tabular-nums">{txt(r.prazo) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------------------------------------------------------
// Corpo: evolução (SOAP + EEM)
// --------------------------------------------------------------------------
function EvolucaoBody({ data }: { data: ExamData }) {
  const e = (data.evolucao ?? {}) as EvolucaoShape;
  const eem = e.eem ?? {};
  const eemDomains = DOMAINS.map((dom) => ({
    dom,
    sel: asArray<string>(eem[dom.id]).filter(Boolean),
  })).filter((x) => x.sel.length);

  const soap: { key: "s" | "o" | "a" | "p"; label: string }[] = [
    { key: "s", label: "S — Subjetivo" },
    { key: "o", label: "O — Objetivo" },
    { key: "a", label: "A — Avaliação" },
    { key: "p", label: "P — Plano" },
  ];
  const hasSoap = any(e.s, e.o, e.a, e.p);
  if (!hasSoap && !eemDomains.length) return <EmptyDoc />;

  return (
    <>
      {hasSoap && (
        <DocSection icon={Activity} title="Evolução (SOAP)">
          {soap.map((s) => (
            <DocField key={s.key} label={s.label} value={e[s.key]} />
          ))}
        </DocSection>
      )}
      {eemDomains.length > 0 && (
        <DocSection icon={ClipboardList} title="Exame do Estado Mental">
          <DomainFindings
            rows={eemDomains.map(({ dom, sel }) => ({
              id: dom.id,
              label: dom.shortTitle || dom.title,
              items: sel,
            }))}
          />
        </DocSection>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// Corpo: alta (trajetória do episódio + resumo de alta)
// --------------------------------------------------------------------------
function AltaBody({ exam, data }: { exam: ExamWithPatient; data: ExamData }) {
  const alta = (data.alta ?? {}) as AltaShape;
  const { trajetoria } = useEpisodeTrajetoria(exam.patientId, exam.episodeId);

  const hasResumo = any(
    alta.resumo, alta.diagnosticos, alta.conduta, alta.encaminhamentos, alta.prognostico,
  );

  return (
    <>
      {trajetoria.length > 0 && (
        <DocSection icon={CalendarClock} title="Trajetória do Episódio">
          <EpisodeTimeline exams={trajetoria} variant="document" />
        </DocSection>
      )}

      {hasResumo ? (
        <DocSection icon={DoorOpen} title="Resumo de Alta">
          <DocField label="Resumo da internação / acompanhamento" value={alta.resumo} />
          <DocField label="Diagnósticos de alta" value={alta.diagnosticos} />
          <DocField label="Conduta / medicação na alta" value={alta.conduta} />
          <DocField label="Encaminhamentos e seguimento" value={alta.encaminhamentos} />
          <DocField label="Prognóstico" value={alta.prognostico} />
        </DocSection>
      ) : (
        trajetoria.length === 0 && <EmptyDoc />
      )}
    </>
  );
}

function EmptyDoc() {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-500">
      Nenhum conteúdo clínico foi registrado neste atendimento.
    </p>
  );
}
