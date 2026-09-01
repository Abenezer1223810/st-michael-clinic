import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Pill,
  Printer,
  CheckCircle,
  Clock,
  Lock,
  PackageCheck,
  ShieldCheck,
  User,
} from 'lucide-react';
import { prescriptionService } from '../../services/prescriptionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { PrescriptionPrint } from '../../components/print/PrescriptionPrint';
import { formatDateTime } from '../../utils/format';

export default function PrescriptionDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  // Dispense dialog
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispenseItems, setDispenseItems] = useState([]);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [dispensing, setDispensing] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    setError(null);
    prescriptionService
      .get(id)
      .then((d) => {
        setPrescription(d.prescription);
        setDispenseItems(
          (d.prescription?.medicines || []).map((m) => ({
            id: m.id,
            medicine: m.medicine,
            dose: m.dose || m.dosage,
            route: m.route,
            frequency: m.frequency,
            quantity: m.quantity || 1,
            dispensedQuantity: m.dispensedQuantity || m.quantity || 1,
          }))
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    setDispensing(true);
    try {
      await prescriptionService.dispense(prescription.id, {
        items: dispenseItems,
        notes: dispenseNotes || 'Dispensed according to doctor orders.',
      });
      toast.success(t('Medications dispensed successfully.'));
      setDispenseModalOpen(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.message || t('Dispensing failed.'));
    } finally {
      setDispensing(false);
    }
  };

  if (loading) return <SkeletonDetail lines={5} />;
  if (error) return <ErrorState message={error} />;
  if (!prescription) return null;

  const isVerified = prescription.paymentStatus === 'PAID' || prescription.paymentStatus === 'VERIFIED';
  const isDispensed = prescription.status === 'DISPENSED';
  const isPharmacy = user?.role === 'pharmacy' || user?.role === 'administrator';

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/prescriptions')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> {t('Back to prescriptions')}
      </button>

      <PageHeader
        title={t('Prescription · {{number}}', { number: prescription.prescriptionNumber })}
        subtitle={t('Issued {{date}} by {{doctor}}', {
          date: formatDateTime(prescription.date || prescription.createdAt),
          doctor: prescription.doctor,
        })}
        icon={Pill}
        actions={
          <div className="flex items-center gap-2">
            {isPharmacy && !isDispensed && isVerified && (
              <button
                className="btn-primary !bg-teal-600 hover:!bg-teal-700"
                onClick={() => setDispenseModalOpen(true)}
              >
                <PackageCheck className="h-4 w-4" /> {t('Dispense Medication')}
              </button>
            )}
            <button className="btn-secondary" onClick={() => setPrintOpen(true)}>
              <Printer className="h-4 w-4" /> {t('Print Prescription')}
            </button>
          </div>
        }
      />

      <PatientHeader patient={prescription.patient} visitNumber={prescription.visitNumber} />

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('Payment Authorization')}</p>
          <div className="mt-2 flex items-center gap-2">
            {isVerified ? (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t('Verified & Authorized')}</p>
                  <p className="text-xs text-slate-500">{t('Payment cleared at reception cashier')}</p>
                </div>
              </>
            ) : (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <Lock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('Awaiting Payment')}</p>
                  <p className="text-xs text-slate-500">{t('Payment verification required before dispensing')}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('Dispensing Lifecycle')}</p>
          <div className="mt-2 flex items-center gap-2">
            {isDispensed ? (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                  <PackageCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-teal-700 dark:text-teal-400">{t('Medication Dispensed')}</p>
                  <p className="text-xs text-slate-500">
                    {prescription.dispensedBy ? `${t('By')} ${prescription.dispensedBy} · ${formatDateTime(prescription.dispensedAt)}` : t('Dispensed')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('Pending Dispensation')}</p>
                  <p className="text-xs text-slate-500">{t('Awaiting pharmacy package preparation')}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Medication Items */}
      <Card>
        <CardHeader
          title={t('Prescribed Medicines')}
          subtitle={t('Medication details, route, frequency, and dosage instructions')}
          icon={Pill}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="th">#</th>
                <th className="th">{t('Medicine Name')}</th>
                <th className="th">{t('Dose')}</th>
                <th className="th">{t('Route')}</th>
                <th className="th">{t('Frequency')}</th>
                <th className="th">{t('Duration')}</th>
                <th className="th text-center">{t('Prescribed Qty')}</th>
                <th className="th text-center">{t('Dispensed Qty')}</th>
                <th className="th">{t('Instructions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(prescription.medicines || []).map((m, i) => (
                <tr key={m.id || i}>
                  <td className="td text-slate-400">{i + 1}</td>
                  <td className="td font-bold text-slate-900 dark:text-slate-100">{m.medicine}</td>
                  <td className="td font-medium text-slate-700 dark:text-slate-300">{m.dose || m.dosage || '—'}</td>
                  <td className="td">
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                      {m.route || 'ORAL'}
                    </span>
                  </td>
                  <td className="td text-slate-700 dark:text-slate-300">{m.frequency || '—'}</td>
                  <td className="td text-slate-700 dark:text-slate-300">{m.duration || '—'}</td>
                  <td className="td text-center font-bold text-slate-800 dark:text-slate-200">{m.quantity || 1}</td>
                  <td className="td text-center">
                    <span
                      className={`font-bold ${
                        (m.dispensedQuantity || 0) >= (m.quantity || 1)
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {m.dispensedQuantity || 0}
                    </span>
                  </td>
                  <td className="td max-w-xs text-xs text-slate-600 dark:text-slate-400">{m.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-5 sm:flex-row dark:border-slate-800">
          <div>
            {prescription.dispensingNotes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                <p className="font-semibold">{t('Pharmacy Counseling Notes')}:</p>
                <p className="mt-0.5">{prescription.dispensingNotes}</p>
              </div>
            )}
          </div>
          <div className="flex gap-8 text-right text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400">{t('Prescribed By')}</p>
              <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">{prescription.doctor}</p>
            </div>
            {prescription.dispensedBy && (
              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">{t('Dispensed By')}</p>
                <p className="mt-0.5 font-bold text-teal-700 dark:text-teal-400">{prescription.dispensedBy}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Dispense Modal Dialog */}
      {dispenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t('Dispense Prescription')}
                  </h3>
                  <p className="text-xs text-slate-500">#{prescription.prescriptionNumber}</p>
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
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/50">
                {dispenseItems.map((item, idx) => (
                  <div key={item.id || idx} className="grid grid-cols-12 items-center gap-3 py-2">
                    <div className="col-span-7">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.medicine}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.dose} · {item.route}
                      </p>
                    </div>
                    <div className="col-span-5 flex items-center justify-end gap-2">
                      <span className="text-[11px] text-slate-400">{t('Qty')}:</span>
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
                        className="input !w-20 !py-1 text-center font-bold text-teal-700"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('Dispensing & Counseling Notes')}
                </label>
                <textarea
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  placeholder={t('e.g. Dispensed manufacturer original packaging. Instructed patient on dosage.')}
                  rows={2}
                  className="input mt-1"
                />
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
                  {dispensing ? t('Dispensing…') : t('Confirm Dispense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printOpen && (
        <PrescriptionPrint prescription={prescription} onClose={() => setPrintOpen(false)} />
      )}
    </div>
  );
}
