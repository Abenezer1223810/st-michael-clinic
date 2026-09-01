import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Printer,
  CalendarDays,
  Users,
  Stethoscope,
  FlaskConical,
  Syringe,
  Pill,
  CreditCard,
  BarChart3,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState, EmptyState } from '../../components/ui/States';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { PrintShell, ClinicHeader } from '../../components/print/PrintShell';
import { RevenueReportPrint } from '../../components/print/RevenueReportPrint';
import { LabWorkloadPrint } from '../../components/print/LabWorkloadPrint';
import { formatDateTime, formatDate, todayKey } from '../../utils/format';

const TABS = [
  { key: 'daily', label: 'Daily Patients', icon: Users },
  { key: 'revenue', label: 'Daily Revenue & Cashier', icon: CreditCard },
  { key: 'lab_workload', label: 'Lab Workload & Analyzers', icon: BarChart3 },
  { key: 'opd', label: 'OPD Consultations', icon: Stethoscope },
  { key: 'laboratory', label: 'Laboratory Diagnostic', icon: FlaskConical },
  { key: 'procedures', label: 'Clinical Procedures', icon: Scissors },
  { key: 'prescriptions', label: 'Prescriptions & Pharmacy', icon: Pill },
];

const TITLES = {
  daily: 'Daily Patient Census Report',
  revenue: 'Daily Revenue & Cashier Collections Report',
  lab_workload: 'Laboratory Workload & Analyzer Report',
  opd: 'OPD Consultation Report',
  laboratory: 'Laboratory Requests & Results Report',
  procedures: 'Clinical Procedure Report',
  prescriptions: 'Prescription & Dispensing Report',
};

export default function Reports() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(todayKey());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Print modals
  const [printRevenue, setPrintRevenue] = useState(false);
  const [printWorkload, setPrintWorkload] = useState(false);
  const [printGeneric, setPrintGeneric] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);

    let promise;
    if (tab === 'daily') promise = reportService.dailyPatients(date);
    else if (tab === 'revenue') promise = reportService.revenue(date);
    else if (tab === 'lab_workload') promise = reportService.labWorkload(date);
    else if (tab === 'opd') promise = reportService.opd(date);
    else if (tab === 'laboratory') promise = reportService.laboratory(date);
    else if (tab === 'procedures') promise = reportService.procedures(date);
    else if (tab === 'prescriptions') promise = reportService.prescriptions(date);

    if (promise) {
      promise
        .then((d) => setReport(d.report))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    load();
  }, [tab, date]);

  const handlePrintClick = () => {
    if (tab === 'revenue') setPrintRevenue(true);
    else if (tab === 'lab_workload') setPrintWorkload(true);
    else setPrintGeneric(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Reports & Clinical Intelligence')}
        subtitle={t('Comprehensive healthcare reporting, analytics, audit summaries, and official printouts')}
        icon={Activity}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
              />
            </div>
            <button className="btn-primary" onClick={handlePrintClick} disabled={loading || !report}>
              <Printer className="h-4 w-4" /> {t('Print Report')}
            </button>
          </div>
        }
      />

      <Tabs tabs={TABS.map((tItem) => ({ ...tItem, label: t(tItem.label) }))} active={tab} onChange={setTab} />

      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !report ? (
        <EmptyState title={t('No report data')} description={t('Try selecting another date.')} />
      ) : (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          {tab === 'daily' && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title={t('Total Visits Today')} value={report.totalVisits || 0} icon={Users} tone="teal" />
              <StatCard title={t('New Patients')} value={report.newPatients || 0} icon={Users} tone="blue" />
              <StatCard title={t('Returning Patients')} value={report.returningPatients || 0} icon={Activity} tone="purple" />
            </div>
          )}

          {tab === 'revenue' && (
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard title={t('Total Cash Collected')} value={`${(report.totalCollected || 0).toLocaleString()} ETB`} icon={CreditCard} tone="teal" />
              <StatCard title={t('Total Invoiced')} value={`${(report.totalInvoiced || 0).toLocaleString()} ETB`} icon={CreditCard} tone="blue" />
              <StatCard title={t('Settled Receipts')} value={report.paymentCount || 0} icon={CheckCircle} tone="emerald" />
              <StatCard title={t('Outstanding Balance')} value={`${Math.max(0, (report.totalInvoiced || 0) - (report.totalCollected || 0)).toLocaleString()} ETB`} icon={Activity} tone="amber" />
            </div>
          )}

          {tab === 'lab_workload' && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title={t('Samples Barcoded')} value={report.samplesCollected || 0} icon={FlaskConical} tone="purple" />
              <StatCard title={t('Test Parameters Run')} value={report.totalTestsRun || 0} icon={BarChart3} tone="teal" />
              <StatCard title={t('Verified Test Panels')} value={report.resultsVerified || 0} icon={CheckCircle} tone="emerald" />
            </div>
          )}

          {/* Main Table / Visual Breakdown */}
          <Card>
            <CardHeader
              title={t(TITLES[tab] || 'Report')}
              subtitle={t('Data for {{date}}', { date: formatDate(date) })}
              icon={Activity}
            />

            {tab === 'revenue' ? (
              <div className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('Payment Methods')}</h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(report.byMethod || {}).map(([m, amt]) => (
                        <div key={m} className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{m}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{amt.toLocaleString()} ETB</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('Department Breakdown')}</h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(report.byCategory || {}).map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{t(cat)}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{amt.toLocaleString()} ETB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t('Receipts Audit Trail')}</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
                        <th className="th"># {t('Receipt')}</th>
                        <th className="th">{t('Method')}</th>
                        <th className="th">{t('Amount')}</th>
                        <th className="th">{t('Cashier')}</th>
                        <th className="th">{t('Time')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(report.payments || []).map((p, i) => (
                        <tr key={p.id || i}>
                          <td className="td font-mono font-bold text-brand-700 dark:text-brand-400">{p.receiptNumber}</td>
                          <td className="td">{p.paymentMethod}</td>
                          <td className="td font-bold text-emerald-600">{p.amount} ETB</td>
                          <td className="td">{p.receivedBy}</td>
                          <td className="td text-slate-400">{formatDateTime(p.receivedAt || p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : tab === 'lab_workload' ? (
              <div className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('Volume by Hardware Analyzer')}</h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(report.byAnalyzer || {}).map(([dev, count]) => (
                        <div key={dev} className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{dev}</span>
                          <span className="font-bold text-brand-700 dark:text-brand-400">{count} tests</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('Volume by Diagnostic Panel')}</h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(report.byGroup || {}).map(([grp, count]) => (
                        <div key={grp} className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{t(grp)}</span>
                          <span className="font-bold text-brand-700 dark:text-brand-400">{count} tests</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
                      <th className="th">#</th>
                      <th className="th">{t('Patient')}</th>
                      <th className="th">{t('Details')}</th>
                      <th className="th">{t('Staff / Performer')}</th>
                      <th className="th">{t('Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {((report.visits || report.consultations || report.requests || report.procedures || report.prescriptions) || []).map((row, i) => (
                      <tr key={row.id || i}>
                        <td className="td font-mono font-bold text-brand-700 dark:text-brand-400">
                          {row.visitNumber || row.consultationNumber || row.requestNumber || row.procedureNumber || row.prescriptionNumber}
                        </td>
                        <td className="td font-semibold text-slate-800 dark:text-slate-200">{row.patientName}</td>
                        <td className="td text-slate-600 dark:text-slate-400">
                          {row.service || row.diagnosis || row.procedureType || (row.medicines ? `${row.medicines.length} meds` : (row.tests?.map((tt) => tt.name).join(', ') || '—'))}
                        </td>
                        <td className="td text-slate-500">{row.doctor || row.requestingDoctor || row.performer || 'Staff'}</td>
                        <td className="td"><StatusBadge status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Print Modals */}
      {printRevenue && report && (
        <RevenueReportPrint report={report} onClose={() => setPrintRevenue(false)} />
      )}
      {printWorkload && report && (
        <LabWorkloadPrint report={report} onClose={() => setPrintWorkload(false)} />
      )}
      {printGeneric && report && (
        <PrintShell title={TITLES[tab]} onClose={() => setPrintGeneric(false)}>
          <ClinicHeader title={TITLES[tab].toUpperCase()} />
          <div className="mb-4 text-xs text-slate-500">{t('Date')}: {date}</div>
          <pre className="overflow-x-auto text-xs">{JSON.stringify(report, null, 2)}</pre>
        </PrintShell>
      )}
    </div>
  );
}
