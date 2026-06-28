import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
import LoginPage from "@/pages/LoginPage";
import UsersPage from "@/pages/UsersPage";
import PainelPage from "@/pages/PainelPage";
import PatientsPage from "@/pages/PatientsPage";
import PatientHistoryPage from "@/pages/PatientHistoryPage";
import AgendaPage from "@/pages/AgendaPage";
import EvolucaoIaPage from "@/pages/EvolucaoIaPage";
import PrescricaoPage from "@/pages/PrescricaoPage";
import ExamWizardPage from "@/pages/ExamWizardPage";
import AuditLogPage from "@/pages/AuditLogPage";
import MospPage from "@/pages/MospPage";
import PrivacyPage from "@/pages/PrivacyPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  const { ready, authRequired, user } = useAuth();
  const canUseAdminFeatures = !authRequired || !!user?.isAdmin;

  // Aguarda o bootstrap de autenticação antes de renderizar a aplicação.
  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner className="h-6 w-6 text-brand-600" />
      </div>
    );
  }

  // Gate: exige login quando o servidor tem admin configurado (authRequired).
  if (authRequired && !user) {
    return <LoginPage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<PainelPage />} />
        <Route path="/pacientes" element={<PatientsPage />} />
        <Route path="/pacientes/:patientId" element={<PatientHistoryPage />} />
        {/* Alias legado: links do wizard/documento usam .../historico. */}
        <Route path="/pacientes/:patientId/historico" element={<PatientHistoryPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/ia" element={<EvolucaoIaPage />} />
        <Route path="/ia/:patientId" element={<EvolucaoIaPage />} />
        <Route path="/prescricao/:patientId" element={<PrescricaoPage />} />
        <Route path="/exame/:examId" element={<ExamWizardPage />} />
        <Route path="/exame/:examId/:stepId" element={<ExamWizardPage />} />
        <Route path="/mosp" element={<MospPage />} />
        {canUseAdminFeatures && <Route path="/usuarios" element={<UsersPage />} />}
        {canUseAdminFeatures && <Route path="/auditoria" element={<AuditLogPage />} />}
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/config" element={<SettingsPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AppShell>
  );
}
