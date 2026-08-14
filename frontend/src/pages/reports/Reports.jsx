import { useEffect, useState } from 'react';
import { Activity, Printer, CalendarDays, Users, Stethoscope, FlaskConical, Syringe, Pill } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
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
  if (type === 'daily') {
    return (
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="th">Visit No.</th>
            <th className="th">Patient</th>
            <th className="th">Patient ID</th>
            <th className="th">Service</th>
            <th className="th">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-brand-700">{r.visitNumber}</td>
              <td className="td font-medium text-slate-800">{r.patientName}</td>
              <td className="td text-slate-500">{r.patientId}</td>
              <td className="td text-slate-600">{r.service}</td>
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
            <th className="th">Consultation No.</th>
            <th className="th">Patient</th>
            <th className="th">Doctor</th>
            <th className="th">Diagnosis</th>
            <th className="th">Status</th>
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
            <th className="th">Request No.</th>
            <th className="th">Patient</th>
            <th className="th">Tests</th>
            <th className="th">Requesting Doctor</th>
            <th className="th">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-brand-700">{r.requestNumber}</td>
              <td className="td font-medium text-slate-800">{r.patientName}</td>
              <td className="td text-slate-500">{r.tests.map((t) => t.name).join(', ')}</td>
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
            <th className="th">Procedure No.</th>
            <th className="th">Patient</th>
            <th className="th">Procedure</th>
            <th className="th">Requesting Doctor</th>
            <th className="th">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td font-semibold text-brand-700">{r.procedureNumber}</td>
              <td className="td font-medium text-slate-800">{r.patientName}</td>
              <td className="td text-slate-500">{r.procedureType}</td>
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
          <th className="th">Prescription No.</th>
          <th className="th">Patient</th>
          <th className="th">Medicines</th>
          <th className="th">Doctor</th>
          <th className="th">Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="td font-semibold text-brand-700">{r.prescriptionNumber}</td>
            <td className="td font-medium text-slate-800">{r.patientName}</td>
            <td className="td text-slate-500">{r.medicines.map((m) => m.medicine).join(', ')}</td>
            <td className="td text-slate-600">{r.doctor}</td>
            <td className="td text-slate-500">{formatDateTime(r.date)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Reports() {
  const [type, setType] = useState('daily');
  const [date, setDate] = useState(todayKey());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
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
      .then((d) => setReport(d.report))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [type, date]);

  const stats =
    type === 'daily'
      ? [
          { icon: Users, label: 'Total Visits', value: report?.totalVisits, tone: 'brand' },
          { icon: Users, label: 'New Patients', value: report?.newPatientsToday, tone: 'sky' },
          { icon: Users, label: 'Returning Patients', value: report?.returningPatientsToday, tone: 'violet' },
        ]
      : type === 'opd'
      ? [
          { icon: Stethoscope, label: 'Total Consultations', value: report?.totalConsultations, tone: 'brand' },
          { icon: Stethoscope, label: 'Completed', value: report?.completed, tone: 'emerald' },
          { icon: Stethoscope, label: 'In Progress', value: report?.inProgress, tone: 'amber' },
        ]
      : type === 'laboratory'
      ? [
          { icon: FlaskConical, label: 'Total Requests', value: report?.totalRequests, tone: 'brand' },
          { icon: FlaskConical, label: 'Pending', value: report?.pending, tone: 'amber' },
          { icon: FlaskConical, label: 'In Progress', value: report?.inProgress, tone: 'sky' },
          { icon: FlaskConical, label: 'Completed', value: report?.completed, tone: 'emerald' },
        ]
      : type === 'procedures'
      ? [
          { icon: Syringe, label: 'Total Procedures', value: report?.totalProcedures, tone: 'brand' },
          { icon: Syringe, label: 'Pending', value: report?.pending, tone: 'amber' },
          { icon: Syringe, label: 'Completed', value: report?.completed, tone: 'emerald' },
        ]
      : [
          { icon: Pill, label: 'Total Prescriptions', value: report?.totalPrescriptions, tone: 'brand' },
        ];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Daily operational and clinical reports"
        icon={Activity}
        actions={
          <>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input type="date" className="input !w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={() => setPrintOpen(true)} disabled={loading || !report}>
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </>
        }
      />

      <Tabs tabs={TABS} active={type} onChange={setType} />

      {loading ? (
        <LoadingState label="Generating report…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setDate(date)} />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader title={TITLES[type]} subtitle={`Report for ${formatDate(date)}`} icon={Activity} />
            {report?.rows?.length ? (
              <div className="overflow-x-auto">
                <ReportTable type={type} rows={report.rows} />
              </div>
            ) : (
              <EmptyState title="No records for this date" description="There are no records for the selected report and date." />
            )}
          </Card>
        </>
      )}

      {printOpen && report && (
        <PrintShell title={TITLES[type]} onClose={() => setPrintOpen(false)} printLabel="Print Report">
          <ClinicHeader title={TITLES[type]} />
          <p className="mb-4 text-sm text-slate-600">
            Report date: <span className="font-semibold">{formatDate(report.date)}</span>
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <ReportTable type={type} rows={report.rows} />
          </div>
          <p className="mt-8 text-center text-[10px] text-slate-400">
            Generated by the St. Michael Medium Clinic patient management system.
          </p>
        </PrintShell>
      )}
    </div>
  );
}
