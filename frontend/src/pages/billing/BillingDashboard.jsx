import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Search,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  DollarSign,
  ShieldCheck,
  Printer,
  ChevronRight,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Spinner, EmptyState } from '../../components/ui/States';
import { formatDateTime } from '../../utils/format';
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

export default function BillingDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');

  // Quick Payment Modal State
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Verification Confirm State
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Print Receipt State
  const [printTarget, setPrintTarget] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingService.listInvoices();
      setInvoices(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setSearchParams(status === 'ALL' ? {} : { status });
  };

  const openPaymentModal = (invoice) => {
    setPaymentTarget(invoice);
    setPaymentAmount(String(invoice.balance || invoice.totalAmount));
    setPaymentMethod('CASH');
    setPaymentNotes('');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentTarget || !paymentAmount || Number(paymentAmount) <= 0) return;

    setSubmittingPayment(true);
    try {
      const result = await billingService.receivePayment(paymentTarget.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        notes: paymentNotes,
      });

      toast.success(t('Payment of {{amount}} ETB recorded successfully.', { amount: paymentAmount }));

      // Automatically offer to verify if balance reached 0
      if (result.invoice.balance === 0 && result.invoice.status === 'PAID') {
        try {
          await billingService.verifyPayment(result.invoice.id, { notes: 'Automatic verification upon full payment' });
          toast.success(t('Payment verified! Department worklists unlocked.'));
        } catch (vErr) {
          console.warn('Auto verify skipped:', vErr.message);
        }
      }

      setPaymentTarget(null);
      await fetchInvoices();

      // Open print receipt for convenience
      const detail = await billingService.getInvoice(result.invoice.id);
      setPrintTarget(detail);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleVerifyInvoice = async () => {
    if (!verifyTarget) return;
    setVerifying(true);
    try {
      await billingService.verifyPayment(verifyTarget.id);
      toast.success(t('Invoice {{num}} verified! Department worklists authorized.', { num: verifyTarget.invoiceNumber }));
      setVerifyTarget(null);
      await fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const openPrintModal = async (invoice) => {
    try {
      const detail = await billingService.getInvoice(invoice.id);
      setPrintTarget(detail);
    } catch (err) {
      toast.error(t('Failed to load invoice receipt details.'));
    }
  };

  // Filtered dataset
  const filtered = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.patientName.toLowerCase().includes(q) ||
      inv.visitNumber.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Calculate Statistics
  const totalBilled = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + (i.balance || 0), 0);
  const unverifiedCount = invoices.filter((i) => i.status === 'PAID').length;
  const unpaidCount = invoices.filter((i) => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID').length;

  const columns = [
    {
      key: 'invoiceNumber',
      header: t('Invoice No.'),
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100">{r.invoiceNumber}</span>
          <p className="text-[11px] text-slate-400">{r.visitNumber}</p>
        </div>
      ),
    },
    {
      key: 'patient',
      header: t('Patient'),
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{r.patientName}</span>
          <p className="text-[11px] text-slate-400">ID: {r.patientId}</p>
        </div>
      ),
    },
    {
      key: 'services',
      header: t('Orders / Items'),
      render: (r) => (
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {r.itemCount || 1} {t('Items')}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: t('Total Billed'),
      render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-200">{(r.totalAmount || 0).toFixed(2)} ETB</span>,
    },
    {
      key: 'paidAmount',
      header: t('Paid Amount'),
      render: (r) => <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{(r.paidAmount || 0).toFixed(2)} ETB</span>,
    },
    {
      key: 'balance',
      header: t('Balance Due'),
      render: (r) => (
        <span
          className={`font-bold ${
            (r.balance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {(r.balance || 0).toFixed(2)} ETB
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (r) => <StatusBadge status={r.status} tone={STATUS_TONES[r.status] || 'slate'} label={t(r.status)} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (r) => (
        <div className="flex items-center gap-2">
          {/* Quick Pay Button */}
          {r.status !== 'VERIFIED' && r.balance > 0 && (
            <button
              onClick={() => openPaymentModal(r)}
              className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
              title={t('Collect Payment')}
            >
              <CreditCard className="h-3.5 w-3.5" /> {t('Collect')}
            </button>
          )}

          {/* Quick Verify Button */}
          {r.status === 'PAID' && (
            <button
              onClick={() => setVerifyTarget(r)}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              title={t('Verify & Authorize Departments')}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> {t('Verify')}
            </button>
          )}

          {/* Print Receipt */}
          <button
            onClick={() => openPrintModal(r)}
            className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title={t('Print Receipt')}
          >
            <Printer className="h-4 w-4" />
          </button>

          {/* View Details */}
          <button
            onClick={() => navigate(`/billing/${r.id}`)}
            className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title={t('View Full Invoice')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Billing & Payment Counter')}
        subtitle={t('Manage patient invoices, collect payments, issue receipts, and authorize department worklists')}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchInvoices}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Receipt className="h-4 w-4" /> {t('Refresh')}
            </button>
          </div>
        }
      />

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label={t('Total Billed')}
          value={`${totalBilled.toLocaleString()} ETB`}
          subtext={t('{{count}} patient encounters', { count: invoices.length })}
          tone="brand"
        />
        <StatCard
          icon={Banknote}
          label={t('Total Collected')}
          value={`${totalCollected.toLocaleString()} ETB`}
          subtext={t('Verified & cash received')}
          tone="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label={t('Outstanding Balance')}
          value={`${totalOutstanding.toLocaleString()} ETB`}
          subtext={t('{{count}} unpaid invoices', { count: unpaidCount })}
          tone="amber"
        />
        <StatCard
          icon={ShieldCheck}
          label={t('Ready for Verification')}
          value={unverifiedCount}
          subtext={t('Fully paid, awaiting reception verification')}
          tone="sky"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: t('All Invoices'), count: invoices.length },
              { id: 'UNPAID', label: t('Unpaid'), count: invoices.filter((i) => i.status === 'UNPAID').length },
              { id: 'PARTIALLY_PAID', label: t('Partially Paid'), count: invoices.filter((i) => i.status === 'PARTIALLY_PAID').length },
              { id: 'PAID', label: t('Paid (Awaiting Verification)'), count: unverifiedCount },
              { id: 'VERIFIED', label: t('Verified & Completed'), count: invoices.filter((i) => i.status === 'VERIFIED').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusFilterChange(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-brand-600 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('Search patient, invoice, visit…')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner label={t('Loading clinic invoices…')} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t('No Invoices Found')}
            message={t('There are no billing records matching the selected status filter.')}
          />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </Card>

      {/* Collect Payment Modal */}
      {paymentTarget && (
        <Modal
          open={Boolean(paymentTarget)}
          onClose={() => setPaymentTarget(null)}
          title={t('Receive Payment — {{num}}', { num: paymentTarget.invoiceNumber })}
          size="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{t('Patient')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{paymentTarget.patientName}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-500">{t('Total Amount')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{(paymentTarget.totalAmount || 0).toFixed(2)} ETB</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-500">{t('Outstanding Balance')}:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{(paymentTarget.balance || 0).toFixed(2)} ETB</span>
              </div>
            </div>

            <Field label={t('Payment Amount (ETB)')} required>
              <input
                type="number"
                step="0.01"
                min="1"
                max={paymentTarget.balance || paymentTarget.totalAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(paymentTarget.balance))}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  {t('Full Balance ({{amt}} ETB)', { amt: paymentTarget.balance })}
                </button>
                {paymentTarget.balance > 100 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String((paymentTarget.balance / 2).toFixed(2)))}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    50% ({(paymentTarget.balance / 2).toFixed(2)} ETB)
                  </button>
                )}
              </div>
            </Field>

            <Field label={t('Payment Method')} required>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="CASH">{t('Cash at Reception')}</option>
                <option value="BANK">{t('Telebirr / CBE Mobile Banking')}</option>
                <option value="CARD">{t('Point of Sale (POS / Debit Card)')}</option>
                <option value="OTHER">{t('Other / Corporate Sponsor')}</option>
              </select>
            </Field>

            <Field label={t('Reference / Transaction ID / Notes')}>
              <input
                type="text"
                placeholder={t('e.g. Telebirr Txn # / Bank reference')}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentTarget(null)}
                className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700 disabled:opacity-50"
              >
                {submittingPayment ? <Spinner size="sm" /> : <CheckCircle2 className="h-4 w-4" />}
                {t('Confirm Payment')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Verify Confirm Dialog */}
      {verifyTarget && (
        <ConfirmDialog
          open={Boolean(verifyTarget)}
          title={t('Verify Payment & Authorize Worklists')}
          message={t(
            'Are you sure you want to verify invoice {{inv}} for {{patient}}? This will immediately unlock laboratory, procedure, and pharmacy worklists.',
            { inv: verifyTarget.invoiceNumber, patient: verifyTarget.patientName }
          )}
          confirmLabel={t('Verify & Authorize')}
          confirmTone="brand"
          loading={verifying}
          onConfirm={handleVerifyInvoice}
          onCancel={() => setVerifyTarget(null)}
        />
      )}

      {/* Printable Receipt Modal */}
      {printTarget && (
        <ReceiptPrint
          invoice={printTarget.invoice}
          items={printTarget.items}
          payments={printTarget.payments}
          verifications={printTarget.verifications}
          onClose={() => setPrintTarget(null)}
        />
      )}
    </div>
  );
}

