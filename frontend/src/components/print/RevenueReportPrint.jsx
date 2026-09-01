import { useTranslation } from 'react-i18next';
import { PrintShell, ClinicHeader } from './PrintShell';
import { formatDateTime } from '../../utils/format';

export function RevenueReportPrint({ report, onClose }) {
  const { t } = useTranslation();
  if (!report) return null;

  const {
    date,
    totalCollected = 0,
    totalInvoiced = 0,
    paymentCount = 0,
    byMethod = {},
    byCategory = {},
    byCashier = {},
    payments = [],
  } = report;

  return (
    <PrintShell title="Daily Revenue & Financial Report" onClose={onClose}>
      <ClinicHeader title="DAILY REVENUE & AUDIT REPORT" />

      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
        <div>
          <span className="font-bold text-slate-700">{t('Reporting Date')}:</span>{' '}
          <span className="font-semibold text-brand-800">{date}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">{t('Generated At')}:</span>{' '}
          <span className="text-slate-600">{formatDateTime(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Highlights */}
      <div className="mb-6 grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{t('Total Cash Received')}</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-700">{totalCollected.toLocaleString()} ETB</p>
          <p className="text-[10px] text-emerald-600">{paymentCount} {t('settled payments')}</p>
        </div>
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-800">{t('Total Invoiced')}</p>
          <p className="mt-1 text-lg font-extrabold text-brand-700">{totalInvoiced.toLocaleString()} ETB</p>
          <p className="text-[10px] text-brand-600">{report.invoiceCount || 0} {t('invoices generated')}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">{t('Outstanding Balance')}</p>
          <p className="mt-1 text-lg font-extrabold text-amber-700">{Math.max(0, totalInvoiced - totalCollected).toLocaleString()} ETB</p>
          <p className="text-[10px] text-amber-600">{t('Pending settlement')}</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="mb-6 grid grid-cols-2 gap-4 text-xs">
        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="border-b border-slate-200 pb-1 font-bold text-slate-800">{t('Revenue by Payment Channel')}</h4>
          <div className="mt-2 space-y-1.5">
            {Object.entries(byMethod).map(([m, amt]) => (
              <div key={m} className="flex justify-between">
                <span className="text-slate-600">{m}</span>
                <span className="font-semibold">{amt.toLocaleString()} ETB</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="border-b border-slate-200 pb-1 font-bold text-slate-800">{t('Revenue by Service Department')}</h4>
          <div className="mt-2 space-y-1.5">
            {Object.entries(byCategory).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between">
                <span className="text-slate-600">{t(cat)}</span>
                <span className="font-semibold">{amt.toLocaleString()} ETB</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Payments Table */}
      <div className="mb-6">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">{t('Settled Payment Transactions')}</h4>
        <div className="overflow-hidden rounded border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-[10px] text-slate-600">
              <tr>
                <th className="p-1.5 font-bold"># {t('Receipt')}</th>
                <th className="p-1.5 font-bold">{t('Method')}</th>
                <th className="p-1.5 font-bold">{t('Amount')}</th>
                <th className="p-1.5 font-bold">{t('Cashier')}</th>
                <th className="p-1.5 font-bold">{t('Time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p, idx) => (
                <tr key={idx}>
                  <td className="p-1.5 font-mono font-bold text-brand-700">{p.receiptNumber}</td>
                  <td className="p-1.5">{p.paymentMethod}</td>
                  <td className="p-1.5 font-bold">{p.amount} ETB</td>
                  <td className="p-1.5">{p.receivedBy}</td>
                  <td className="p-1.5 text-slate-400">{formatDateTime(p.receivedAt || p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-12 border-t border-slate-300 pt-4 text-xs">
        <div>
          <p className="font-bold text-slate-700">{t('Prepared By (Lead Cashier)')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">Hanna Tesfaye (Reception / Cashier)</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-700">{t('Audited & Approved By (Finance/Admin)')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">Amanuel Berhe (System Administrator)</p>
        </div>
      </div>
    </PrintShell>
  );
}

