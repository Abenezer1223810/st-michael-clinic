import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Eye, History, CalendarPlus } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { computeAge, formatDate } from '../../utils/format';

export default function PatientList() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = (search = '') => {
    setLoading(true);
    setError(null);
    patientService
      .list(search)
      .then((d) => setPatients(d.patients))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q);
      load(q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const columns = [
    { key: 'id', header: 'Patient ID', render: (p) => <span className="font-semibold text-brand-700">{p.id}</span> },
    { key: 'fullName', header: 'Full Name', render: (p) => <span className="font-medium text-slate-800">{p.fullName}</span> },
    { key: 'gender', header: 'Gender', render: (p) => <StatusBadge status={p.gender} /> },
    {
      key: 'age',
      header: 'Age',
      render: (p) => {
        const age = p.age ?? computeAge(p.dateOfBirth);
        return age !== null && age !== undefined ? `${age} yrs` : '—';
      },
    },
    { key: 'phone', header: 'Phone', render: (p) => <span className="tabular-nums">{p.phone}</span> },
    { key: 'registrationDate', header: 'Registered', render: (p) => formatDate(p.registrationDate) },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${p.id}`);
            }}
            title="View patient"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${p.id}?tab=history`);
            }}
            title="View history"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/visits?patient=${p.id}`);
            }}
            title="Create visit"
          >
            <CalendarPlus className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Patient Search"
        subtitle="Search by patient ID, name or phone number"
        icon={Users}
        actions={
          <button className="btn-primary" onClick={() => navigate('/patients/new')}>
            <UserPlus className="h-4 w-4" />
            New Patient
          </button>
        }
      />

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by name, patient ID or phone…"
            className="max-w-md"
          />
          {query && (
            <p className="mt-2 text-xs text-slate-400">
              {loading ? 'Searching…' : `${patients.length} result(s) for “${query}”`}
            </p>
          )}
        </div>
        <DataTable
          columns={columns}
          rows={patients}
          loading={loading}
          error={error}
          onRetry={() => load(q)}
          emptyTitle="No patients found"
          emptyDescription={q ? `No patients match “${q}”. Try a different name, ID or phone number.` : 'Register your first patient to get started.'}
          onRowClick={(p) => navigate(`/patients/${p.id}`)}
        />
      </Card>
    </div>
  );
}
