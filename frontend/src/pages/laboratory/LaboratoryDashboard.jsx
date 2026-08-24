import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Clock, Loader, CheckCircle2, ClipboardList, ArrowRight } from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { formatDateTime } from '../../utils/format';

export default function LaboratoryDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    laboratoryService
      .listRequests()
      .then((d) => setRequests(d.requests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const pending = requests.filter((r) => r.status === 'pending').length;
  const inProgress = requests.filter((r) => r.status === 'in_progress').length;
  const completed = requests.filter((r) => r.status === 'completed').length;
  const recent = requests.slice(0, 6);

  const columns = [
    { key: 'requestNumber', header: t('Request No.'), render: (r) => <span className="font-semibold text-brand-700">{r.requestNumber}</span> },
    { key: 'patientName', header: t('Patient'), render: (r) => <span className="font-medium text-slate-800">{r.patientName}</span> },
    { key: 'visitNumber', header: t('Visit'), render: (r) => <span className="text-slate-500">{r.visitNumber}</span> },
    { key: 'date', header: t('Requested'), render: (r) => <span className="text-slate-500">{formatDateTime(r.date)}</span> },
    { key: 'status', header: t('Status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => navigate(`/laboratory/requests/${r.id}`)}>
          {t('Worklist')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Laboratory')}
        subtitle={t('Overview of pending and processed test requests')}
        icon={FlaskConical}
        actions={
          <button className="btn-primary" onClick={() => navigate('/laboratory/requests')}>
            <ClipboardList className="h-4 w-4" /> {t('All Requests')}
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Clock} label={t('Pending Requests')} value={pending} tone="amber" />
        <StatCard icon={Loader} label={t('In Progress')} value={inProgress} tone="sky" />
        <StatCard icon={CheckCircle2} label={t('Completed')} value={completed} tone="emerald" />
        <StatCard icon={FlaskConical} label={t('Total Requests')} value={requests.length} tone="brand" />
      </div>

      <Card>
        <CardHeader title={t('Recent Requests')} subtitle={t('Latest laboratory activity')} icon={FlaskConical} />
        <DataTable
          columns={columns}
          rows={recent}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle={t('No laboratory requests')}
          emptyDescription={t('Requests appear here when doctors order laboratory tests.')}
        />
      </Card>
    </div>
  );
}
