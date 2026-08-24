import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, CalendarDays, ListFilter } from 'lucide-react';
import { visitService } from '../../services/visitService';
import { patientService } from '../../services/patientService';
import { CreateVisitModal } from '../../components/CreateVisitModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import { PatientCard } from '../../components/ui/PatientCard';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime } from '../../utils/format';

export default function VisitList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [patientQ, setPatientQ] = useState('');
  const [patients, setPatients] = useState([]);
  const [pickLoading, setPickLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const presetPatientId = searchParams.get('patient');
  const autoOpen = searchParams.get('new');

  const load = () => {
    setLoading(true);
    setError(null);
    visitService
      .list()
      .then((d) => setVisits(d.visits))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Auto open the create-visit flow when navigated with ?new=1 or ?patient=
  useEffect(() => {
    if (presetPatientId || autoOpen) {
      setPickerOpen(true);
      if (presetPatientId) {
        patientService.get(presetPatientId).then(({ patient }) => setSelectedPatient(patient));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    if (!selectedPatient) {
      setPickLoading(true);
      const timer = setTimeout(() => {
        patientService
          .list(patientQ)
          .then((d) => setPatients(d.patients))
          .catch(() => setPatients([]))
          .finally(() => setPickLoading(false));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pickerOpen, patientQ, selectedPatient]);

  const closeFlow = () => {
    setPickerOpen(false);
    setSelectedPatient(null);
    setPatientQ('');
    if (searchParams.get('new') || searchParams.get('patient')) {
      searchParams.delete('new');
      searchParams.delete('patient');
      setSearchParams(searchParams, { replace: true });
    }
    load();
  };

  const services = useMemo(() => [...new Set(visits.map((v) => v.service).filter(Boolean))], [visits]);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return visits.filter((v) => {
      if (serviceFilter !== 'all' && v.service !== serviceFilter) return false;
      if (!query) return true;
      return (
        v.patientName?.toLowerCase().includes(query) ||
        v.patient?.id?.toLowerCase().includes(query) ||
        v.visitNumber?.toLowerCase().includes(query) ||
        v.reason?.toLowerCase().includes(query)
      );
    });
  }, [visits, q, serviceFilter]);

  const columns = [
    { key: 'visitNumber', header: t('Visit No.'), render: (v) => <span className="font-semibold text-brand-700">{v.visitNumber}</span> },
    { key: 'patientName', header: t('Patient'), render: (v) => <span className="font-medium text-slate-800">{v.patientName}</span> },
    { key: 'patient', header: t('Patient ID'), render: (v) => <span className="text-slate-500">{v.patient?.id}</span> },
    { key: 'service', header: t('Service'), render: (v) => <span>{t(v.service)}</span> },
    { key: 'reason', header: t('Reason'), render: (v) => <span className="max-w-[220px] truncate">{v.reason || '—'}</span> },
    { key: 'date', header: t('Date & Time'), render: (v) => <span className="whitespace-nowrap">{formatDateTime(v.date)}</span> },
    { key: 'status', header: t('Status'), render: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={t('Visits')}
        subtitle={t('Register patient visits and route patients to departments')}
        icon={CalendarDays}
        actions={
          <button className="btn-primary" onClick={() => { setPickerOpen(true); }}>
            <CalendarPlus className="h-4 w-4" /> {t('New Visit')}
          </button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder={t('Search patient, ID, visit no. or reason…')}
            className="w-full lg:max-w-md"
          />
          {services.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <ListFilter className="h-4 w-4 text-slate-400" />
              {[{ key: 'all', label: t('All Services') }, ...services.map((s) => ({ key: s, label: t(s) }))].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setServiceFilter(s.key)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    serviceFilter === s.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle={q || serviceFilter !== 'all' ? t('No visits match your filters') : t('No visits yet')}
          emptyDescription={q || serviceFilter !== 'all' ? t('Try a different search term or filter.') : t('Create a visit to register a patient for a service.')}
          onRowClick={(v) => navigate(`/visits/${v.id}`)}
        />
      </Card>

      <Modal
        open={pickerOpen}
        onClose={closeFlow}
        title={selectedPatient ? t('Create Visit') : t('Select Patient')}
        subtitle={selectedPatient ? `${selectedPatient.id} · ${selectedPatient.fullName}` : t('Search and choose the patient to create a visit for')}
        size="lg"
      >
        {selectedPatient ? (
          <>
            <CreateVisitModal
              open={!!selectedPatient}
              onClose={() => setSelectedPatient(null)}
              patient={selectedPatient}
              onCreated={() => closeFlow()}
            />
          </>
        ) : (
          <div>
            <SearchBar value={patientQ} onChange={setPatientQ} placeholder={t('Search by name, ID or phone…')} autoFocus />
            <div className="mt-3 max-h-80 overflow-y-auto">
              {pickLoading ? (
                <p className="py-8 text-center text-sm text-slate-400">{t('Searching…')}</p>
              ) : patients.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  {t('No patients found. You can register a new patient first.')}
                </p>
              ) : (
                <div className="space-y-2 rounded-lg">
                  {patients.map((p) => (
                    <PatientCard key={p.id} patient={p} onSelect={setSelectedPatient} />
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Link to="/patients/new" className="text-sm font-medium text-brand-700 hover:underline">
                + {t('Register a new patient')}
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
