import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Search, ArrowRight } from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Tabs } from '../../components/ui/Tabs';
import { formatDateTime } from '../../utils/format';

const FILTERS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];
export default function LabRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    laboratoryService
      .listRequests(filter === 'all' ? '' : filter)
      .then((d) => setRequests(d.requests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const q = search.trim().toLowerCase();
  const rows = q
    ? requests.filter(
        (r) =>
          r.patientName?.toLowerCase().includes(q) ||
          r.patientId?.toLowerCase().includes(q) ||
          r.requestNumber?.toLowerCase().includes(q) ||
          r.visitNumber?.toLowerCase().includes(q)
      )
    : requests;

  const columns = [
    { key: 'requestNumber', header: 'Request No.', render: (r) => <span className="font-semibold text-brand-700">{r.requestNumber}</span> },
    { key: 'patientName', header: 'Patient', render: (r) => <span className="font-medium text-slate-800">{r.patientName}</span> },
    { key: 'patientId', header: 'Patient ID', render: (r) => <span className="text-slate-500">{r.patientId}</span> },
    { key: 'visitNumber', header: 'Visit No.', render: (r) => <span className="text-slate-500">{r.visitNumber}</span> },
    {
      key: 'tests',
      header: 'Tests',
      render: (r) => (
        <div className="flex max-w-64 flex-wrap gap-1">
          {r.tests.map((t) => (
            <span key={t.id} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              {t.name}
            </span>
          ))}
        </div>
      ),
    },
    { key: 'date', header: 'Requested', render: (r) => <span className="text-slate-500">{formatDateTime(r.date)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => navigate(`/laboratory/requests/${r.id}`)}>
          Open <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Laboratory Requests"
        subtitle="Track and process laboratory test requests"
        icon={FlaskConical}
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search patient, ID, request…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <Tabs
        tabs={FILTERS.map((t) => ({
          ...t,
          count:
            t.key === 'all'
              ? requests.length
              : requests.filter((r) => r.status === t.key).length,
        }))}
        active={filter}
        onChange={setFilter}
      />

      <Card>
        <CardHeader title="Requests" subtitle="Click Open to view, enter results and verify" icon={FlaskConical} />
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No requests found"
          emptyDescription="Laboratory requests appear here when a doctor orders tests during consultation."
        />
      </Card>
    </div>
  );
}
