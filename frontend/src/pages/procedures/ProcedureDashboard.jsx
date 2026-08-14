import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, ArrowRight, Search } from 'lucide-react';
import { procedureService } from '../../services/procedureService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Tabs } from '../../components/ui/Tabs';
import { formatDateTime } from '../../utils/format';

const FILTERS = [
  { key: 'all', label: 'All Procedures' },
  { key: 'requested', label: 'Requested' },
  { key: 'pending', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function ProcedureDashboard() {
  const navigate = useNavigate();
  const [procedures, setProcedures] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    procedureService
      .list(filter === 'all' ? '' : filter)
      .then((d) => setProcedures(d.procedures))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const q = search.trim().toLowerCase();
  const rows = q
    ? procedures.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(q) ||
          p.patientId?.toLowerCase().includes(q) ||
          p.procedureNumber?.toLowerCase().includes(q) ||
          p.procedureType?.toLowerCase().includes(q)
      )
    : procedures;

  const columns = [
    { key: 'procedureNumber', header: 'Procedure No.', render: (p) => <span className="font-semibold text-brand-700">{p.procedureNumber}</span> },
    { key: 'procedureType', header: 'Procedure', render: (p) => <span className="font-medium text-slate-800">{p.procedureType}</span> },
    { key: 'patientName', header: 'Patient', render: (p) => <span className="text-slate-700">{p.patientName}</span> },
    { key: 'patientId', header: 'Patient ID', render: (p) => <span className="text-slate-500">{p.patientId}</span> },
    { key: 'visitNumber', header: 'Visit', render: (p) => <span className="text-slate-500">{p.visitNumber}</span> },
    { key: 'date', header: 'Requested', render: (p) => <span className="text-slate-500">{formatDateTime(p.date)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => navigate(`/procedures/${p.id}`)}>
          Open <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Procedure Room"
        subtitle="Procedure and injection requests awaiting administration"
        icon={Syringe}
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search patient, procedure…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <Tabs
        tabs={FILTERS.map((t) => ({
          ...t,
          count: t.key === 'all' ? procedures.length : procedures.filter((p) => p.status === t.key).length,
        }))}
        active={filter}
        onChange={setFilter}
      />

      <Card>
        <CardHeader title="Procedure Requests" subtitle="Open a request to record administration" icon={Syringe} />
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No procedure requests"
          emptyDescription="Procedure requests appear here when doctors order them during consultation."
        />
      </Card>
    </div>
  );
}
