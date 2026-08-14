import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Clock, Loader, CheckCircle2, ClipboardList, ArrowRight } from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { formatDateTime } from '../../utils/format';

export default function LaboratoryDashboard() {
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
    { key: 'requestNumber', header: 'Request No.', render: (r) => <span className="font-semibold text-brand-700">{r.requestNumber}</span> },
    { key: 'patientName', header: 'Patient', render: (r) => <span className="font-medium text-slate-800">{r.patientName}</span> },
    { key: 'visitNumber', header: 'Visit', render: (r) => <span className="text-slate-500">{r.visitNumber}</span> },
    { key: 'date', header: 'Requested', render: (r) => <span className="text-slate-500">{formatDateTime(r.date)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => navigate(`/laboratory/requests/${r.id}`)}>
          Worklist <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Laboratory"
        subtitle="Overview of pending and processed test requests"
        icon={FlaskConical}
        actions={
          <button className="btn-primary" onClick={() => navigate('/laboratory/requests')}>
            <ClipboardList className="h-4 w-4" /> All Requests
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Clock} label="Pending Requests" value={pending} tone="amber" />
        <StatCard icon={Loader} label="In Progress" value={inProgress} tone="sky" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} tone="emerald" />
        <StatCard icon={FlaskConical} label="Total Requests" value={requests.length} tone="brand" />
      </div>

      <Card>
        <CardHeader title="Recent Requests" subtitle="Latest laboratory activity" icon={FlaskConical} />
        <DataTable
          columns={columns}
          rows={recent}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No laboratory requests"
          emptyDescription="Requests appear here when doctors order laboratory tests."
        />
      </Card>
    </div>
  );
}
