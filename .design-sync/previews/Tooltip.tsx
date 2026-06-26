import { Tooltip, Card, CardHeader } from "sopsi";

const termos = [
  {
    termo: "Embotamento afetivo",
    def: "Redução acentuada da expressão e da reatividade emocional, comum em quadros depressivos graves e na esquizofrenia.",
  },
  {
    termo: "Ideação suicida",
    def: "Presença de pensamentos sobre a própria morte, podendo variar de desejo passivo a plano estruturado.",
  },
  {
    termo: "Fuga de ideias",
    def: "Aceleração do pensamento com mudanças rápidas de tema, característica de episódios maníacos.",
  },
  {
    termo: "Juízo crítico",
    def: "Capacidade de reconhecer o próprio adoecimento e a necessidade de tratamento (insight).",
  },
];

export function GlossarioPsiquico() {
  return (
    <Card className="max-w-sm">
      <CardHeader
        title="Achados do exame psíquico"
        subtitle="Passe o mouse sobre cada termo para ver a definição"
      />
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {termos.map((t) => (
          <li
            key={t.termo}
            className="flex items-center gap-1.5 px-5 py-3 text-sm text-slate-700 dark:text-slate-200"
          >
            {t.termo}
            <Tooltip text={t.def} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function InlineLabel() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      Escala HAM-D
      <Tooltip text="Escala de Hamilton para Depressão: instrumento de avaliação da gravidade dos sintomas depressivos." />
    </div>
  );
}
