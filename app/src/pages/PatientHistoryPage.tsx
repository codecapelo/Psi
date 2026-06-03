import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FilePlus2, FileText, Trash2 } from "lucide-react";
import apiClient from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Badge, EmptyState, Spinner } from "@/components/ui";

export default function PatientHistoryPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const patientQ = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => apiClient.patients.get(patientId!),
    enabled: !!patientId,
  });
  const examsQ = useQuery({
    queryKey: ["exams", patientId],
    queryFn: () => apiClient.exams.listByPatient(patientId!),
    enabled: !!patientId,
  });

  const createExam = useMutation({
    mutationFn: () => apiClient.exams.create(patientId!),
    onSuccess: (exam) => navigate(`/exame/${exam.id}`),
  });
  const deleteExam = useMutation({
    mutationFn: (id: string) => apiClient.exams.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams", patientId] });
      toast("Exame removido.", "success");
    },
  });

  const exams = examsQ.data ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Pacientes
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {patientQ.data?.name ?? "Histórico"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Histórico de exames
          </p>
        </div>
        <Button
          icon={<FilePlus2 className="h-4 w-4" />}
          loading={createExam.isPending}
          onClick={() => createExam.mutate()}
        >
          Novo Exame
        </Button>
      </div>

      {examsQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Nenhum exame registrado"
          description="Inicie o primeiro exame deste paciente."
        />
      ) : (
        <div className="space-y-2">
          {exams.map((e) => (
            <Card key={e.id} className="flex items-center justify-between p-4">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => navigate(`/exame/${e.id}`)}
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  Exame de {formatDate(e.createdAt, true)}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge color={e.status === "concluido" ? "green" : "amber"}>
                    {e.status === "concluido" ? "Concluído" : "Em andamento"}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    atualizado {formatDate(e.updatedAt, true)}
                  </span>
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                title="Excluir exame"
                onClick={() => deleteExam.mutate(e.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
