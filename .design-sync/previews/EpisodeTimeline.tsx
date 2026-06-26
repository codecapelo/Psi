import { EpisodeTimeline, Card, CardHeader } from "sopsi";

const exams = [
  {
    id: "1",
    tipo: "admissao",
    seq: 1,
    createdAt: "2026-02-03T09:15:00Z",
    lockedAt: "2026-02-03T10:02:00Z",
    data: {
      diagnostico: {
        sindromico: "Síndrome depressiva",
        nosologico: "Episódio depressivo grave",
      },
    },
  },
  {
    id: "2",
    tipo: "evolucao",
    seq: 2,
    createdAt: "2026-02-05T11:30:00Z",
    lockedAt: "2026-02-05T11:55:00Z",
    data: {
      evolucao: {
        a: "Resposta parcial à sertralina; mantém insônia terminal.",
        p: "Ajustar dose e reavaliar em 48h.",
      },
    },
  },
  {
    id: "3",
    tipo: "evolucao",
    seq: 3,
    createdAt: "2026-02-08T08:45:00Z",
    data: {
      evolucao: {
        a: "Humor em elevação, sono restabelecido, sem ideação.",
        p: "Manter conduta; planejar alta hospitalar.",
      },
    },
  },
];

export function Document() {
  return (
    <Card className="max-w-xl">
      <CardHeader
        title="Trajetória do episódio"
        subtitle="Admissão → evoluções → alta"
      />
      <div className="px-6 py-5">
        <EpisodeTimeline exams={exams} variant="document" />
      </div>
    </Card>
  );
}

export function Rail() {
  return (
    <div className="max-w-xs rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        Episódio atual
      </p>
      <EpisodeTimeline exams={exams} variant="rail" />
    </div>
  );
}
