import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Receipt,
  CheckCircle2,
  Clock,
  Printer,
  ChevronLeft,
  Banknote,
  DollarSign,
  ShieldCheck,
  Ban,
  Calendar,
  User,
  FlaskConical,
  Syringe,
  Pill,
  Stethoscope,
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/States';
import { formatDateTime, formatDate } from '../../utils/format';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ReceiptPrint } from '../../components/print/ReceiptPrint';

const STATUS_TONES = {
  UNPAID: 'rose',
  PARTIALLY_PAID: 'amber',
  PAID: 'sky',
  VERIFIED: 'emerald',
  CANCELLED: 'slate',
  REFUNDED: 'purple',
};

const SERVICE_ICONS = {
  CONSULTATION: Stethoscope,
  LABORATORY: FlaskConical,
  PROCEDURE: Syringe,
  INJECTION: Syringe,
  PHARMACY: Pill,
};

export default function BillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Verification Dialog State
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Cancel Payment State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Print Receipt State
  const [printOpen, setPrintOpen] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await billingService.getInvoice(id);
      setData(res);
      setPayAmount(String(res.invoice?.balance || 0));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleReceivePayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;

    setSubmittingPayment(true);
    try {
      const result = await billingService.receivePayment(data.invoice.id, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: payNotes,
      });

      toast.success(t('Payment of {{amount}} ETB recorded.', { amount: payAmount }));

      if (result.invoice.balance === 0 && result.invoice.status === 'PAID') {
        try {
          await billingService.verifyPayment(result.invoice.id, { notes: 'Auto-verified on full payment' });
          toast.success(t('Payment verified! Department worklists unlocked.'));
        } catch {}
      }

      await fetchInvoice();
      setPrintOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment recording failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await billingService.verifyPayment(data.invoice.id);
      toast.success(t('Invoice verified! Department worklists unlocked.'));
      setVerifyOpen(false);
      await fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!cancelTarget || !cancelReason) return;
    setCancelling(true);
    try {
      await billingService.cancelPayment(cancelTarget.id, { reason: cancelReason });
      toast.success(t('Payment cancelled successfully.'));
      setCancelTarget(null);
      setCancelReason('');
      await fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel payment');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label={t('Loading invoice details…')} />
      </div>
    );
  }

  if (error || !data?.invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-500">{error || t('Invoice not found.')}</p>
        <button
          onClick={() => navigate('/billing')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" /> {t('Back to Billing')}
        </button>
      </div>
    );
  }

  const { invoice, patient, visit, items = [], payments = [], verifications = [] } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Invoice {{num}}', { num: invoice.invoiceNumber })}
        subtitle={t('Encounter Billing & Payment Settlement')}
        backTo="/billing"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrintOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Printer className="h-4 w-4" /> {t('Print Receipt')}
            </button>
            {invoice.status === 'PAID' && (
              <button
                onClick={() => setVerifyOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
              >
                <ShieldCheck className="h-4 w-4" /> {t('Verify Payment')}
              </button>
            )}
          </div>
        }
      />

      {/* Patient & Invoice Snapshot Banner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Patient Snapshot */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Link to={`/patients/${patient?.id}`} className="font-bold text-slate-900 hover:underline dark:text-white">
                {patient?.fullName || invoice.patientName}
              </Link>
              <p className="text-xs text-slate-400">ID: {patient?.patientNumber || invoice.patientId} · {patient?.gender} · {patient?.phone}</p>
            </div>
          </div>
        </Card>

        {/* Visit Snapshot */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Link to={`/visits/${visit?.id}`} className="font-bold text-slate-900 hover:underline dark:text-white">
                {visit?.visitNumber || invoice.visitNumber}
              </Link>
              <p className="text-xs text-slate-400">{visit?.service || 'General OPD'} · {formatDate(invoice.createdAt)}</p>
            </div>
          </div>
        </Card>

        {/* Status Snapshot */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">{t('Billing Status')}</p>
              <div className="mt-1">
                <StatusBadge status={invoice.status} tone={STATUS_TONES[invoice.status] || 'slate'} label={t(invoice.status)} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-slate-400">{t('Balance Due')}</p>
              <p className={`mt-0.5 text-lg font-bold ${(invoice.balance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {(invoice.balance || 0).toFixed(2)} ETB
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Itemized Service Orders & Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t('Itemized Service Charges')} icon={Receipt} />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">{t('Service / Order')}</th>
                    <th className="px-4 py-3">{t('Category')}</th>
                    <th className="px-4 py-3 text-center">{t('Qty')}</th>
                    <th className="px-4 py-3 text-right">{t('Unit Price')}</th>
                    <th className="px-4 py-3 text-right">{t('Total')}</th>
                    <th className="px-4 py-3 text-center">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((it, idx) => {
                    const Icon = SERVICE_ICONS[it.serviceType] || Receipt;
                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{it.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {it.serviceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{it.quantity || 1}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{(it.unitPrice || 0).toFixed(2)} ETB</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{(it.totalPrice || 0).toFixed(2)} ETB</td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge
                            status={it.status}
                            tone={it.status === 'VERIFIED' ? 'emerald' : it.status === 'PAID' ? 'sky' : 'slate'}
                            label={t(it.status)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Calculation Footer */}
            <div className="border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex flex-col items-end space-y-1 text-sm">
                <div className="flex w-64 justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('Subtotal')}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{(invoice.totalAmount || 0).toFixed(2)} ETB</span>
                </div>
                <div className="flex w-64 justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>{t('Total Paid')}:</span>
                  <span>{(invoice.paidAmount || 0).toFixed(2)} ETB</span>
                </div>
                <div className="flex w-64 justify-between border-t border-slate-200 pt-1.5 font-bold text-base text-slate-900 dark:text-white dark:border-slate-800">
                  <span>{t('Outstanding Balance')}:</span>
                  <span className={(invoice.balance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>
                    {(invoice.balance || 0).toFixed(2)} ETB
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment & Verification Audit Trail */}
          <Card>
            <CardHeader title={t('Payment & Verification History')} icon={Clock} />
            {payments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">{t('No payments recorded yet for this invoice.')}</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{p.receiptNumber}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {p.paymentMethod}
                        </span>
                        {p.status === 'CANCELLED' && (
                          <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                            {t('CANCELLED')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {t('Received by')} {p.receivedBy} · {formatDateTime(p.receivedAt)}
                      </p>
                      {p.notes && <p className="mt-1 text-xs italic text-slate-500">{p.notes}</p>}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{(p.amount || 0).toFixed(2)} ETB
                      </span>
                      {user.role === 'administrator' && p.status !== 'CANCELLED' && (
                        <button
                          onClick={() => setCancelTarget(p)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                          title={t('Cancel Payment')}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Payment Collection Station */}
        <div className="space-y-6">
          {invoice.status !== 'VERIFIED' && (
            <Card>
              <CardHeader title={t('Cashier Payment Station')} icon={CreditCard} />
              <form onSubmit={handleReceivePayment} className="space-y-4 p-4">
                <Field label={t('Payment Amount (ETB)')} required>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={invoice.balance || invoice.totalAmount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(invoice.balance))}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {t('Pay Full ({{amt}} ETB)', { amt: invoice.balance })}
                    </button>
                  </div>
                </Field>

                <Field label={t('Payment Method')} required>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="CASH">{t('Cash at Reception')}</option>
                    <option value="BANK">{t('Telebirr / CBE Mobile Banking')}</option>
                    <option value="CARD">{t('Point of Sale (POS / Debit Card)')}</option>
                    <option value="OTHER">{t('Other / Corporate Sponsor')}</option>
                  </select>
                </Field>

                <Field label={t('Transaction Reference / Notes')}>
                  <input
                    type="text"
                    placeholder={t('e.g. Telebirr Txn # / Bank reference')}
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submittingPayment || Number(payAmount) <= 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {submittingPayment ? <Spinner size="sm" /> : <Banknote className="h-4 w-4" />}
                  {t('Record Payment')}
                </button>
              </form>
            </Card>
          )}

          {invoice.status === 'PAID' && (
            <Card className="border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-950 dark:text-emerald-200">{t('Payment Complete!')}</h4>
                  <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                    {t('The invoice has been settled. Click below to verify and authorize all department worklists.')}
                  </p>
                  <button
                    onClick={() => setVerifyOpen(true)}
                    className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" /> {t('Verify & Unlock Departments')}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {invoice.status === 'VERIFIED' && (
            <Card className="border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200">{t('Authorized & Verified')}</h4>
                  <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                    {t('All department orders for this visit have been authorized.')}
                  </p>
                  {verifications.length > 0 && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      {t('Verified by')} {verifications[verifications.length - 1].verifiedBy} (
                      {formatDateTime(verifications[verifications.length - 1].verifiedAt)})
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Verify Confirm Dialog */}
      <ConfirmDialog
        open={verifyOpen}
        title={t('Verify Payment & Authorize Worklists')}
        message={t(
          'Are you sure you want to verify invoice {{inv}} for {{patient}}? This will immediately unlock laboratory, procedure, and pharmacy worklists.',
          { inv: invoice.invoiceNumber, patient: invoice.patientName }
        )}
        confirmLabel={t('Verify & Authorize')}
        confirmTone="brand"
        loading={verifying}
        onConfirm={handleVerify}
        onCancel={() => setVerifyOpen(false)}
      />

      {/* Cancel Payment Modal */}
      {cancelTarget && (
        <Modal
          open={Boolean(cancelTarget)}
          onClose={() => setCancelTarget(null)}
          title={t('Cancel Payment — {{num}}', { num: cancelTarget.receiptNumber })}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t('Are you sure you want to cancel receipt {{rcp}} for {{amt}} ETB?', {
                rcp: cancelTarget.receiptNumber,
                amt: cancelTarget.amount,
              })}
            </p>
            <Field label={t('Cancellation Reason')} required>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('Explain why this payment is being cancelled/refunded…')}
                rows={3}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </Field>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
              <button
                onClick={() => setCancelTarget(null)}
                className="rounded-xl px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                {t('Close')}
              </button>
              <button
                onClick={handleCancelPayment}
                disabled={cancelling || !cancelReason}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelling ? <Spinner size="sm" /> : <Ban className="h-3.5 w-3.5" />}
                {t('Confirm Cancellation')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {printOpen && (
        <ReceiptPrint
          invoice={invoice}
          items={items}
          payments={payments}
          verifications={verifications}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  );
}

