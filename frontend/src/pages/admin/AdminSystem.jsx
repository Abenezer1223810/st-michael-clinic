import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, RotateCcw, Database, Server, ShieldCheck, User, Info } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const DEMO_ACCOUNTS = [
  { role: 'Administrator', username: 'admin', password: 'admin123', user: 'Amanuel Berhe' },
  { role: 'Receptionist', username: 'reception', password: 'reception123', user: 'Hanna Tesfaye' },
  { role: 'Doctor', username: 'doctor', password: 'doctor123', user: 'Dr. Dawit Alemu' },
  { role: 'Laboratory', username: 'lab', password: 'lab123', user: 'Meron Girma' },
  { role: 'Procedure Room', username: 'procedure', password: 'procedure123', user: 'Kebede Worku' },
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
      toast.success(message || t('Demo data has been reset.'));
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('System Administration')}
        subtitle={t('System information, demo accounts and maintenance')}
        icon={Settings}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('System Information')} subtitle={t('Current environment details')} icon={Info} />
          <dl className="divide-y divide-slate-100 px-5 py-2 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <Database className="h-4 w-4" /> {t('Data Storage')}
              </dt>
              <dd className="font-medium text-slate-700">{t('In-memory (demo)')}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <Server className="h-4 w-4" /> {t('API Endpoint')}
              </dt>
              <dd className="font-mono text-xs text-slate-700">{import.meta.env.VITE_API_URL}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="h-4 w-4" /> {t('Authentication')}
              </dt>
              <dd className="font-medium text-slate-700">{t('Signed token (demo)')}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-500">
                <User className="h-4 w-4" /> {t('Signed in as')}
              </dt>
              <dd className="font-medium text-slate-700">{user.name} ({t(user.role)})</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title={t('Demo Accounts')} subtitle={t('Credentials for each system role')} icon={User} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="th">{t('Role')}</th>
                  <th className="th">{t('Username')}</th>
                  <th className="th">{t('Password')}</th>
                  <th className="th">{t('User')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEMO_ACCOUNTS.map((a) => (
                  <tr key={a.username}>
                    <td className="td font-medium text-slate-700">{t(a.role)}</td>
                    <td className="td"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{a.username}</code></td>
                    <td className="td"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{a.password}</code></td>
                    <td className="td text-slate-500">{a.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-5 border-rose-200">
        <CardHeader title={t('Danger Zone')} subtitle={t('Reset the demo database to its initial seeded state')} icon={RotateCcw} />
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {t('This restores the original demonstration data — 13 patients, visits, consultations, and the seeded demo workflow. All changes made during the demo will be lost.')}
          </p>
          <button className="btn-danger shrink-0" onClick={() => setConfirmOpen(true)} disabled={resetting}>
            <RotateCcw className="h-4 w-4" /> {resetting ? t('Resetting…') : t('Reset Demo Data')}
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleReset}
        title={t('Reset all demo data?')}
        message={t('This will wipe all changes made during the demo and restore the original seeded data. This cannot be undone.')}
        confirmLabel={t('Reset Data')}
        danger
      />
    </div>
  );
}
