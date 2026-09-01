import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import LabDevices from './pages/laboratory/LabDevices';
import ProcedureDashboard from './pages/procedures/ProcedureDashboard';
import ProcedureDetail from './pages/procedures/ProcedureDetail';
import PrescriptionList from './pages/prescriptions/PrescriptionList';
import PrescriptionDetail from './pages/prescriptions/PrescriptionDetail';
import Reports from './pages/reports/Reports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCatalog from './pages/admin/AdminCatalog';
import AdminSystem from './pages/admin/AdminSystem';
import BillingDashboard from './pages/billing/BillingDashboard';
import BillingDetail from './pages/billing/BillingDetail';
import RecycleBinPage from './pages/recycle/RecycleBinPage';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <LoadingState label={t('Signing you in…')} />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AllowedRoles({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

const ROLES = {
  reception: ['administrator', 'receptionist'],
  clinicalRead: ['administrator', 'receptionist', 'doctor', 'pharmacy'],
  patients: ['administrator', 'receptionist', 'doctor', 'laboratory', 'procedure', 'pharmacy'],
  queue: ['administrator', 'receptionist', 'doctor'],
  doctor: ['administrator', 'doctor'],
  laboratory: ['administrator', 'laboratory'],
  labView: ['administrator', 'laboratory', 'doctor'],
  procedure: ['administrator', 'procedure'],
  pharmacy: ['administrator', 'pharmacy', 'doctor'],
  administrator: ['administrator'],
};

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

        <Route path="patients" element={<AllowedRoles roles={ROLES.patients}><PatientList /></AllowedRoles>} />
        <Route path="patients/new" element={<AllowedRoles roles={ROLES.reception}><PatientForm /></AllowedRoles>} />
        <Route path="patients/:id" element={<AllowedRoles roles={ROLES.patients}><PatientProfile /></AllowedRoles>} />

        <Route path="reception" element={<AllowedRoles roles={ROLES.reception}><ReceptionDashboard /></AllowedRoles>} />
        <Route path="visits" element={<AllowedRoles roles={ROLES.clinicalRead}><VisitList /></AllowedRoles>} />
        <Route path="visits/:id" element={<AllowedRoles roles={ROLES.clinicalRead}><VisitDetail /></AllowedRoles>} />
        <Route path="queue" element={<AllowedRoles roles={ROLES.queue}><QueuePage /></AllowedRoles>} />

        <Route path="opd" element={<AllowedRoles roles={ROLES.doctor}><OpdQueue /></AllowedRoles>} />
        <Route path="opd/consultation/:visitId" element={<AllowedRoles roles={ROLES.doctor}><Consultation /></AllowedRoles>} />

        <Route path="laboratory" element={<AllowedRoles roles={ROLES.laboratory}><LaboratoryDashboard /></AllowedRoles>} />
        <Route path="laboratory/requests" element={<AllowedRoles roles={ROLES.laboratory}><LabRequests /></AllowedRoles>} />
        <Route path="laboratory/requests/:id" element={<AllowedRoles roles={ROLES.labView}><LabWorklist /></AllowedRoles>} />
        <Route path="laboratory/devices" element={<AllowedRoles roles={ROLES.laboratory}><LabDevices /></AllowedRoles>} />

        <Route path="procedures" element={<AllowedRoles roles={ROLES.procedure}><ProcedureDashboard /></AllowedRoles>} />
        <Route path="procedures/:id" element={<AllowedRoles roles={ROLES.procedure}><ProcedureDetail /></AllowedRoles>} />

        <Route path="prescriptions" element={<AllowedRoles roles={ROLES.pharmacy}><PrescriptionList /></AllowedRoles>} />
        <Route path="prescriptions/:id" element={<AllowedRoles roles={ROLES.pharmacy}><PrescriptionDetail /></AllowedRoles>} />

        <Route path="reports" element={<Reports />} />

        <Route path="billing" element={<AllowedRoles roles={['administrator', 'receptionist']}><BillingDashboard /></AllowedRoles>} />
        <Route path="billing/:id" element={<AllowedRoles roles={['administrator', 'receptionist']}><BillingDetail /></AllowedRoles>} />

        <Route path="admin" element={<AllowedRoles roles={ROLES.administrator}><AdminUsers /></AllowedRoles>} />
        <Route path="admin/catalog" element={<AllowedRoles roles={ROLES.administrator}><AdminCatalog /></AllowedRoles>} />
        <Route path="admin/system" element={<AllowedRoles roles={ROLES.administrator}><AdminSystem /></AllowedRoles>} />

        <Route path="recycle-bin" element={<RecycleBinPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
