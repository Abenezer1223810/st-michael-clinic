import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/ui/States';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import PatientList from './pages/reception/PatientList';
import PatientForm from './pages/reception/PatientForm';
import PatientProfile from './pages/reception/PatientProfile';
import VisitList from './pages/reception/VisitList';
import VisitDetail from './pages/reception/VisitDetail';
import QueuePage from './pages/reception/QueuePage';
import OpdQueue from './pages/opd/OpdQueue';
import Consultation from './pages/opd/Consultation';
import LaboratoryDashboard from './pages/laboratory/LaboratoryDashboard';
import LabRequests from './pages/laboratory/LabRequests';
import LabWorklist from './pages/laboratory/LabWorklist';
import ProcedureDashboard from './pages/procedures/ProcedureDashboard';
import ProcedureDetail from './pages/procedures/ProcedureDetail';
import PrescriptionList from './pages/prescriptions/PrescriptionList';
import PrescriptionDetail from './pages/prescriptions/PrescriptionDetail';
import Reports from './pages/reports/Reports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSystem from './pages/admin/AdminSystem';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <LoadingState label="Signing you in…" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="patients" element={<PatientList />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientProfile />} />

        <Route path="reception" element={<ReceptionDashboard />} />
        <Route path="visits" element={<VisitList />} />
        <Route path="visits/:id" element={<VisitDetail />} />
        <Route path="queue" element={<QueuePage />} />

        <Route path="opd" element={<OpdQueue />} />
        <Route path="opd/consultation/:visitId" element={<Consultation />} />

        <Route path="laboratory" element={<LaboratoryDashboard />} />
        <Route path="laboratory/requests" element={<LabRequests />} />
        <Route path="laboratory/requests/:id" element={<LabWorklist />} />

        <Route path="procedures" element={<ProcedureDashboard />} />
        <Route path="procedures/:id" element={<ProcedureDetail />} />

        <Route path="prescriptions" element={<PrescriptionList />} />
        <Route path="prescriptions/:id" element={<PrescriptionDetail />} />

        <Route path="reports" element={<Reports />} />

        <Route path="admin" element={<AdminUsers />} />
        <Route path="admin/system" element={<AdminSystem />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
