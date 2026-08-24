import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Printer, CalendarDays, Users, Stethoscope, FlaskConical, Syringe, Pill } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState, EmptyState } from '../../components/ui/States';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { PrintShell, ClinicHeader } from '../../components/print/PrintShell';
import { formatDateTime, formatDate, todayKey } from '../../utils/format';

const TABS = [
  { key: 'daily', label: 'Daily Patients', icon: Users },
  { key: 'opd', label: 'OPD', icon: Stethoscope },
  { key: 'laboratory', label: 'Laboratory', icon: FlaskConical },
  { key: 'procedures', label: 'Procedures', icon: Syringe },
  { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
];

const TITLES = {
  daily: 'Daily Patient Report',
  opd: 'OPD Consultation Report',
  laboratory: 'Laboratory Report',
  procedures: 'Procedure Report',
  prescriptions: 'Prescription Report',
};

function ReportTable({ type, rows }) {
  const { t } = useTranslation();
  if (type === 'daily') {
    return (
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="th">{t('Visit No.')}</th>
            <th className="th">{t('Patient')}</th>
            <th className="th">{t('Patient ID')}</th>
            <th className="th">{t('Service')}</th>
            <th className="th">{t('Time')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-brand-700">{r.visitNumber}</td>
              <td className="td font-medium text-slate-800">{r.patientName}</td>
              <td className="td text-slate-500">{r.patientId}</td>
              <td className="td text-slate-600">{t(r.service)}</td>
              <td className="td text-slate-500">{formatDateTime(r.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (type === 'opd') {
    return (
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="th">{t('Consultation No.')}</th>
            <th className="th">{t('Patient')}</th>
            <th className="th">{t('Doctor')}</th>
            <th className="th">{t('Diagnosis')}</th>
            <th className="th">{t('Status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-brand-700">{r.consultationNumber}</td>
              <td className="td font-medium text-slate-800">{r.patientName}</td>
              <td className="td text-slate-600">{r.doctor}</td>
              <td className="td text-slate-500">{r.diagnosis || '—'}</td>
              <td className="td"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (type === 'laboratory') {
    return (
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="th">{t('Request No.')}</th>
            <th className="th">{t('Patient')}</th>
            <th className="th">{t('Tests')}</th>
            <th className="th">{t('Requesting Doctor')}</th>
            <th className="th">{t('Status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-brand-700">{r.requestNumber}</td>
              <td className="td font-medium text-slate-800">{r.patientName}</td>
              <td className="td text-slate-500">{(r.tests || []).map((test) => t(test.name)).join(', ')}</td>
              <td className="td text-slate-600">{r.requestingDoctor}</td>
              <td className="td"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (type === 'procedures') {
    return (
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="th">{t('Procedure No.')}</th>
            <th className="th">{t('Patient')}</th>
            <th className="th">{t('Procedure')}</th>
            <th className="th">{t('Requesting Doctor')}</th>
            <th className="th">{t('Status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-brand-700">{r.procedureNumber}</td>
              <td className="td font-medium text-slate-800">{r.patientName}</td>
              <td className="td text-slate-500">{t(r.procedureType)}</td>
              <td className="td text-slate-600">{r.requestingDoctor}</td>
              <td className="td"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <table className="w-full min-w-max">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          <th className="th">{t('Prescription No.')}</th>
          <th className="th">{t('Patient')}</th>
          <th className="th">{t('Medicines')}</th>
          <th className="th">{t('Doctor')}</th>
          <th className="th">{t('Date')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="td font-semibold text-brand-700">{r.prescriptionNumber}</td>
            <td className="td font-medium text-slate-800">{r.patientName}</td>
            <td className="td text-slate-500">{(r.medicines || []).map((m) => m.medicine).join(', ')}</td>
            <td className="td text-slate-600">{r.doctor}</td>
            <td className="td text-slate-500">{formatDateTime(r.date)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  const [type, setType] = useState('daily');
  const [date, setDate] = useState(todayKey());
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setReport(null);
    const fn =
      type === 'daily'
        ? reportService.dailyPatients
        : type === 'opd'
        ? reportService.opd
        : type === 'laboratory'
        ? reportService.laboratory
        : type === 'procedures'
        ? reportService.procedures
        : reportService.prescriptions;
    fn(date)
      .then((d) => {
        setReport(d.report);
        setReportType(type);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [type, date]);

  const stats =
    type === 'daily'
      ? [
          { icon: Users, label: t('Total Visits'), value: report?.totalVisits, tone: 'brand' },
          { icon: Users, label: t('New Patients'), value: report?.newPatientsToday, tone: 'sky' },
          { icon: Users, label: t('Returning Patients'), value: report?.returningPatientsToday, tone: 'violet' },
        ]
      : type === 'opd'
      ? [
          { icon: Stethoscope, label: t('Total Consultations'), value: report?.totalConsultations, tone: 'brand' },
          { icon: Stethoscope, label: t('Completed'), value: report?.completed, tone: 'emerald' },
          { icon: Stethoscope, label: t('In Progress'), value: report?.inProgress, tone: 'amber' },
        ]
      : type === 'laboratory'
      ? [
          { icon: FlaskConical, label: t('Total Requests'), value: report?.totalRequests, tone: 'brand' },
          { icon: FlaskConical, label: t('Pending'), value: report?.pending, tone: 'amber' },
          { icon: FlaskConical, label: t('In Progress'), value: report?.inProgress, tone: 'sky' },
          { icon: FlaskConical, label: t('Completed'), value: report?.completed, tone: 'emerald' },
        ]
      : type === 'procedures'
      ? [
          { icon: Syringe, label: t('Total Procedures'), value: report?.totalProcedures, tone: 'brand' },
          { icon: Syringe, label: t('Pending'), value: report?.pending, tone: 'amber' },
          { icon: Syringe, label: t('Completed'), value: report?.completed, tone: 'emerald' },
        ]
      : [
          { icon: Pill, label: t('Total Prescriptions'), value: report?.totalPrescriptions, tone: 'brand' },
        ];

  return (
    <div>
      <PageHeader
        title={t('Reports')}
        subtitle={t('Daily operational and clinical reports')}
        icon={Activity}
        actions={
          <>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input type="date" className="input !w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={() => setPrintOpen(true)} disabled={loading || !report}>
              <Printer className="h-4 w-4" /> {t('Print Report')}
            </button>
          </>
        }
      />

      <Tabs
        tabs={TABS.map((tab) => ({ ...tab, label: t(tab.label) }))}
        active={type}
        onChange={setType}
      />

      {error ? (
        <ErrorState message={error} onRetry={() => setDate(date)} />
      ) : loading || reportType !== type ? (
        <SkeletonTable rows={5} />
      ) : report ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader title={t(TITLES[type])} subtitle={t('Report for {{date}}', { date: formatDate(date) })} icon={Activity} />
            {report?.rows?.length ? (
              <div className="overflow-x-auto">
                <ReportTable type={type} rows={report.rows} />
              </div>
            ) : (
              <EmptyState title={t('No records for this date')} description={t('There are no records for the selected report and date.')} />
            )}
          </Card>
        </>
      ) : null}

      {printOpen && report && reportType === type && (
        <PrintShell title={t(TITLES[type])} onClose={() => setPrintOpen(false)} printLabel={t('Print Report')}>
          <ClinicHeader title={t(TITLES[type])} />
          <p className="mb-4 text-sm text-slate-600">
            {t('Report date:')} <span className="font-semibold">{formatDate(report.date)}</span>
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <ReportTable type={type} rows={report.rows} />
          </div>
          <p className="mt-8 text-center text-[10px] text-slate-400">
            {t('Generated by the St. Michael Medium Clinic patient management system.')}
          </p>
        </PrintShell>
      )}
    </div>
  );
}
