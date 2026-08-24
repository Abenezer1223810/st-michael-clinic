import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, Eye, History, CalendarPlus, FilterX } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { computeAge, formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'active', label: 'Active' },
  { key: 'in_consultation', label: 'In Consultation' },
  { key: 'completed', label: 'Completed' },
];

const DATE_RANGES = [
  { key: '', label: 'All dates' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 days' },
  { key: 'month', label: 'Last 30 days' },
  { key: 'quarter', label: 'Last 90 days' },
  { key: 'year', label: 'This year' },
];

const rangeCutoff = (key) => {
  const now = new Date();
  if (key === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  if (key === 'week') return new Date(now.getTime() - 7 * 86400000);
  if (key === 'month') return new Date(now.getTime() - 30 * 86400000);
  if (key === 'quarter') return new Date(now.getTime() - 90 * 86400000);
  if (key === 'year') return new Date(now.getFullYear(), 0, 1);
  return null;
};

export default function PatientList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ date: '', department: '', doctor: '', status: '' });

  const canRegister = user && ['administrator', 'receptionist'].includes(user.role);

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

  const departmentOptions = useMemo(
    () => [...new Set(patients.flatMap((p) => p.services || []))].sort(),
    [patients]
  );
  const doctorOptions = useMemo(
    () => [...new Set(patients.flatMap((p) => p.doctors || []))].sort(),
    [patients]
  );

  const filtered = useMemo(() => {
    const { date, department, doctor, status } = filters;
    const active = date || department || doctor || status;
    if (!active) return patients;
    return patients.filter((p) => {
      if (date) {
        const cutoff = rangeCutoff(date);
        const reg = p.registrationDate ? new Date(p.registrationDate) : null;
        if (!reg || isNaN(reg) || reg < cutoff) return false;
      }
      if (department && !(p.services || []).includes(department)) return false;
      if (doctor && !(p.doctors || []).includes(doctor)) return false;
      if (status && p.lastStatus !== status) return false;
      return true;
    });
  }, [patients, filters]);

  const activeFilterCount = (Object.values(filters).filter(Boolean)).length;

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const clearFilters = () => setFilters({ date: '', department: '', doctor: '', status: '' });

  const selectCls =
    'rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

  const columns = [
    { key: 'id', header: t('Patient ID'), render: (p) => <span className="font-semibold text-brand-700">{p.id}</span> },
    { key: 'fullName', header: t('Full Name'), render: (p) => <span className="font-medium text-slate-800 dark:text-slate-100">{p.fullName}</span> },
    { key: 'gender', header: t('Gender'), render: (p) => <StatusBadge status={p.gender} /> },
    {
      key: 'age',
      header: t('Age'),
      render: (p) => {
        const age = p.age ?? computeAge(p.dateOfBirth);
        return age !== null && age !== undefined ? `${age} ${t('yrs')}` : '—';
      },
    },
    { key: 'phone', header: t('Phone'), render: (p) => <span className="tabular-nums">{p.phone}</span> },
    {
      key: 'department',
      header: t('Department'),
      render: (p) => (
        <span className="text-xs">
          {p.lastService ? (
            <span className="rounded bg-brand-50 px-2 py-0.5 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">{t(p.lastService)}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (p) => (p.lastStatus ? <StatusBadge status={p.lastStatus} /> : <span className="text-slate-400">—</span>),
    },
    { key: 'registrationDate', header: t('Registered'), render: (p) => formatDate(p.registrationDate) },
    {
      key: 'actions',
      header: t('Actions'),
      render: (p) => (
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${p.id}`);
            }}
            title={t('View patient')}
            aria-label={t('View patient {{name}}', { name: p.fullName })}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${p.id}?tab=history`);
            }}
            title={t('View history')}
            aria-label={t('View visit history for {{name}}', { name: p.fullName })}
          >
            <History className="h-4 w-4" />
          </button>
          {canRegister && (
            <button
              className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/visits?patient=${p.id}`);
              }}
              title={t('Create visit')}
              aria-label={t('Create a visit for {{name}}', { name: p.fullName })}
            >
              <CalendarPlus className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Patient Search')}
        subtitle={t('Search by patient ID, name or phone number')}
        icon={Users}
        actions={
          canRegister ? (
            <button className="btn-primary" onClick={() => navigate('/patients/new')}>
              <UserPlus className="h-4 w-4" />
              {t('New Patient')}
            </button>
          ) : null
        }
      />

      <Card>
        <div className="space-y-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder={t('Search by name, patient ID or phone…')}
              className="max-w-md"
            />
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <FilterX className="h-3.5 w-3.5" />
                {t('Clear filters ({{count}})', { count: activeFilterCount })}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('Registration Date')}</span>
              <select className={`${selectCls} w-full`} value={filters.date} onChange={setFilter('date')}>
                {DATE_RANGES.map((r) => (
                  <option key={r.key} value={r.key}>{t(r.label)}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('Department')}</span>
              <select className={`${selectCls} w-full`} value={filters.department} onChange={setFilter('department')}>
                <option value="">{t('All departments')}</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>{t(d)}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('Doctor')}</span>
              <select className={`${selectCls} w-full`} value={filters.doctor} onChange={setFilter('doctor')}>
                <option value="">{t('All doctors')}</option>
                {doctorOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('Status')}</span>
              <select className={`${selectCls} w-full`} value={filters.status} onChange={setFilter('status')}>
                <option value="">{t('All statuses')}</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>{t(s.label)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between">
            {query ? (
              <p className="text-xs text-slate-400">
                {loading ? t('Searching…') : t('{{count}} result(s) for “{{query}}”', { count: filtered.length, query })}
                {activeFilterCount > 0 && t(' with {{count}} filter(s) applied', { count: activeFilterCount })}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                {activeFilterCount > 0 ? t('{{count}} patient(s) match the selected filters', { count: filtered.length }) : t('{{count}} patient(s) registered', { count: patients.length })}
              </p>
            )}
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={() => load(q)}
          emptyTitle={q || activeFilterCount ? t('No patients match your search') : t('No patients found')}
          emptyDescription={q || activeFilterCount ? t('Try different search terms or clear the filters.') : t('Register your first patient to get started.')}
          onRowClick={(p) => navigate(`/patients/${p.id}`)}
        />
      </Card>
    </div>
  );
}
