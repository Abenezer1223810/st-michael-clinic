import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CalendarPlus, CalendarDays } from 'lucide-react';
import { visitService } from '../../services/visitService';
import { patientService } from '../../services/patientService';
import { CreateVisitModal } from '../../components/CreateVisitModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime } from '../../utils/format';

export default function VisitList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const t = setTimeout(() => {
        patientService
          .list(patientQ)
          .then((d) => setPatients(d.patients))
          .catch(() => setPatients([]))
          .finally(() => setPickLoading(false));
      }, 300);
      return () => clearTimeout(t);
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

  const columns = [
    { key: 'visitNumber', header: 'Visit No.', render: (v) => <span className="font-semibold text-brand-700">{v.visitNumber}</span> },
    { key: 'patientName', header: 'Patient', render: (v) => <span className="font-medium text-slate-800">{v.patientName}</span> },
    { key: 'patient', header: 'Patient ID', render: (v) => <span className="text-slate-500">{v.patient?.id}</span> },
    { key: 'service', header: 'Service', render: (v) => <span>{v.service}</span> },
    { key: 'reason', header: 'Reason', render: (v) => <span className="max-w-[220px] truncate">{v.reason || '—'}</span> },
    { key: 'date', header: 'Date & Time', render: (v) => <span className="whitespace-nowrap">{formatDateTime(v.date)}</span> },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Visits"
        subtitle="Register patient visits and route patients to departments"
        icon={CalendarDays}
        actions={
          <button className="btn-primary" onClick={() => { setPickerOpen(true); }}>
            <CalendarPlus className="h-4 w-4" /> New Visit
          </button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={visits}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No visits yet"
          emptyDescription="Create a visit to register a patient for a service."
          onRowClick={(v) => navigate(`/visits/${v.id}`)}
        />
      </Card>

      <Modal
        open={pickerOpen}
        onClose={closeFlow}
        title={selectedPatient ? 'Create Visit' : 'Select Patient'}
        subtitle={selectedPatient ? `${selectedPatient.id} · ${selectedPatient.fullName}` : 'Search and choose the patient to create a visit for'}
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
            <SearchBar value={patientQ} onChange={setPatientQ} placeholder="Search by name, ID or phone…" autoFocus />
            <div className="mt-3 max-h-80 overflow-y-auto">
              {pickLoading ? (
                <p className="py-8 text-center text-sm text-slate-400">Searching…</p>
              ) : patients.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No patients found. You can register a new patient first.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-50/50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{p.fullName}</p>
                          <p className="text-xs text-slate-400">{p.id} · {p.gender} · {p.phone}</p>
                        </div>
                        <Link
                          to={`/patients/${p.id}`}
                          className="text-xs font-medium text-brand-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Profile
                        </Link>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Link to="/patients/new" className="text-sm font-medium text-brand-700 hover:underline">
                + Register a new patient
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
