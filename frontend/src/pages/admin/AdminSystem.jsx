import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, RotateCcw, Database, Server, ShieldCheck, User, Info } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const SYSTEM_ROLES = [
  { role: 'Administrator', username: 'admin', description: 'Full system administration, users, security & configuration' },
  { role: 'Receptionist', username: 'reception', description: 'Patient registration, visits, queue, billing & payment verification' },
  { role: 'Doctor', username: 'doctor', description: 'OPD queue, patient history, consultation, orders & clinical assessments' },
  { role: 'Laboratory', username: 'lab', description: 'LIS worklist, sample collection, analyzer integration & verification' },
  { role: 'Procedure Room', username: 'procedure', description: 'Injection administration, minor surgery & procedure recording' },
  { role: 'Pharmacy', username: 'pharmacy', description: 'Prescription dispensing, medication verification & stock management' },
];

export default function AdminSystem() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const { message } = await reportService.resetDemo();
      toast.success(message || t('Database restored to initial state.'));
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('System Administration & Configuration')}
        subtitle={t('Environment configuration, system roles, and maintenance')}
        icon={Settings}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('System Information')} subtitle={t('Runtime architecture & security parameters')} icon={Info} />
          <dl className="divide-y divide-slate-100 px-5 py-2 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <Database className="h-4 w-4" /> {t('Data Storage')}
              </dt>
              <dd className="font-semibold text-slate-800">{t('PostgreSQL Relational Database Engine')}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <Server className="h-4 w-4" /> {t('API Endpoint')}
              </dt>
              <dd className="font-mono text-xs font-semibold text-brand-700">{import.meta.env.VITE_API_URL || '/api'}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="h-4 w-4" /> {t('Authentication')}
              </dt>
              <dd className="font-semibold text-emerald-700">{t('JWT Authentication (RBAC Enforced)')}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <User className="h-4 w-4" /> {t('Signed in as')}
              </dt>
              <dd className="font-medium text-slate-700">{user?.name} ({t(user?.role)})</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title={t('Configured System Roles')} subtitle={t('Role-based access matrix and capabilities')} icon={ShieldCheck} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="th">{t('Role')}</th>
                  <th className="th">{t('Access Scope')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SYSTEM_ROLES.map((a) => (
                  <tr key={a.role}>
                    <td className="td font-semibold text-slate-800">{t(a.role)}</td>
                    <td className="td text-xs text-slate-500">{t(a.description)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-5 border-rose-200">
        <CardHeader title={t('Database Maintenance & Reset')} subtitle={t('Restore initial clean database state')} icon={RotateCcw} />
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {t('Wipes all transactional patient encounters, lab orders, and invoices, restoring the clean baseline state. Note: This action cannot be undone.')}
          </p>
          <button className="btn-danger shrink-0" onClick={() => setConfirmOpen(true)} disabled={resetting}>
            <RotateCcw className="h-4 w-4" /> {resetting ? t('Resetting…') : t('Restore Initial State')}
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleReset}
        title={t('Reset clinic database?')}
        message={t('This will reset the clinic database to its initial clean state. All ongoing visits and orders will be cleared. Are you sure?')}
        confirmText={t('Yes, Restore State')}
        tone="danger"
        loading={resetting}
      />
    </div>
  );
}
