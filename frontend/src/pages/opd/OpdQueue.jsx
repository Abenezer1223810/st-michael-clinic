import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Clock, CheckCircle2, ClipboardList, User, ListFilter } from 'lucide-react';
import { opdService } from '../../services/opdService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { formatTime, waitingMinutes } from '../../utils/format';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'called', label: 'Called' },
  { key: 'in_consultation', label: 'In Consultation' },
  { key: 'completed', label: 'Completed' },
];

export default function OpdQueue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    setLoading(true);
    setError(null);
    opdService
      .queue()
      .then((d) => setQueue(d.queue))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [refreshTick]);

  const waiting = queue.filter((q) => q.status === 'waiting' || q.status === 'called').length;
  const current = queue.filter((q) => q.status === 'in_consultation').length;
  const rows = statusFilter === 'all' ? queue : queue.filter((q) => q.status === statusFilter);

  const columns = [
    {
      key: 'queueNumber',
      header: t('Queue No.'),
      render: (q) => <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">#{q.queueNumber}</span>,
    },
    { key: 'patientName', header: t('Patient Name'), render: (q) => <span className="font-medium text-slate-800">{q.patientName}</span> },
    { key: 'patientId', header: t('Patient ID'), render: (q) => <span className="text-slate-500">{q.patientId}</span> },
    { key: 'visitNumber', header: t('Visit No.'), render: (q) => <span className="text-slate-500">{q.visitNumber}</span> },
    { key: 'service', header: t('Service'), render: (q) => <span>{t(q.service)}</span> },
    {
      key: 'time',
      header: t('Waiting Time'),
      render: (q) => (
        <span className="text-slate-500">
          {formatTime(q.time)} <span className="text-xs text-amber-600">({waitingMinutes(q.time)}m)</span>
        </span>
      ),
    },
    { key: 'status', header: t('Status'), render: (q) => <StatusBadge status={q.status} /> },
    {
      key: 'actions',
      header: t('Actions'),
      render: (q) => (
        <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => navigate(`/opd/consultation/${q.visitId}`)}>
          <Stethoscope className="h-3.5 w-3.5" /> {q.status === 'in_consultation' ? t('Continue') : t('Start Consultation')}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('OPD Queue')}
        subtitle={t('Patients sent from Reception, ready to be seen')}
        icon={Stethoscope}
        actions={
          <button className="btn-secondary" onClick={() => setRefreshTick((t) => t + 1)}>
            <Clock className="h-4 w-4" /> {t('Refresh')}
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Clock} label={t('Waiting Patients')} value={waiting} tone="amber" />
        <StatCard icon={Stethoscope} label={t('Current Patients')} value={current} tone="brand" />
        <StatCard icon={CheckCircle2} label={t('Completed Today')} value={queue.filter((q) => q.status === 'completed').length} tone="emerald" />
        <StatCard icon={ClipboardList} label={t('Pending Consultations')} value={queue.length} tone="sky" />
      </div>

      <Card>
        <CardHeader title={t("Today's OPD Queue")} subtitle={t('Tap a patient to open the consultation screen')} icon={User} />
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-5 py-3">
          <ListFilter className="h-4 w-4 text-slate-400" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                statusFilter === s.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {t(s.label)}
              <span className="ml-1 opacity-70">{s.key === 'all' ? queue.length : queue.filter((q) => q.status === s.key).length}</span>
            </button>
          ))}
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle={statusFilter === 'all' ? t('Queue is empty') : t('No patients in this status')}
          emptyDescription={
            statusFilter === 'all'
              ? t('No patients are waiting for consultation right now. Patients appear here when Reception adds them to the queue.')
              : t('Try a different status filter.')
          }
        />
      </Card>
    </div>
  );
}
