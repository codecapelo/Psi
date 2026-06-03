import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import PatientsPage from "@/pages/PatientsPage";
import PatientHistoryPage from "@/pages/PatientHistoryPage";
import ExamWizardPage from "@/pages/ExamWizardPage";
import AuditLogPage from "@/pages/AuditLogPage";
import MospPage from "@/pages/MospPage";
import PrivacyPage from "@/pages/PrivacyPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PatientsPage />} />
        <Route
          path="/pacientes/:patientId/historico"
          element={<PatientHistoryPage />}
        />
        <Route path="/exame/:examId" element={<ExamWizardPage />} />
        <Route path="/exame/:examId/:stepId" element={<ExamWizardPage />} />
        <Route path="/mosp" element={<MospPage />} />
        <Route path="/auditoria" element={<AuditLogPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/config" element={<SettingsPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Layout>
  );
}
