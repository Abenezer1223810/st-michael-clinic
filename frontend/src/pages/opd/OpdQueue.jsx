import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Clock, CheckCircle2, ClipboardList, User } from 'lucide-react';
import { opdService } from '../../services/opdService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { formatTime, waitingMinutes } from '../../utils/format';

export default function OpdQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

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

  const columns = [
    {
      key: 'queueNumber',
      header: 'Queue No.',
      render: (q) => <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">#{q.queueNumber}</span>,
    },
    { key: 'patientName', header: 'Patient Name', render: (q) => <span className="font-medium text-slate-800">{q.patientName}</span> },
    { key: 'patientId', header: 'Patient ID', render: (q) => <span className="text-slate-500">{q.patientId}</span> },
    { key: 'visitNumber', header: 'Visit No.', render: (q) => <span className="text-slate-500">{q.visitNumber}</span> },
    { key: 'service', header: 'Service', render: (q) => <span>{q.service}</span> },
    {
      key: 'time',
      header: 'Waiting Time',
      render: (q) => (
        <span className="text-slate-500">
          {formatTime(q.time)} <span className="text-xs text-amber-600">({waitingMinutes(q.time)}m)</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (q) => <StatusBadge status={q.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (q) => (
        <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => navigate(`/opd/consultation/${q.visitId}`)}>
          <Stethoscope className="h-3.5 w-3.5" /> {q.status === 'in_consultation' ? 'Continue' : 'Start Consultation'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="OPD Queue"
        subtitle="Patients sent from Reception, ready to be seen"
        icon={Stethoscope}
        actions={
          <button className="btn-secondary" onClick={() => setRefreshTick((t) => t + 1)}>
            <Clock className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Clock} label="Waiting Patients" value={waiting} tone="amber" />
        <StatCard icon={Stethoscope} label="Current Patients" value={current} tone="brand" />
        <StatCard icon={CheckCircle2} label="Completed Today" value={queue.filter((q) => q.status === 'completed').length} tone="emerald" />
        <StatCard icon={ClipboardList} label="Pending Consultations" value={queue.length} tone="sky" />
      </div>

      <Card>
        <CardHeader title="Today's OPD Queue" subtitle="Tap a patient to open the consultation screen" icon={User} />
        <DataTable
          columns={columns}
          rows={queue}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Queue is empty"
          emptyDescription="No patients are waiting for consultation right now. Patients appear here when Reception adds them to the queue."
        />
      </Card>
    </div>
  );
}
