import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Syringe,
  Scissors,
  ArrowRight,
  Search,
  CheckCircle,
  Clock,
  Lock,
  User,
  Activity,
  AlertCircle,
  Check,
} from 'lucide-react';
import { procedureService } from '../../services/procedureService';
import { injectionService } from '../../services/injectionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime } from '../../utils/format';

const ANATOMICAL_SITES = [
  'Left Deltoid',
  'Right Deltoid',
  'Left Gluteal (Upper Outer Quadrant)',
  'Right Gluteal (Upper Outer Quadrant)',
  'Left Vastus Lateralis (Thigh)',
  'Right Vastus Lateralis (Thigh)',
  'IV Cannula - Left Forearm',
  'IV Cannula - Right Forearm',
  'Subcutaneous - Abdomen',
  'Other Site',
];

export default function ProcedureDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeWorkstation, setActiveWorkstation] = useState('INJECTIONS'); // INJECTIONS | PROCEDURES
  const [procedures, setProcedures] = useState([]);
  const [injections, setInjections] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Administration modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedInj, setSelectedInj] = useState(null);
  const [actualMed, setActualMed] = useState('');
  const [actualDose, setActualDose] = useState('');
  const [adminSite, setAdminSite] = useState(ANATOMICAL_SITES[0]);
  const [adminNotes, setAdminNotes] = useState('');
  const [administering, setAdministering] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [procRes, injRes] = await Promise.all([
        procedureService.list().catch(() => ({ procedures: [] })),
        injectionService.list().catch(() => ({ orders: [] })),
      ]);
      setProcedures(procRes.procedures || []);
      setInjections(injRes.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdministerModal = (inj) => {
    if (inj.paymentStatus !== 'PAID' && inj.paymentStatus !== 'VERIFIED') {
      toast.error(t('Payment must be verified at reception before administering injection.'));
      return;
    }
    setSelectedInj(inj);
    setActualMed(inj.medication);
    setActualDose(inj.prescribedDose);
    setAdminSite(ANATOMICAL_SITES[0]);
    setAdminNotes('');
    setAdminModalOpen(true);
  };

  const handleAdministerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInj) return;
    setAdministering(true);
    try {
      await injectionService.administer(selectedInj.id, {
        actualMedication: actualMed || selectedInj.medication,
        actualDose: actualDose || selectedInj.prescribedDose,
        route: selectedInj.route,
        administrationSite: adminSite,
        notes: adminNotes || 'Administered with aseptic technique.',
        status: 'COMPLETED',
      });
      toast.success(t('Injection administration recorded successfully.'));
      setAdminModalOpen(false);
      setSelectedInj(null);
      loadData();
    } catch (err) {
      toast.error(err.message || t('Administration failed.'));
    } finally {
      setAdministering(false);
    }
  };

  const q = search.trim().toLowerCase();

  // Injections columns
  const injColumns = [
    {
      key: 'orderNumber',
      header: t('Order No.'),
      render: (inj) => <span className="font-mono font-bold text-brand-700 dark:text-brand-400">{inj.orderNumber}</span>,
    },
    {
      key: 'patientName',
      header: t('Patient'),
      render: (inj) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{inj.patientName}</span>
          <span className="block text-xs font-mono text-slate-400">{inj.patientId}</span>
        </div>
      ),
    },
    {
      key: 'medication',
      header: t('Medication & Dose'),
      render: (inj) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{inj.medication}</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="rounded bg-brand-50 px-1.5 py-0.5 font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              {inj.route}
            </span>
            <span>{inj.prescribedDose}</span>
            <span>· {inj.frequency}</span>
          </div>
          {inj.instructions && <p className="mt-0.5 text-[11px] italic text-slate-500">"{inj.instructions}"</p>}
        </div>
      ),
    },
    {
      key: 'paymentStatus',
      header: t('Payment Status'),
      render: (inj) => {
        const isVerified = inj.paymentStatus === 'PAID' || inj.paymentStatus === 'VERIFIED';
        return isVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> {t('Paid & Verified')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
            <Lock className="h-3 w-3" /> {t('Awaiting Payment')}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('Administration Status'),
      render: (inj) => {
        if (inj.status === 'ADMINISTERED') {
          const adm = inj.administrations?.[0];
          return (
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/40 dark:text-teal-400">
                <Check className="h-3 w-3" /> {t('Administered')}
              </span>
              {adm && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {adm.administrationSite} · {adm.administeredBy}
                </p>
              )}
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Clock className="h-3 w-3" /> {t('Ordered / Pending')}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (inj) => {
        const isVerified = inj.paymentStatus === 'PAID' || inj.paymentStatus === 'VERIFIED';
        const isDone = inj.status === 'ADMINISTERED';
        const isNurse = user?.role === 'procedure' || user?.role === 'administrator';

        return (
          <div className="flex justify-end">
            {isNurse && !isDone && (
              <button
                className={`btn !px-3 !py-1 text-xs ${
                  isVerified
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-sm shadow-rose-600/30 hover:from-rose-700 hover:to-rose-800'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
                disabled={!isVerified}
                onClick={() => openAdministerModal(inj)}
                title={isVerified ? t('Administer Injection') : t('Payment required at reception')}
              >
                <Syringe className="h-3.5 w-3.5" /> {t('Administer')}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Procedures columns
  const procColumns = [
    { key: 'procedureNumber', header: t('Procedure No.'), render: (p) => <span className="font-semibold text-brand-700">{p.procedureNumber}</span> },
    { key: 'procedureType', header: t('Procedure'), render: (p) => <span className="font-medium text-slate-800 dark:text-slate-200">{t(p.procedureType)}</span> },
    { key: 'patientName', header: t('Patient'), render: (p) => <span className="text-slate-700 dark:text-slate-300">{p.patientName}</span> },
    { key: 'patientId', header: t('Patient ID'), render: (p) => <span className="text-slate-500">{p.patientId}</span> },
    {
      key: 'paymentStatus',
      header: t('Payment Status'),
      render: (p) => {
        const isVerified = p.paymentStatus === 'PAID' || p.paymentStatus === 'VERIFIED';
        return isVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> {t('Verified')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
            <Lock className="h-3 w-3" /> {t('Awaiting Payment')}
          </span>
        );
      },
    },
    { key: 'status', header: t('Status'), render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => navigate(`/procedures/${p.id}`)}>
          {t('Open')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  const filteredInjections = q
    ? injections.filter(
        (i) =>
          i.patientName?.toLowerCase().includes(q) ||
          i.patientId?.toLowerCase().includes(q) ||
          i.orderNumber?.toLowerCase().includes(q) ||
          i.medication?.toLowerCase().includes(q)
      )
    : injections;

  const filteredProcedures = q
    ? procedures.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(q) ||
          p.patientId?.toLowerCase().includes(q) ||
          p.procedureNumber?.toLowerCase().includes(q) ||
          p.procedureType?.toLowerCase().includes(q)
      )
    : procedures;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Injections & Procedures Room')}
        subtitle={t('Execute doctor orders for injections, wound care, and minor procedures')}
        icon={Syringe}
        actions={
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9 text-xs"
              placeholder={t('Search patient, medication, procedure…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {/* Mode Selector */}
      <div className="flex gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <button
          onClick={() => setActiveWorkstation('INJECTIONS')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
            activeWorkstation === 'INJECTIONS'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Syringe className="h-4 w-4" />
          <span>{t('Injections Administration')}</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
            {injections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveWorkstation('PROCEDURES')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
            activeWorkstation === 'PROCEDURES'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Scissors className="h-4 w-4" />
          <span>{t('Clinical Procedures & Dressing')}</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
            {procedures.length}
          </span>
        </button>
      </div>

      {activeWorkstation === 'INJECTIONS' ? (
        <Card>
          <CardHeader
            title={t('Injection Orders & Administration Worklist')}
            subtitle={t('Doctor injection prescriptions with anatomical site recording')}
            icon={Syringe}
          />
          <DataTable
            columns={injColumns}
            rows={filteredInjections}
            loading={loading}
            error={error}
            onRetry={loadData}
            emptyTitle={t('No injection orders')}
            emptyDescription={t('Injection orders appear here when doctors prescribe them during consultation.')}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={t('Procedure Room Worklist')}
            subtitle={t('Wound care, dressings, and minor surgical procedures')}
            icon={Scissors}
          />
          <DataTable
            columns={procColumns}
            rows={filteredProcedures}
            loading={loading}
            error={error}
            onRetry={loadData}
            emptyTitle={t('No procedure requests')}
            emptyDescription={t('Procedure requests appear here when doctors order them during consultation.')}
          />
        </Card>
      )}

      {/* Administer Injection Modal Dialog */}
      {adminModalOpen && selectedInj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  <Syringe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t('Administer Injection · {{number}}', { number: selectedInj.orderNumber })}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('Patient')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedInj.patientName}</span> ({selectedInj.patientId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdministerSubmit} className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">{t('Prescribed Medication')}:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedInj.medication}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('Prescribed Dose & Route')}:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedInj.prescribedDose} ({selectedInj.route})
                    </p>
                  </div>
                </div>
                {selectedInj.instructions && (
                  <p className="mt-2 border-t border-slate-200/60 pt-1.5 italic text-slate-600 dark:border-slate-700 dark:text-slate-400">
                    {t('Doctor Instructions')}: {selectedInj.instructions}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('Actual Medication Administered')}
                  </label>
                  <input
                    type="text"
                    value={actualMed}
                    onChange={(e) => setActualMed(e.target.value)}
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('Actual Dose Given')}
                  </label>
                  <input
                    type="text"
                    value={actualDose}
                    onChange={(e) => setActualDose(e.target.value)}
                    className="input mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('Anatomical Administration Site')}
                </label>
                <select
                  value={adminSite}
                  onChange={(e) => setAdminSite(e.target.value)}
                  className="input mt-1"
                  required
                >
                  {ANATOMICAL_SITES.map((site) => (
                    <option key={site} value={site}>
                      {t(site)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('Administration Notes & Patient Tolerance')}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('e.g. Standard aseptic technique. Patient tolerated without immediate adverse reaction.')}
                  rows={2}
                  className="input mt-1"
                />
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t('Payment Verified: Authorized for Administration')}</span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  {t('Recorded under nurse')} <span className="font-bold">{user?.name}</span>.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAdminModalOpen(false)}
                  disabled={administering}
                >
                  {t('Cancel')}
                </button>
                <button type="submit" className="btn-primary !bg-rose-600 hover:!bg-rose-700" disabled={administering}>
                  {administering ? t('Recording…') : t('Confirm & Record Administration')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
