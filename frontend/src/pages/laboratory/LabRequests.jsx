import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FlaskConical,
  Search,
  ArrowRight,
  QrCode,
  Printer,
  CheckCircle2,
  Cpu,
  Clock,
  Activity,
  Send,
  User,
  Stethoscope,
  ListFilter,
  AlertTriangle,
} from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { SpecimenLabelPrint } from '../../components/print/SpecimenLabelPrint';
import { Modal } from '../../components/ui/Modal';

const FILTERS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending Orders' },
  { key: 'active', label: 'Active / In-Progress' },
  { key: 'completed', label: 'Completed & Released' },
];

export default function LabRequests() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Specimen collection modal state
  const [selectedReq, setSelectedReq] = useState(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [specimenType, setSpecimenType] = useState('Whole Blood (EDTA)');
  const [specimenNotes, setSpecimenNotes] = useState('');
  const [collecting, setCollecting] = useState(false);

  // Label print state
  const [printSample, setPrintSample] = useState(null);
  const [printRequest, setPrintRequest] = useState(null);

  const load = () => {
    setLoading(true)
    setError(null);
    laboratoryService
      .listRequests('')
      .then((d) => setRequests(d.requests || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000); // Live sync every 10s
    return () => clearInterval(timer);
  }, []);

  const handleOpenCollectModal = (req) => {
    setSelectedReq(req);
    setSpecimenType(req.tests?.[0]?.specimenType || 'Whole Blood (EDTA)');
    setSpecimenNotes('Standard vacutainer tube labeled & integrity checked.');
    setIsCollectModalOpen(true);
  };

  const handleCollectSpecimen = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setCollecting(true);
    try {
      const res = await laboratoryService.collectSample(selectedReq.id, {
        specimenType,
        notes: specimenNotes,
      });
      toast.success(res.data?.message || t('Specimen collected.'));
      setIsCollectModalOpen(false);
      setPrintSample(res.data?.sample);
      setPrintRequest(res.data?.request || selectedReq);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('Failed to collect specimen.'));
    } finally {
      setCollecting(false);
    }
  };

  // Computed metric counts
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    requests.forEach((r) => {
      const s = (r.status || '').toUpperCase();
      if (['REQUESTED', 'PENDING', 'READY_FOR_LAB', 'PAYMENT_VERIFIED'].includes(s)) {
        pendingCount++;
      } else if (['SPECIMEN_COLLECTED', 'RESULT_RECEIVED', 'IN_PROGRESS'].includes(s)) {
        activeCount++;
      } else if (['RELEASED_TO_DOCTOR', 'TECHNICIAN_VERIFIED', 'COMPLETED', 'RELEASED'].includes(s)) {
        completedCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      total: requests.length,
      pending: pendingCount,
      active: activeCount,
      completed: completedCount,
    };
  }, [requests]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let result = requests;

    if (filter === 'pending') {
      result = result.filter((r) =>
        ['REQUESTED', 'PENDING', 'READY_FOR_LAB', 'PAYMENT_VERIFIED'].includes((r.status || '').toUpperCase())
      );
    } else if (filter === 'active') {
      result = result.filter((r) =>
        ['SPECIMEN_COLLECTED', 'RESULT_RECEIVED', 'IN_PROGRESS'].includes((r.status || '').toUpperCase())
      );
    } else if (filter === 'completed') {
      result = result.filter((r) =>
        ['RELEASED_TO_DOCTOR', 'TECHNICIAN_VERIFIED', 'COMPLETED', 'RELEASED'].includes((r.status || '').toUpperCase())
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.patientName?.toLowerCase().includes(q) ||
          r.patientId?.toLowerCase().includes(q) ||
          r.requestNumber?.toLowerCase().includes(q) ||
          r.requestingDoctor?.toLowerCase().includes(q) ||
          r.sample?.sampleNumber?.toLowerCase().includes(q) ||
          r.tests?.some((t) => t.name?.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [requests, filter, search]);

  const columns = [
    {
      key: 'requestNumber',
      header: t('Order & Date'),
      render: (r) => (
        <div>
          <span className="font-bold text-brand-700 dark:text-brand-400">{r.requestNumber}</span>
          <p className="font-mono text-[11px] text-slate-400">{formatDateTime(r.date)}</p>
        </div>
      ),
    },
    {
      key: 'patientName',
      header: t('Patient Details'),
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white">{r.patientName}</span>
            {r.patient?.gender && (
              <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {r.patient.gender}
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">MRN: {r.patientId}</p>
        </div>
      ),
    },
    {
      key: 'requestingDoctor',
      header: t('Ordering Doctor'),
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Stethoscope className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {r.requestingDoctor || 'Dr. Dawit Alemu'}
          </span>
        </div>
      ),
    },
    {
      key: 'tests',
      header: t('Diagnostic Tests'),
      render: (r) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {r.tests?.map((test, idx) => (
            <span
              key={test.id || idx}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200/60 dark:ring-slate-700"
            >
              {test.code || test.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'sampleNumber',
      header: t('Specimen Barcode'),
      render: (r) =>
        r.sample ? (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="rounded bg-slate-900 px-2 py-0.5 font-bold text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs">
              {r.sample.sampleNumber}
            </span>
            <button
              type="button"
              title={t('Print Tube Barcode')}
              onClick={() => {
                setPrintSample(r.sample);
                setPrintRequest(r);
              }}
              className="text-slate-400 hover:text-brand-600"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleOpenCollectModal(r)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
          >
            <QrCode className="h-3.5 w-3.5" />
            {t('Collect')}
          </button>
        ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          className="btn-primary !px-3 !py-1.5 text-xs font-bold flex items-center gap-1 shadow-xs"
          onClick={() => navigate(`/laboratory/requests/${r.id}`)}
        >
          {t('Workstation')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('Clinical Laboratory Orders & Workstation')}
        subtitle={t('Real-time laboratory orders from OPD doctors, specimen tracking, and results release')}
        icon={FlaskConical}
      />

      {/* ── 3 Summary Stat Metric Cards: Pending, Active, Completed ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Card */}
        <div
          onClick={() => setFilter('pending')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
            filter === 'pending'
              ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 dark:border-amber-500 dark:bg-amber-950/30'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {metrics.pending}
            </span>
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('Pending Orders')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('Doctor requests awaiting specimen collection')}
          </p>
        </div>

        {/* Active / In-Progress Card */}
        <div
          onClick={() => setFilter('active')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
            filter === 'active'
              ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/30'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">
              <Activity className="h-5 w-5" />
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {metrics.active}
            </span>
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('Active Tests')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('Samples collected & running on analyzers')}
          </p>
        </div>

        {/* Completed & Released Card */}
        <div
          onClick={() => setFilter('completed')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
            filter === 'completed'
              ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {metrics.completed}
            </span>
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('Released to Doctor')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('Finalized diagnostic reports transmitted to OPD')}
          </p>
        </div>

        {/* Total Card */}
        <div
          onClick={() => setFilter('all')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
            filter === 'all'
              ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/20 dark:border-purple-500 dark:bg-purple-950/30'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              <FlaskConical className="h-5 w-5" />
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {metrics.total}
            </span>
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('Total Requests')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('All diagnostic lab test orders in system')}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="input w-full pl-10 text-xs"
                placeholder={t('Search by patient name, card number, doctor, barcode, or test name…')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-xl px-3 py-1.5 font-bold transition ${
                    filter === f.key
                      ? 'bg-slate-900 text-white shadow-sm dark:bg-brand-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t(f.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRows}
          loading={loading}
          emptyMessage={t('No laboratory orders found for the selected view.')}
        />
      </Card>

      {/* Specimen Collection Modal */}
      <Modal
        open={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title={t('Collect & Label Laboratory Specimen')}
        subtitle={t('Assign barcode tube label and confirm sample integrity.')}
        icon={QrCode}
        size="md"
      >
        <form onSubmit={handleCollectSpecimen} className="space-y-4">
          {selectedReq && (
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs dark:bg-slate-800/60 space-y-1.5">
              <p className="font-bold text-slate-800 dark:text-white">
                {selectedReq.patientName} · {selectedReq.patientId}
              </p>
              <p className="text-slate-500">
                {t('Ordered Tests')}: {selectedReq.tests?.map((t) => t.name).join(', ')}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('Specimen Type / Container')}:
            </label>
            <select
              className="input w-full text-xs font-semibold"
              value={specimenType}
              onChange={(e) => setSpecimenType(e.target.value)}
            >
              <option value="Whole Blood (EDTA Purple Top)">Whole Blood (EDTA Purple Top)</option>
              <option value="Serum (SST Gold/Yellow Top)">Serum (SST Gold/Yellow Top)</option>
              <option value="Plasma (Heparin Green Top)">Plasma (Heparin Green Top)</option>
              <option value="Sterile Urine Cup">Sterile Urine Cup</option>
              <option value="Stool Container">Stool Container</option>
              <option value="Clinical Swab / Exudate">Clinical Swab / Exudate</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('Technician Specimen Notes')}:
            </label>
            <input
              type="text"
              className="input w-full text-xs"
              value={specimenNotes}
              onChange={(e) => setSpecimenNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCollectModalOpen(false)}
            >
              {t('Cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={collecting}>
              {collecting ? t('Collecting…') : t('Confirm & Print Label')}
            </button>
          </div>
        </form>
      </Modal>

      {printSample && (
        <SpecimenLabelPrint
          sample={printSample}
          request={printRequest}
          onClose={() => setPrintSample(null)}
        />
      )}
    </div>
  );
}