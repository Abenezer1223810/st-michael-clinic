import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarPlus,
  History,
  Stethoscope,
  FlaskConical,
  Syringe,
  Pill,
  CalendarDays,
  User,
  MapPin,
  Phone,
  Activity,
  CheckCircle2,
  ClipboardList,
  Printer,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PatientHeader } from '../../components/PatientHeader';
import { CreateVisitModal } from '../../components/CreateVisitModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState, EmptyState } from '../../components/ui/States';
import { SkeletonProfile } from '../../components/ui/Skeleton';
import { formatDate, formatDateTime } from '../../utils/format';
import { LabResultPrint } from '../../components/print/LabResultPrint';
import { PrescriptionPrint } from '../../components/print/PrescriptionPrint';

const PROFILE_TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'visits', label: 'Visits', icon: CalendarDays },
  { key: 'opd', label: 'OPD', icon: Stethoscope },
  { key: 'laboratory', label: 'Laboratory', icon: FlaskConical },
  { key: 'procedures', label: 'Procedures', icon: Syringe },
  { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
];

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value || '—'}</span>
    </div>
  );
}

const SEVERITY_STYLES = {
  Mild: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Moderate: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Severe: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  'Life-threatening': 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

function TimelineEvent({ icon: Icon, tone, title, sub, date, badge, details }) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${tone}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="w-px flex-1 bg-slate-200" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          {badge}
        </div>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
        <p className="text-xs text-slate-400">{date}</p>
        {details}
      </div>
    </li>
  );
}

function buildTimeline(data, t) {
  const events = [];

  events.push({
    key: 'reg',
    icon: User,
    tone: 'bg-slate-500',
    title: t('Patient Registration'),
    sub: `${data.patient.id} · ${t(data.patient.gender)}`,
    date: t('Registered {{date}}', { date: formatDate(data.patient.registrationDate) }),
    dateSort: new Date(data.patient.registrationDate).getTime(),
  });

  data.visits.forEach((v) => {
    events.push({
      key: `v-${v.id}`,
      icon: CalendarDays,
      tone: 'bg-sky-500',
      title: t('Visit {{number}}', { number: v.visitNumber }),
      sub: `${t(v.service)} · ${v.reason || '—'}`,
      date: formatDateTime(v.date),
      dateSort: new Date(v.date).getTime(),
      badge: <StatusBadge status={v.status} />,
    });
  });

  data.consultations.forEach((c) => {
    events.push({
      key: `c-${c.id}`,
      icon: Stethoscope,
      tone: 'bg-brand-600',
      title: t('OPD Consultation {{number}}', { number: c.consultationNumber }),
      sub: c.diagnosis
        ? t('Diagnosis: {{value}}', { value: c.diagnosis })
        : c.chiefComplaint || t('Doctor: {{value}}', { value: c.doctor }),
      date: formatDateTime(c.date),
      dateSort: new Date(c.date).getTime(),
      badge: <StatusBadge status={c.status === 'completed' ? 'completed' : 'in_progress'} />,
    });
  });

  data.laboratory.forEach((l) => {
    events.push({
      key: `l-${l.id}`,
      icon: FlaskConical,
      tone: 'bg-amber-500',
      title: t('Lab Request {{number}}', { number: l.requestNumber }),
      sub: `${l.tests.map((tt) => t(tt.name)).join(', ')}`,
      date: formatDateTime(l.date),
      dateSort: new Date(l.date).getTime(),
      badge: <StatusBadge status={l.result?.status || l.status} />,
      details: l.result && l.result.results.length > 0 ? (
        <div className="mt-2">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full min-w-max text-xs">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="px-2.5 py-1.5 font-semibold">{t('Test')}</th>
                  <th className="px-2.5 py-1.5 font-semibold">{t('Result')}</th>
                  <th className="px-2.5 py-1.5 font-semibold">{t('Unit')}</th>
                  <th className="px-2.5 py-1.5 font-semibold">{t('Reference')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {l.result.results.map((r) => (
                  <tr key={r.testId}>
                    <td className="px-2.5 py-1.5">{t(r.testName)}</td>
                    <td className="px-2.5 py-1.5 font-semibold text-slate-800">{r.result || '—'}</td>
                    <td className="px-2.5 py-1.5 text-slate-500">{r.unit}</td>
                    <td className="px-2.5 py-1.5 text-slate-500">{r.referenceRange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 text-[11px] text-slate-400">
            <span>{t('Entered:')} {l.result.enteredBy || '—'}</span>
            <span>{t('Verified:')} {l.result.verifiedBy || '—'}</span>
          </div>
        </div>
      ) : null,
    });
  });

  data.procedures.forEach((p) => {
    events.push({
      key: `p-${p.id}`,
      icon: Syringe,
      tone: 'bg-rose-500',
      title: t('Procedure {{number}}', { number: p.procedureNumber }),
      sub: t(p.procedureType),
      date: formatDateTime(p.date),
      dateSort: new Date(p.date).getTime(),
      badge: <StatusBadge status={p.status} />,
    });
  });

  data.prescriptions.forEach((rx) => {
    events.push({
      key: `rx-${rx.id}`,
      icon: Pill,
      tone: 'bg-violet-500',
      title: t('Prescription {{number}}', { number: rx.prescriptionNumber }),
      sub: t('{{count}} medicine(s) · {{list}}', {
        count: rx.medicines.length,
        list: rx.medicines.map((m) => m.medicine).join(', '),
      }),
      date: formatDateTime(rx.date),
      dateSort: new Date(rx.date).getTime(),
    });
  });

  return events.sort((a, b) => b.dateSort - a.dateSort);
}

export default function PatientProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'overview';
  const [tab, setTab] = useState(tabParam);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [visitModal, setVisitModal] = useState(false);
  const [printLab, setPrintLab] = useState(null);
  const [printRx, setPrintRx] = useState(null);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  const load = () => {
    setError(null);
    patientService
      .history(id)
      .then((d) => {
        setData(d);
        if (searchParams.get('registered')) setTab('overview');
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const timeline = useMemo(() => (data ? buildTimeline(data, t) : []), [data, t]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <SkeletonProfile />;

  const { patient, visits, consultations, laboratory, procedures, prescriptions, activeVisit, activeQueue, visitCount } = data;

  const tabCounts = {
    visits: visits.length,
    opd: consultations.length,
    laboratory: laboratory.length,
    procedures: procedures.length,
    prescriptions: prescriptions.length,
  };

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t('Back')}
      </button>

      <PageHeader
        title={t('Patient Profile')}
        subtitle={t('Central patient record — all clinic activity connected through this patient')}
        icon={User}
        actions={
          <>
            {printLab && <LabResultPrint request={printLab.request} result={printLab.result} onClose={() => setPrintLab(null)} />}
            {printRx && <PrescriptionPrint prescription={printRx} onClose={() => setPrintRx(null)} />}
            <button className="btn-secondary" onClick={() => navigate(`/patients/${patient.id}/history`)} disabled>
              <History className="h-4 w-4" /> {t('History')}
            </button>
            <button className="btn-primary" onClick={() => setVisitModal(true)}>
              <CalendarPlus className="h-4 w-4" /> {t('Create Visit')}
            </button>
          </>
        }
      />

      <PatientHeader patient={patient} />

      <CreateVisitModal open={visitModal} onClose={() => setVisitModal(false)} patient={patient} onCreated={() => load()} />

      <div className="mt-6">
        <Tabs
          tabs={PROFILE_TABS.map((pt) => ({ ...pt, label: t(pt.label), count: tabCounts[pt.key] }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-5">
        {tab === 'overview' && (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-1">
              <Card>
                <CardHeader title={t('Patient Information')} icon={User} />
                <div className="px-5 py-2">
                  <InfoRow label={t('Patient ID')} value={patient.id} />
                  <InfoRow label={t('Name')} value={patient.fullName} />
                  <InfoRow label={t('Gender')} value={t(patient.gender)} />
                  <InfoRow label={t('Age')} value={patient.age !== null && patient.age !== undefined ? `${patient.age} ${t('yrs')}` : '—'} />
                  <InfoRow label={t('Phone')} value={patient.phone} />
                  <InfoRow label={t('Address')} value={patient.address} />
                  <InfoRow label={t('Registered')} value={formatDate(patient.registrationDate)} />
                </div>
              </Card>

              {patient.emergencyContactName || patient.emergencyContactPhone || patient.relationshipToPatient ? (
                <Card>
                  <CardHeader title={t('Emergency Contact')} icon={Phone} />
                  <div className="px-5 py-2">
                    <InfoRow label={t('Contact Name')} value={patient.emergencyContactName} />
                    <InfoRow label={t('Contact Phone')} value={patient.emergencyContactPhone} />
                    <InfoRow label={t('Relationship')} value={patient.relationshipToPatient} />
                  </div>
                </Card>
              ) : null}

              {patient.allergies?.length ? (
                <Card>
                  <CardHeader
                    title={t('Allergies')}
                    icon={AlertTriangle}
                    subtitle={t('{{count}} recorded', { count: patient.allergies.length })}
                  />
                  <div className="space-y-2 px-5 py-3">
                    {patient.allergies.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 p-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                          <p className="text-xs text-slate-500">
                            {t(a.category)} {t('allergy')}{a.reaction ? ` · ${a.reaction}` : ''}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.Mild}`}
                        >
                          {t(a.severity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              <Card>
                <CardHeader title={t('Current Status')} icon={ClipboardList} />
                <div className="px-5 py-4">
                  {activeVisit ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{t('Current visit')}</span>
                        <span className="text-sm font-semibold text-slate-800">{activeVisit.visitNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{t('Service')}</span>
                        <span className="text-sm font-medium text-slate-700">{t(activeVisit.service)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{t('Queue')}</span>
                        {activeQueue ? (
                          <StatusBadge status={activeQueue.status} />
                        ) : (
                          <span className="text-sm text-slate-400">{t('Not in queue')}</span>
                        )}
                      </div>
                      <Link
                        to={`/opd/consultation/${activeVisit.id}`}
                        className="btn-primary w-full"
                      >
                        <Stethoscope className="h-4 w-4" /> {t('Open in OPD')}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <p className="text-sm text-slate-500">
                        {visitCount > 0 ? t('All previous visits completed. No active visit.') : t('This patient has no visits yet.')}
                      </p>
                      <button className="btn-secondary mt-1" onClick={() => setVisitModal(true)}>
                        <CalendarPlus className="h-4 w-4" /> {t('Create Visit')}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-2">
              <CardHeader
                title={t('Patient Journey')}
                subtitle={t('Everything that has happened to this patient across all departments')}
                icon={Activity}
              />
              {timeline.length === 0 ? (
                <EmptyState
                  title={t('No activity yet')}
                  description={t("Register a visit to start this patient's journey through the clinic.")}
                  action={
                    <button className="btn-primary" onClick={() => setVisitModal(true)}>
                      <CalendarPlus className="h-4 w-4" /> {t('Create First Visit')}
                    </button>
                  }
                />
              ) : (
                <ul className="px-6 py-6">
                  {timeline.map(({ key, ...e }) => (
                    <TimelineEvent key={key} {...e} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {tab === 'visits' && (
          <Card>
            <CardHeader title={t('Visit History')} subtitle={t('{{count}} visit(s)', { count: visits.length })} icon={CalendarDays} />
            {visits.length === 0 ? (
              <EmptyState
                title={t('No visits yet')}
                description={t('Create a visit to register this patient for a service.')}
                action={
                  <button className="btn-primary" onClick={() => setVisitModal(true)}>
                    <CalendarPlus className="h-4 w-4" /> {t('Create Visit')}
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="th">{t('Visit Number')}</th>
                      <th className="th">{t('Date')}</th>
                      <th className="th">{t('Service')}</th>
                      <th className="th">{t('Reason')}</th>
                      <th className="th">{t('Status')}</th>
                      <th className="th" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visits.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                        <td className="td font-semibold text-brand-700">{v.visitNumber}</td>
                        <td className="td">{formatDateTime(v.date)}</td>
                        <td className="td">{t(v.service)}</td>
                        <td className="td">{v.reason || '—'}</td>
                        <td className="td">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="td text-right">
                          <Link to={`/visits/${v.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                            {t('Open')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === 'opd' && (
          <Card>
            <CardHeader title={t('OPD History')} subtitle={t('Consultations, diagnosis, treatment and notes')} icon={Stethoscope} />
            {consultations.length === 0 ? (
              <EmptyState title={t('No OPD consultations yet')} description={t('OPD consultations will appear here once the patient is seen by a doctor.')} />
            ) : (
              <div className="space-y-4 p-5">
                {consultations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{c.consultationNumber}</span>
                        <StatusBadge status={c.status === 'completed' ? 'completed' : 'in_progress'} />
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(c.date)} · {c.doctor}</span>
                    </div>
                    <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div><span className="text-slate-500">{t('Chief complaint: ') }</span>{c.chiefComplaint || '—'}</div>
                      <div><span className="text-slate-500">{t('Diagnosis: ') }</span><span className="font-medium">{c.diagnosis || '—'}</span></div>
                      <div><span className="text-slate-500">{t('Treatment: ') }</span>{c.treatmentRecommendation || '—'}</div>
                      <div><span className="text-slate-500">{t('Follow-up: ') }</span>{c.followUp || '—'}</div>
                      {c.doctorNotes && <div className="sm:col-span-2"><span className="text-slate-500">{t('Notes: ') }</span>{c.doctorNotes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'laboratory' && (
          <Card>
            <CardHeader title={t('Laboratory History')} subtitle={t('Requests, results and dates')} icon={FlaskConical} />
            {laboratory.length === 0 ? (
              <EmptyState title={t('No laboratory tests yet')} description={t('Laboratory requests will appear here once a doctor requests tests.')} />
            ) : (
              <div className="space-y-4 p-5">
                {laboratory.map((l) => (
                  <div key={l.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{l.requestNumber}</span>
                        <StatusBadge status={l.result?.status || l.status} />
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(l.date)} · {l.requestingDoctor}</span>
                    </div>
                    {l.result && l.result.results.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                              <th className="py-1 pr-4 font-semibold">{t('Test')}</th>
                              <th className="py-1 pr-4 font-semibold">{t('Result')}</th>
                              <th className="py-1 pr-4 font-semibold">{t('Unit')}</th>
                              <th className="py-1 pr-4 font-semibold">{t('Reference')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {l.result.results.map((r) => (
                              <tr key={r.testId}>
                                <td className="py-1.5 pr-4">{t(r.testName)}</td>
                                <td className="py-1.5 pr-4 font-semibold text-slate-800">{r.result || '—'}</td>
                                <td className="py-1.5 pr-4 text-slate-500">{r.unit}</td>
                                <td className="py-1.5 pr-4 text-slate-500">{r.referenceRange}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">{t('Tests:')} {l.tests.map((lt) => t(lt.name)).join(', ')}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-400">
                        {t('Entered:')} {l.result?.enteredBy || '—'} · {t('Verified:')} {l.result?.verifiedBy || '—'}
                      </p>
                      {l.result && (l.result.status === 'verified' || l.result.status === 'completed') && (
                        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setPrintLab({ request: l, result: l.result })}>
                          <Printer className="h-3.5 w-3.5" /> {t('Print Result')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'procedures' && (
          <Card>
            <CardHeader title={t('Procedure History')} subtitle={t('Procedures, injections, staff and dates')} icon={Syringe} />
            {procedures.length === 0 ? (
              <EmptyState title={t('No procedures yet')} description={t('Procedure and injection requests will appear here once ordered by a doctor.')} />
            ) : (
              <div className="space-y-4 p-5">
                {procedures.map((p) => (
                  <div key={p.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{p.procedureNumber}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(p.date)}</span>
                    </div>
                    <p className="text-sm text-slate-700"><span className="text-slate-500">{t('Procedure: ') }</span>{t(p.procedureType)}</p>
                    {p.recording && (
                      <div className="mt-2 grid gap-x-6 gap-y-1 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
                        <div><span className="text-slate-500">{t('Medicine: ') }</span>{p.recording.medicine || '—'}</div>
                        <div><span className="text-slate-500">{t('Dosage: ') }</span>{p.recording.dosage || '—'}</div>
                        <div><span className="text-slate-500">{t('Staff: ') }</span>{p.recording.responsibleStaff || '—'}</div>
                        <div><span className="text-slate-500">{t('Time: ') }</span>{p.recording.time || '—'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'prescriptions' && (
          <Card>
            <CardHeader title={t('Prescription History')} subtitle={t('Medicines, dosage, frequency and doctor')} icon={Pill} />
            {prescriptions.length === 0 ? (
              <EmptyState title={t('No prescriptions yet')} description={t('Prescriptions will appear here once created by a doctor.')} />
            ) : (
              <div className="space-y-4 p-5">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{rx.prescriptionNumber}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{formatDateTime(rx.date)} · {rx.doctor}</span>
                        <button className="btn-secondary !px-2.5 !py-1 text-xs" onClick={() => setPrintRx(rx)}>
                          <Eye className="h-3.5 w-3.5" /> {t('Preview')}
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                            <th className="py-1 pr-4 font-semibold">{t('Medicine')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Dosage')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Frequency')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Duration')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Route')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rx.medicines.map((m, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-4 font-medium text-slate-800">{m.medicine}</td>
                              <td className="py-1.5 pr-4">{m.dosage || '—'}</td>
                              <td className="py-1.5 pr-4">{m.frequency || '—'}</td>
                              <td className="py-1.5 pr-4">{m.duration || '—'}</td>
                              <td className="py-1.5 pr-4">{m.route || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
