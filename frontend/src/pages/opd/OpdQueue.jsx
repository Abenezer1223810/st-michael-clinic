import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Clock, CheckCircle2, ClipboardList, User, ListFilter, Megaphone, FlaskConical, AlertCircle } from 'lucide-react';
import { opdService } from '../../services/opdService';
import { queueService } from '../../services/queueService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { formatTime, waitingMinutes } from '../../utils/format';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Active' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'called', label: 'Called' },
  { key: 'in_consultation', label: 'In Consultation' },
  { key: 'awaiting_results', label: 'Awaiting Lab' },
  { key: 'ready_for_review', label: 'Ready for Review' },
  { key: 'completed', label: 'Completed' },
];

export default function OpdQueue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
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

  const handleCallPatient = async (e, q) => {
    e.stopPropagation();
    try {
      await queueService.updateStatus(q.id, 'called');
      toast.success(`${t('Patient called')}: ${q.patientName}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const waiting = queue.filter((q) => q.status === 'waiting' || q.status === 'called').length;
  const current = queue.filter((q) => q.status === 'in_consultation').length;
  const readyReview = queue.filter((q) => q.status === 'ready_for_review').length;
  const awaitingLab = queue.filter((q) => q.status === 'awaiting_results').length;

  const rows = statusFilter === 'all'
    ? queue.filter((q) => q.status !== 'completed')
    : queue.filter((q) => q.status === statusFilter);

  const columns = [
    {
      key: 'queueNumber',
      header: t('Queue No.'),
      render: (q) => <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">#{q.queueNumber}</span>,
    },
    {
      key: 'patientName',
      header: t('Patient'),
      render: (q) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{q.patientName}</span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{q.patient?.gender ? `${q.patient.gender}, ` : ''}{q.patient?.age ? `${q.patient.age}y` : ''}</span>
            {q.patient?.phone && <span>· {q.patient.phone}</span>}
          </div>
        </div>
      ),
    },
    { key: 'patientId', header: t('Patient ID'), render: (q) => <span className="text-slate-500 font-mono text-xs">{q.patientId}</span> },
    { key: 'visitNumber', header: t('Visit No.'), render: (q) => <span className="text-slate-500 font-mono text-xs">{q.visitNumber}</span> },
    { key: 'service', header: t('Service'), render: (q) => <span>{t(q.service)}</span> },
    {
      key: 'priority',
      header: t('Priority'),
      render: (q) => {
        const p = q.priority || 'NORMAL';
        if (p === 'EMERGENCY') {
          return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 animate-pulse">EMERGENCY</span>;
        }
        if (p === 'URGENT') {
          return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">URGENT</span>;
        }
        return <span className="text-xs text-slate-400 font-medium">Normal</span>;
      },
    },
    {
      key: 'status',
      header: t('Status'),
      render: (q) => {
        if (q.status === 'ready_for_review') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse">
              <FlaskConical className="h-3 w-3" /> {t('Ready for Review')}
            </span>
          );
        }
        if (q.status === 'awaiting_results') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              <Clock className="h-3 w-3" /> {t('Awaiting Lab')}
            </span>
          );
        }
        return <StatusBadge status={q.status} />;
      },
    },
    {
      key: 'time',
      header: t('Waiting Time'),
      render: (q) => (
        <span className="text-slate-500 text-xs">
          {formatTime(q.time)} {q.status !== 'completed' && <span className="text-amber-600 font-medium">({waitingMinutes(q.time)}m)</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (q) => (
        <div className="flex items-center gap-1.5">
          {q.status === 'waiting' && (
            <button
              className="btn-secondary !px-2.5 !py-1 text-xs"
              onClick={(e) => handleCallPatient(e, q)}
              title={t('Call Patient')}
            >
              <Megaphone className="h-3.5 w-3.5" /> {t('Call')}
            </button>
          )}
          <button
            className={`!px-3 !py-1 text-xs ${
              q.status === 'ready_for_review'
                ? 'btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30'
                : 'btn-primary'
            }`}
            onClick={() => navigate(`/opd/consultation/${q.visitId}`)}
          >
            <Stethoscope className="h-3.5 w-3.5" />{' '}
            {q.status === 'ready_for_review'
              ? t('Review Results')
              : q.status === 'in_consultation'
              ? t('Continue')
              : q.status === 'awaiting_results'
              ? t('View')
              : t('Start Consultation')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('OPD Queue & Consultations')}
        subtitle={t('Patients registered for clinical examination and doctor consultations')}
        icon={Stethoscope}
        actions={
          <button className="btn-secondary" onClick={() => setRefreshTick((t) => t + 1)}>
            <Clock className="h-4 w-4" /> {t('Refresh')}
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Clock} label={t('Waiting Patients')} value={waiting} tone="amber" />
        <StatCard icon={Stethoscope} label={t('In Consultation')} value={current} tone="brand" />
        <StatCard icon={FlaskConical} label={t('Ready for Review')} value={readyReview} tone="emerald" />
        <StatCard icon={ClipboardList} label={t('Awaiting Lab Results')} value={awaitingLab} tone="sky" />
      </div>

      <Card>
        <CardHeader title={t("Today's Patient Queue")} subtitle={t('Select a patient to open the clinical workstation')} icon={User} />
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <ListFilter className="h-4 w-4 text-slate-400" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {t(s.label)}
              <span className="ml-1 opacity-70">
                {s.key === 'all'
                  ? queue.filter((q) => q.status !== 'completed').length
                  : queue.filter((q) => q.status === s.key).length}
              </span>
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
              ? t('No patients are waiting right now. Patients appear here when Reception registers them.')
              : t('Try selecting another queue status filter.')
          }
        />
      </Card>
    </div>
  );
}
