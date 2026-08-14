import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PatientHeader } from '../../components/PatientHeader';
import { CreateVisitModal } from '../../components/CreateVisitModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
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

function TimelineEvent({ icon: Icon, tone, title, sub, date, badge }) {
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
      </div>
    </li>
  );
}

function buildTimeline(data) {
  const events = [];

  events.push({
    key: 'reg',
    icon: User,
    tone: 'bg-slate-500',
    title: 'Patient Registration',
    sub: `${data.patient.id} · ${data.patient.gender}`,
    date: `Registered ${formatDate(data.patient.registrationDate)}`,
    dateSort: new Date(data.patient.registrationDate).getTime(),
  });

  data.visits.forEach((v) => {
    events.push({
      key: `v-${v.id}`,
      icon: CalendarDays,
      tone: 'bg-sky-500',
      title: `Visit ${v.visitNumber}`,
      sub: `${v.service} · ${v.reason || '—'}`,
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
      title: `OPD Consultation ${c.consultationNumber}`,
      sub: c.diagnosis ? `Diagnosis: ${c.diagnosis}` : c.chiefComplaint || `Doctor: ${c.doctor}`,
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
      title: `Lab Request ${l.requestNumber}`,
      sub: `${l.tests.map((t) => t.name).join(', ')}`,
      date: formatDateTime(l.date),
      dateSort: new Date(l.date).getTime(),
      badge: <StatusBadge status={l.result?.status || l.status} />,
    });
  });

  data.procedures.forEach((p) => {
    events.push({
      key: `p-${p.id}`,
      icon: Syringe,
      tone: 'bg-rose-500',
      title: `Procedure ${p.procedureNumber}`,
      sub: p.procedureType,
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
      title: `Prescription ${rx.prescriptionNumber}`,
      sub: `${rx.medicines.length} medicine(s) · ${rx.medicines.map((m) => m.medicine).join(', ')}`,
      date: formatDateTime(rx.date),
      dateSort: new Date(rx.date).getTime(),
    });
  });

  return events.sort((a, b) => b.dateSort - a.dateSort);
}

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [visitModal, setVisitModal] = useState(false);
  const [printLab, setPrintLab] = useState(null);
  const [printRx, setPrintRx] = useState(null);

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

  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading patient profile…" />;

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
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <PageHeader
        title="Patient Profile"
        subtitle="Central patient record — all clinic activity connected through this patient"
        icon={User}
        actions={
          <>
            {printLab && <LabResultPrint request={printLab.request} result={printLab.result} onClose={() => setPrintLab(null)} />}
            {printRx && <PrescriptionPrint prescription={printRx} onClose={() => setPrintRx(null)} />}
            <button className="btn-secondary" onClick={() => navigate(`/patients/${patient.id}/history`)} disabled>
              <History className="h-4 w-4" /> History
            </button>
            <button className="btn-primary" onClick={() => setVisitModal(true)}>
              <CalendarPlus className="h-4 w-4" /> Create Visit
            </button>
          </>
        }
      />

      <PatientHeader patient={patient} />

      <CreateVisitModal open={visitModal} onClose={() => setVisitModal(false)} patient={patient} onCreated={() => load()} />

      <div className="mt-6">
        <Tabs
          tabs={PROFILE_TABS.map((t) => ({ ...t, count: tabCounts[t.key] }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-5">
        {tab === 'overview' && (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-1">
              <Card>
                <CardHeader title="Patient Information" icon={User} />
                <div className="px-5 py-2">
                  <InfoRow label="Patient ID" value={patient.id} />
                  <InfoRow label="Name" value={patient.fullName} />
                  <InfoRow label="Gender" value={patient.gender} />
                  <InfoRow label="Age" value={patient.age !== null && patient.age !== undefined ? `${patient.age} yrs` : '—'} />
                  <InfoRow label="Phone" value={patient.phone} />
                  <InfoRow label="Address" value={patient.address} />
                  <InfoRow label="Registered" value={formatDate(patient.registrationDate)} />
                </div>
              </Card>

              <Card>
                <CardHeader title="Current Status" icon={ClipboardList} />
                <div className="px-5 py-4">
                  {activeVisit ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Current visit</span>
                        <span className="text-sm font-semibold text-slate-800">{activeVisit.visitNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Service</span>
                        <span className="text-sm font-medium text-slate-700">{activeVisit.service}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Queue</span>
                        {activeQueue ? (
                          <StatusBadge status={activeQueue.status} />
                        ) : (
                          <span className="text-sm text-slate-400">Not in queue</span>
                        )}
                      </div>
                      <Link
                        to={`/opd/consultation/${activeVisit.id}`}
                        className="btn-primary w-full"
                      >
                        <Stethoscope className="h-4 w-4" /> Open in OPD
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <p className="text-sm text-slate-500">
                        {visitCount > 0 ? 'All previous visits completed. No active visit.' : 'This patient has no visits yet.'}
                      </p>
                      <button className="btn-secondary mt-1" onClick={() => setVisitModal(true)}>
                        <CalendarPlus className="h-4 w-4" /> Create Visit
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Patient Journey"
                subtitle="Everything that has happened to this patient across all departments"
                icon={Activity}
              />
              {timeline.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Register a visit to start this patient's journey through the clinic."
                  action={
                    <button className="btn-primary" onClick={() => setVisitModal(true)}>
                      <CalendarPlus className="h-4 w-4" /> Create First Visit
                    </button>
                  }
                />
              ) : (
                <ul className="px-6 py-6">
                  {timeline.map((e) => (
                    <TimelineEvent key={e.key} {...e} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {tab === 'visits' && (
          <Card>
            <CardHeader title="Visit History" subtitle={`${visits.length} visit(s)`} icon={CalendarDays} />
            {visits.length === 0 ? (
              <EmptyState
                title="No visits yet"
                description="Create a visit to register this patient for a service."
                action={
                  <button className="btn-primary" onClick={() => setVisitModal(true)}>
                    <CalendarPlus className="h-4 w-4" /> Create Visit
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="th">Visit Number</th>
                      <th className="th">Date</th>
                      <th className="th">Service</th>
                      <th className="th">Reason</th>
                      <th className="th">Status</th>
                      <th className="th" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visits.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60">
                        <td className="td font-semibold text-brand-700">{v.visitNumber}</td>
                        <td className="td">{formatDateTime(v.date)}</td>
                        <td className="td">{v.service}</td>
                        <td className="td">{v.reason || '—'}</td>
                        <td className="td">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="td text-right">
                          <Link to={`/visits/${v.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                            Open
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
            <CardHeader title="OPD History" subtitle="Consultations, diagnosis, treatment and notes" icon={Stethoscope} />
            {consultations.length === 0 ? (
              <EmptyState title="No OPD consultations yet" description="OPD consultations will appear here once the patient is seen by a doctor." />
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
                      <div><span className="text-slate-500">Chief complaint: </span>{c.chiefComplaint || '—'}</div>
                      <div><span className="text-slate-500">Diagnosis: </span><span className="font-medium">{c.diagnosis || '—'}</span></div>
                      <div><span className="text-slate-500">Treatment: </span>{c.treatmentRecommendation || '—'}</div>
                      <div><span className="text-slate-500">Follow-up: </span>{c.followUp || '—'}</div>
                      {c.doctorNotes && <div className="sm:col-span-2"><span className="text-slate-500">Notes: </span>{c.doctorNotes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'laboratory' && (
          <Card>
            <CardHeader title="Laboratory History" subtitle="Requests, results and dates" icon={FlaskConical} />
            {laboratory.length === 0 ? (
              <EmptyState title="No laboratory tests yet" description="Laboratory requests will appear here once a doctor requests tests." />
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
                              <th className="py-1 pr-4 font-semibold">Test</th>
                              <th className="py-1 pr-4 font-semibold">Result</th>
                              <th className="py-1 pr-4 font-semibold">Unit</th>
                              <th className="py-1 pr-4 font-semibold">Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {l.result.results.map((r) => (
                              <tr key={r.testId}>
                                <td className="py-1.5 pr-4">{r.testName}</td>
                                <td className="py-1.5 pr-4 font-semibold text-slate-800">{r.result || '—'}</td>
                                <td className="py-1.5 pr-4 text-slate-500">{r.unit}</td>
                                <td className="py-1.5 pr-4 text-slate-500">{r.referenceRange}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Tests: {l.tests.map((t) => t.name).join(', ')}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-400">
                        Entered: {l.result?.enteredBy || '—'} · Verified: {l.result?.verifiedBy || '—'}
                      </p>
                      {l.result && (l.result.status === 'verified' || l.result.status === 'completed') && (
                        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setPrintLab({ request: l, result: l.result })}>
                          <Printer className="h-3.5 w-3.5" /> Print Result
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
            <CardHeader title="Procedure History" subtitle="Procedures, injections, staff and dates" icon={Syringe} />
            {procedures.length === 0 ? (
              <EmptyState title="No procedures yet" description="Procedure and injection requests will appear here once ordered by a doctor." />
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
                    <p className="text-sm text-slate-700"><span className="text-slate-500">Procedure: </span>{p.procedureType}</p>
                    {p.recording && (
                      <div className="mt-2 grid gap-x-6 gap-y-1 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
                        <div><span className="text-slate-500">Medicine: </span>{p.recording.medicine || '—'}</div>
                        <div><span className="text-slate-500">Dosage: </span>{p.recording.dosage || '—'}</div>
                        <div><span className="text-slate-500">Staff: </span>{p.recording.responsibleStaff || '—'}</div>
                        <div><span className="text-slate-500">Time: </span>{p.recording.time || '—'}</div>
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
            <CardHeader title="Prescription History" subtitle="Medicines, dosage, frequency and doctor" icon={Pill} />
            {prescriptions.length === 0 ? (
              <EmptyState title="No prescriptions yet" description="Prescriptions will appear here once created by a doctor." />
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
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                            <th className="py-1 pr-4 font-semibold">Medicine</th>
                            <th className="py-1 pr-4 font-semibold">Dosage</th>
                            <th className="py-1 pr-4 font-semibold">Frequency</th>
                            <th className="py-1 pr-4 font-semibold">Duration</th>
                            <th className="py-1 pr-4 font-semibold">Route</th>
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
