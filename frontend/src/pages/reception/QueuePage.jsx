import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ListOrdered, UserPlus } from 'lucide-react';
import { queueService } from '../../services/queueService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { formatTime, waitingMinutes } from '../../utils/format';

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'called', label: 'Called' },
  { key: 'in_consultation', label: 'In Consultation' },
  { key: 'completed', label: 'Completed' },
];

export default function QueuePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    queueService
      .list(filter || undefined)
      .then((d) => setQueue(d.queue))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (entry, status) => {
    try {
      const { message } = await queueService.updateStatus(entry.id, status);
      toast.success(message || 'Queue status updated.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const nextStatus = (entry) => {
    if (entry.status === 'waiting') return { to: 'called', label: 'Call' };
    if (entry.status === 'called') return { to: 'in_consultation', label: 'Start' };
    if (entry.status === 'in_consultation') return { to: 'completed', label: 'Complete' };
    return null;
  };

  const columns = [
    {
      key: 'queueNumber',
      header: 'Queue No.',
      render: (q) => <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">#{q.queueNumber}</span>,
    },
    { key: 'patientName', header: 'Patient Name', render: (q) => <span className="font-medium text-slate-800">{q.patientName}</span> },
    { key: 'patientId', header: 'Patient ID', render: (q) => <span className="text-slate-500">{q.patientId}</span> },
    { key: 'visitNumber', header: 'Visit', render: (q) => <span className="text-slate-500">{q.visitNumber}</span> },
    { key: 'service', header: 'Service', render: (q) => <span>{q.service}</span> },
    {
      key: 'time',
      header: 'Time',
      render: (q) => (
        <span className="whitespace-nowrap text-slate-500">
          {formatTime(q.time)}
          {q.status !== 'completed' && <span className="ml-1 text-xs text-amber-600">({waitingMinutes(q.time)}m)</span>}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (q) => <StatusBadge status={q.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (q) => {
        const next = nextStatus(q);
        return (
          <div className="flex items-center gap-2">
            {next ? (
              <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => updateStatus(q, next.to)}>
                {next.label}
              </button>
            ) : (
              <span className="text-xs text-slate-300">—</span>
            )}
            <Link to={`/opd/consultation/${q.visitId}`} className="text-xs font-medium text-brand-700 hover:underline">
              Open
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Queue Management"
        subtitle="Today's queue for all services"
        icon={ListOrdered}
        actions={
          <button className="btn-primary" onClick={() => navigate('/patients')}>
            <UserPlus className="h-4 w-4" /> Add Patient
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === s.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={queue}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Queue is empty"
          emptyDescription="Patients added to the queue will appear here."
          onRowClick={(q) => navigate(`/patients/${q.patientId}`)}
        />
      </Card>
    </div>
  );
}
