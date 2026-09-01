import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Pill,
  Search,
  ArrowRight,
  CheckCircle,
  Clock,
  Lock,
  PackageCheck,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import { prescriptionService } from '../../services/prescriptionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/format';

export default function PrescriptionList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, AUTHORIZED, DISPENSED, UNPAID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dispense modal state
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [dispenseItems, setDispenseItems] = useState([]);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [dispensing, setDispensing] = useState(false);

  const fetchPrescriptions = () => {
    const patientId = params.get('patientId');
    setLoading(true);
    setError(null);
    prescriptionService
      .list(patientId)
      .then((d) => setPrescriptions(d.prescriptions || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [params]);

  const openDispenseModal = (rx) => {
    if (rx.paymentStatus !== 'PAID' && rx.paymentStatus !== 'VERIFIED') {
      toast.error(t('Payment must be verified at reception before dispensing medication.'));
      return;
    }
    setSelectedRx(rx);
    setDispenseItems(
      (rx.medicines || []).map((m) => ({
        id: m.id,
        medicine: m.medicine,
        dose: m.dose || m.dosage,
        route: m.route,
        frequency: m.frequency,
        quantity: m.quantity || 1,
        dispensedQuantity: m.quantity || 1,
      }))
    );
    setDispenseNotes('');
    setDispenseModalOpen(true);
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRx) return;
    setDispensing(true);
    try {
      await prescriptionService.dispense(selectedRx.id, {
        items: dispenseItems,
        notes: dispenseNotes || 'Dispensed from main clinic pharmacy inventory.',
      });
      toast.success(t('Medications successfully dispensed to patient.'));
      setDispenseModalOpen(false);
      setSelectedRx(null);
      fetchPrescriptions();
    } catch (err) {
      toast.error(err.message || t('Dispensing failed.'));
    } finally {
      setDispensing(false);
    }
  };

  const q = search.trim().toLowerCase();
  let filtered = prescriptions.filter((p) => {
    const matchesSearch =
      !q ||
      p.patientName?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.prescriptionNumber?.toLowerCase().includes(q) ||
      (p.medicines || []).some((m) => m.medicine?.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'AUTHORIZED') {
      return (p.paymentStatus === 'PAID' || p.paymentStatus === 'VERIFIED') && p.status !== 'DISPENSED';
    }
    if (statusFilter === 'DISPENSED') {
      return p.status === 'DISPENSED';
    }
    if (statusFilter === 'UNPAID') {
      return p.paymentStatus !== 'PAID' && p.paymentStatus !== 'VERIFIED';
    }
    return true;
  });

  const columns = [
    {
      key: 'prescriptionNumber',
      header: t('Rx Number'),
      render: (p) => (
        <span className="font-mono font-bold text-brand-700 dark:text-brand-400">{p.prescriptionNumber}</span>
      ),
    },
    {
      key: 'patientName',
      header: t('Patient'),
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.patientName}</span>
          <span className="block text-xs font-mono text-slate-400">{p.patientId}</span>
        </div>
      ),
    },
    {
      key: 'medicines',
      header: t('Prescribed Medication(s)'),
      render: (p) => (
        <div className="space-y-1 py-1">
          {(p.medicines || []).map((m, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              <span className="font-semibold">{m.medicine}</span>
              <span className="text-slate-500">({m.dose || m.dosage || ''} - {m.route || 'ORAL'})</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                x{m.quantity || 1}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'paymentStatus',
      header: t('Payment Status'),
      render: (p) => {
        const isVerified = p.paymentStatus === 'PAID' || p.paymentStatus === 'VERIFIED';
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
      header: t('Dispense Status'),
      render: (p) => {
        if (p.status === 'DISPENSED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/40 dark:text-teal-400">
              <PackageCheck className="h-3 w-3" /> {t('Dispensed')}
            </span>
          );
        }
        if (p.status === 'PARTIALLY_DISPENSED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-400">
              <Clock className="h-3 w-3" /> {t('Partially Dispensed')}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Clock className="h-3 w-3" /> {t('Pending Dispense')}
          </span>
        );
      },
    },
    {
      key: 'doctor',
      header: t('Prescriber & Date'),
      render: (p) => (
        <div className="text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">{p.doctor}</span>
          <span className="block text-slate-400">{formatDateTime(p.date || p.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => {
        const isVerified = p.paymentStatus === 'PAID' || p.paymentStatus === 'VERIFIED';
        const isPharmacy = user?.role === 'pharmacy' || user?.role === 'administrator';
        const isDispensed = p.status === 'DISPENSED';

        return (
          <div className="flex items-center justify-end gap-2">
            {isPharmacy && !isDispensed && (
              <button
                className={`btn !px-3 !py-1 text-xs ${
                  isVerified
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
                disabled={!isVerified}
                onClick={() => openDispenseModal(p)}
                title={isVerified ? t('Dispense Prescription') : t('Payment required at reception')}
              >
                <PackageCheck className="h-3.5 w-3.5" /> {t('Dispense')}
              </button>
            )}
            <button
              className="btn-secondary !px-3 !py-1 text-xs"
              onClick={() => navigate(`/prescriptions/${p.id}`)}
            >
              {t('View & Print')} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Pharmacy & Prescriptions Workstation')}
        subtitle={t('Review doctor orders, verify payment status, and dispense clinical medications')}
        icon={Pill}
        actions={
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9 text-xs"
              placeholder={t('Search patient, ID, Rx, medicine…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {[
          { key: 'ALL', label: 'All Prescriptions', count: prescriptions.length },
          {
            key: 'AUTHORIZED',
            label: 'Ready for Dispensing (Paid)',
            count: prescriptions.filter((p) => (p.paymentStatus === 'PAID' || p.paymentStatus === 'VERIFIED') && p.status !== 'DISPENSED').length,
          },
          {
            key: 'UNPAID',
            label: 'Awaiting Payment',
            count: prescriptions.filter((p) => p.paymentStatus !== 'PAID' && p.paymentStatus !== 'VERIFIED').length,
          },
          {
            key: 'DISPENSED',
            label: 'Completed / Dispensed',
            count: prescriptions.filter((p) => p.status === 'DISPENSED').length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              statusFilter === tab.key
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t(tab.label)}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title={t('Prescription Orders Queue')}
          subtitle={t('Real-time clinical dispensing worklist with billing gatekeeping')}
          icon={Pill}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          error={error}
          emptyTitle={t('No prescriptions found')}
          emptyDescription={t('Prescriptions appear here when a doctor issues medication orders during clinical consultation.')}
        />
      </Card>

      {/* Dispense Medication Modal Dialog */}
      {dispenseModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t('Dispense Medication · {{number}}', { number: selectedRx.prescriptionNumber })}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('Patient')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedRx.patientName}</span> ({selectedRx.patientId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispenseModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispenseSubmit} className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('Prescribed Items to Dispense')}
                </p>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {dispenseItems.map((item, idx) => (
                    <div key={item.id || idx} className="grid grid-cols-12 items-center gap-3 py-2.5">
                      <div className="col-span-6">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.medicine}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.dose} · {item.route} · {item.frequency}
                        </p>
                      </div>
                      <div className="col-span-3 text-center">
                        <span className="text-[11px] text-slate-400">{t('Prescribed')}:</span>
                        <span className="ml-1 text-xs font-bold text-slate-700 dark:text-slate-300">{item.quantity}</span>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-400">{t('Dispense Qty')}</label>
                        <input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={item.dispensedQuantity}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setDispenseItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, dispensedQuantity: val } : it))
                            );
                          }}
                          className="input !py-1 text-center font-bold text-teal-700"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('Pharmacist Dispensing Notes & Counseling Instructions')}
                </label>
                <textarea
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  placeholder={t('e.g. Original packaging dispensed. Patient counseled on completing full course after meals.')}
                  rows={2}
                  className="input mt-1"
                />
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t('Payment Verified: Authorized for Dispensation')}</span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  {t('Dispensing records the pharmacist identity, timestamp, and updates the patient lifetime history.')}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDispenseModalOpen(false)}
                  disabled={dispensing}
                >
                  {t('Cancel')}
                </button>
                <button type="submit" className="btn-primary !bg-teal-600 hover:!bg-teal-700" disabled={dispensing}>
                  {dispensing ? t('Dispensing…') : t('Confirm & Complete Dispensing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
