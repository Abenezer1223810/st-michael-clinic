import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../utils/format';
import { PrintShell, ClinicHeader, PrintFieldGrid } from './PrintShell';

export function ReceiptPrint({ invoice, items = [], payments = [], verifications = [], onClose }) {
  const { t } = useTranslation();
  const patient = invoice?.patient || {
    fullName: invoice?.patientName,
    id: invoice?.patientId,
  };

  const latestPayment = payments[payments.length - 1] || {};
  const latestVerification = verifications[verifications.length - 1] || null;

  return (
    <PrintShell title="Official Receipt" onClose={onClose} printLabel="Print Receipt">
      <ClinicHeader title="OFFICIAL CASH RECEIPT" />

      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <PrintFieldGrid
          patient={patient}
          extra={[
            ['Visit Number', invoice?.visitNumber],
            ['Invoice No.', invoice?.invoiceNumber],
            ['Receipt No.', latestPayment?.receiptNumber || '—'],
            ['Date & Time', formatDateTime(latestPayment?.receivedAt || invoice?.createdAt)],
            ['Payment Method', latestPayment?.paymentMethod || 'CASH'],
            ['Billing Status', invoice?.status || 'PAID'],
          ]}
        />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-brand-50 text-left">
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">#</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Service / Item Description')}</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Type')}</th>
            <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600">{t('Qty')}</th>
            <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-600">{t('Unit Price (ETB)')}</th>
            <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold text-slate-600">{t('Total (ETB)')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="border border-slate-200 px-3 py-2 text-slate-600">{i + 1}</td>
              <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-800">{it.description}</td>
              <td className="border border-slate-200 px-3 py-2 text-xs text-slate-600">{it.serviceType}</td>
              <td className="border border-slate-200 px-3 py-2 text-center text-slate-700">{it.quantity || 1}</td>
              <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{(it.unitPrice || 0).toFixed(2)}</td>
              <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-900">{(it.totalPrice || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>{t('Total Billed')}:</span>
            <span className="font-semibold text-slate-800">{(invoice?.totalAmount || 0).toFixed(2)} ETB</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>{t('Amount Paid')}:</span>
            <span>{(invoice?.paidAmount || 0).toFixed(2)} ETB</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
            <span>{t('Balance Due')}:</span>
            <span className={(invoice?.balance || 0) > 0 ? 'text-amber-700' : 'text-slate-900'}>
              {(invoice?.balance || 0).toFixed(2)} ETB
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">{t('Received By (Cashier)')}</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{latestPayment?.receivedBy || 'Hanna Tesfaye'}</p>
          {latestVerification && (
            <p className="text-[11px] text-emerald-600">
              ✓ {t('Verified by')} {latestVerification.verifiedBy} ({formatDateTime(latestVerification.verifiedAt)})
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="inline-block h-16 w-36 rounded-lg border border-dashed border-slate-300 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">{t('Clinic Stamp')}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{t('Thank you for choosing St. Michael Clinic.')}</p>
        </div>
      </div>
    </PrintShell>
  );
}

export default ReceiptPrint;

