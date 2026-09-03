import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Tabs } from '../../components/ui/Tabs';
import { formatDateTime } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { SpecimenLabelPrint } from '../../components/print/SpecimenLabelPrint';
import { Modal } from '../../components/ui/Modal';

const FILTERS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Doctor Orders (Pending)' },
  { key: 'SPECIMEN_COLLECTED', label: 'Sample Collected' },
  { key: 'RESULT_RECEIVED', label: 'Result Received' },
  { key: 'TECHNICIAN_VERIFIED', label: 'Verified' },
  { key: 'RELEASED_TO_DOCTOR', label: 'Released to Doctor' },
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
    setLoading(true);
    setError(null);
    laboratoryService
      .listRequests(filter === 'all' ? '' : filter)
      .then((d) => setRequests(d.requests || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

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

      // Open print label immediately
      setPrintSample(res.data?.sample);
      setPrintRequest(res.data?.request || selectedReq);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('Failed to collect specimen.'));
    } finally {
      setCollecting(false);
    }
  };

  const q = search.trim().toLowerCase();
  const rows = q
    ? requests.filter(
        (r) =>
          r.patientName?.toLowerCase().includes(q) ||
          r.patientId?.toLowerCase().includes(q) ||
          r.requestNumber?.toLowerCase().includes(q) ||
          r.sample?.sampleNumber?.toLowerCase().includes(q) ||
          r.visitNumber?.toLowerCase().includes(q)
      )
    : requests;

  const columns = [
    {
      key: 'requestNumber',
      header: t('Request No.'),
      render: (r) => (
        <span className="font-semibold text-brand-700">{r.requestNumber}</span>
      ),
    },
    {
      key: 'sampleNumber',
      header: t('Sample / Barcode'),
      render: (r) =>
        r.sample ? (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="rounded bg-slate-900 px-2 py-0.5 font-bold text-white shadow-sm">
              {r.sample.sampleNumber}
            </span>
            <button
              title={t('Print Tube Label')}
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
            onClick={() => handleOpenCollectModal(r)}
            className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200"
          >
            <QrCode className="h-3.5 w-3.5" />
            {t('Collect Specimen')}
          </button>
        ),
    },
    {
      key: 'patientName',
      header: t('Patient'),
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800">{r.patientName}</span>
          <p className="text-[11px] text-slate-400">{r.patientId}</p>
        </div>
      ),
    },
    {
      key: 'tests',
      header: t('Ordered Tests'),
      render: (r) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {r.tests?.map((test) => (
            <span key={test.id} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
              {test.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'paymentStatus',
      header: t('Payment'),
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            r.paymentStatus === 'PAID' || r.paymentStatus === 'VERIFIED'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {r.paymentStatus || 'UNPAID'}
        </span>
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
          className="btn-secondary !px-3 !py-1.5 text-xs"
          onClick={() => navigate(`/laboratory/requests/${r.id}`)}
        >
          {t('Open')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Laboratory Workstation & Requests')}
        subtitle={t('Authorized test requests, specimen tracking barcodes, and diagnostic releases')}
        icon={FlaskConical}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/laboratory/devices')}
              className="btn-secondary flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              {t('Analyzers & Simulator')}
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input !pl-9"
                placeholder={t('Search patient, ID, sample…')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        }
      />

      <Tabs
        tabs={FILTERS.map((f) => ({
          ...f,
          label: t(f.label),
          count:
            f.key === 'all'
              ? requests.length
              : requests.filter((r) => r.status === f.key).length,
        }))}
        active={filter}
        onChange={setFilter}
      />

      <Card>
        <CardHeader
          title={t('Authorized Laboratory Requests')}
          subtitle={t('Click Open to inspect machine feeds, verify results, and release to doctor')}
          icon={FlaskConical}
        />
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle={t('No requests found')}
          emptyDescription={t('Paid laboratory requests appear here when authorized at reception.')}
        />
      </Card>

      {/* Collect Specimen Modal */}
      {isCollectModalOpen && selectedReq && (
        <Modal
          open={isCollectModalOpen}
          onClose={() => setIsCollectModalOpen(false)}
          title={t('Collect Laboratory Specimen & Assign Barcode')}
        >
          <form onSubmit={handleCollectSpecimen} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>{selectedReq.patientName}</span>
                <span>{selectedReq.requestNumber}</span>
              </div>
              <p className="mt-1 text-slate-500">
                Tests: {selectedReq.tests?.map((t) => t.name).join(', ')}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {t('Specimen / Vacutainer Tube Type')}
              </label>
              <select
                value={specimenType}
                onChange={(e) => setSpecimenType(e.target.value)}
                className="select w-full"
              >
                <option value="Whole Blood (EDTA Purple Top)">Whole Blood (EDTA Purple Top)</option>
                <option value="Serum (SST Yellow / Red Top)">Serum (SST Yellow / Red Top)</option>
                <option value="Fluoride Plasma (Grey Top)">Fluoride Plasma (Grey Top)</option>
                <option value="Sodium Citrate (Blue Top)">Sodium Citrate (Blue Top)</option>
                <option value="Clean Catch Midstream Urine">Clean Catch Midstream Urine</option>
                <option value="Stool Container">Stool Container</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {t('Collection Notes')}
              </label>
              <input
                className="input w-full"
                value={specimenNotes}
                onChange={(e) => setSpecimenNotes(e.target.value)}
                placeholder="Notes on sample integrity or volume..."
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setIsCollectModalOpen(false)}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn-primary" disabled={collecting}>
                {collecting ? t('Assigning Barcode...') : t('Confirm & Generate Barcode')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Print Specimen Label Modal */}
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
