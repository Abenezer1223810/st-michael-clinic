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
  Clock,
  BadgeCheck,
  FileText,
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
import { SickLeavePrint } from '../../components/print/SickLeavePrint';
import { TreatmentTimeline } from '../../components/timeline/TreatmentTimeline';
import { useToast } from '../../context/ToastContext';

const PROFILE_TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'timeline', label: 'Treatment Timeline', icon: Clock },
  { key: 'visits', label: 'Visits', icon: CalendarDays },
  { key: 'opd', label: 'OPD', icon: Stethoscope },
  { key: 'laboratory', label: 'Laboratory', icon: FlaskConical },
  { key: 'procedures', label: 'Injections & Procedures', icon: Syringe },
  { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { key: 'sickLeave', label: 'Sick Leave', icon: FileText },
];

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800 dark:text-slate-200">{value || '—'}</span>
    </div>
  );
}

const SEVERITY_STYLES = {
  Mild: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300',
  Moderate: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300',
  Severe: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/50 dark:text-orange-300',
  'Life-threatening': 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300',
};

function cardStatus(expiryDate) {
  if (!expiryDate) return { expired: false, date: '', cls: 'text-slate-400' };
  const exp = new Date(expiryDate);
  const expired = exp.getTime() < Date.now();
  const dd = String(exp.getDate()).padStart(2, '0');
  const mm = String(exp.getMonth() + 1).padStart(2, '0');
  const yyyy = exp.getFullYear();
  return {
    expired,
    date: `${dd}-${mm}-${yyyy}`,
    cls: expired ? 'text-rose-600 font-semibold' : 'text-emerald-600',
  };
}

export default function PatientProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'overview';
  const [tab, setTab] = useState(tabParam);
  const [data, setData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState(null);
  const [visitModal, setVisitModal] = useState(false);
  const [printLab, setPrintLab] = useState(null);
  const [printRx, setPrintRx] = useState(null);
  const [printSL, setPrintSL] = useState(null);
  const [renewing, setRenewing] = useState(false);
  const [confirmRenew, setConfirmRenew] = useState(false);

  const handleRenewCard = async () => {
    setRenewing(true);
    try {
      const { message } = await patientService.renewCard(id);
      toast.success(message || t('Patient card renewed.'));
      setConfirmRenew(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRenewing(false);
    }
  };

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

    setLoadingTimeline(true);
    patientService
      .timeline(id)
      .then((res) => setTimelineData(res.events || []))
      .catch(() => setTimelineData([]))
      .finally(() => setLoadingTimeline(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <SkeletonProfile />;

  const { patient, visits, consultations, laboratory, procedures, prescriptions, injections = [], sickLeaves = [], activeVisit, activeQueue, visitCount } = data;

  const tabCounts = {
    timeline: timelineData.length,
    visits: visits.length,
    opd: consultations.length,
    laboratory: laboratory.length,
    procedures: procedures.length + (injections?.length || 0),
    prescriptions: prescriptions.length,
    sickLeave: sickLeaves.length,
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> {t('Back')}
      </button>

      <PageHeader
        title={t('Patient Clinical Record')}
        subtitle={t('Comprehensive medical record with lifetime treatment timeline & department history')}
        icon={User}
        actions={
          <div className="flex items-center gap-2">
            {printLab && <LabResultPrint request={printLab.request} result={printLab.result} onClose={() => setPrintLab(null)} />}
            {printRx && <PrescriptionPrint prescription={printRx} onClose={() => setPrintRx(null)} />}
            {printSL && <SickLeavePrint sickLeave={printSL} onClose={() => setPrintSL(null)} />}
            <button className="btn-primary" onClick={() => setVisitModal(true)}>
              <CalendarPlus className="h-4 w-4" /> {t('Create Visit')}
            </button>
          </div>
        }
      />

      <PatientHeader patient={patient} />

      <CreateVisitModal open={visitModal} onClose={() => setVisitModal(false)} patient={patient} onCreated={() => load()} />

      <ConfirmDialog
        open={confirmRenew}
        onClose={() => setConfirmRenew(false)}
        onConfirm={handleRenewCard}
        title={t('Renew Patient Card?')}
        message={t('Renewing will extend the patient card validity by one year from today.')}
        confirmText={t('Yes, Renew Card')}
        tone="brand"
        loading={renewing}
      />

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
                  <InfoRow label={t('Sub City')} value={patient.subCity} />
                  <InfoRow label={t('Woreda')} value={patient.woreda} />
                  <InfoRow label={t('Registered')} value={formatDate(patient.registrationDate)} />
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <BadgeCheck className="h-4 w-4 text-brand-500" />
                      {t('Card Expiry')}
                    </span>
                    <span className={`text-right font-medium dark:text-slate-200 ${cardStatus(patient.cardExpiryDate).cls}`}>
                      {patient.cardExpiryDate
                        ? `${cardStatus(patient.cardExpiryDate).expired ? t('Card Expired') + ' · ' : t('Card Valid Until')} ${cardStatus(patient.cardExpiryDate).date}`
                        : '—'}
                    </span>
                  </div>
                  <button
                    className="btn-secondary mt-3 w-full justify-center !py-1.5 text-xs"
                    onClick={() => setConfirmRenew(true)}
                  >
                    <BadgeCheck className="h-3.5 w-3.5" /> {t('Renew Card')}
                  </button>
                  {cardStatus(patient.cardExpiryDate).expired && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {t('Card expired — payment required for renewal.')}
                    </p>
                  )}
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
                    title={t('Allergies & Sensitivities')}
                    icon={AlertTriangle}
                    subtitle={t('{{count}} recorded', { count: patient.allergies.length })}
                  />
                  <div className="space-y-2 px-5 py-3">
                    {patient.allergies.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/30"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.name}</p>
                          <p className="text-xs text-slate-500">
                            {t(a.category)} {t('allergy')}{a.reaction ? ` · ${a.reaction}` : ''}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.Mild}`}
                        >
                          {t(a.severity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              <Card>
                <CardHeader title={t('Current Visit Status')} icon={ClipboardList} />
                <div className="px-5 py-4">
                  {activeVisit ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{t('Current visit')}</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activeVisit.visitNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{t('Service')}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t(activeVisit.service)}</span>
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
                        className="btn-primary w-full justify-center"
                      >
                        <Stethoscope className="h-4 w-4" /> {t('Open in Doctor OPD')}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <p className="text-sm text-slate-500">
                        {visitCount > 0 ? t('All previous visits completed. No active encounter.') : t('This patient has no visits yet.')}
                      </p>
                      <button className="btn-secondary mt-1" onClick={() => setVisitModal(true)}>
                        <CalendarPlus className="h-4 w-4" /> {t('Create Encounter')}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-2">
              <CardHeader
                title={t('Recent Treatment Activity')}
                subtitle={t('Chronological multi-disciplinary timeline of clinical encounters, tests, and medications')}
                icon={Activity}
              />
              <div className="p-5">
                <TreatmentTimeline events={timelineData} loading={loadingTimeline} />
              </div>
            </Card>
          </div>
        )}

        {tab === 'timeline' && (
          <Card>
            <CardHeader
              title={t('Unified Lifetime Treatment Timeline')}
              subtitle={t('Complete chronological stream of registration, visits, vitals, consultations, lab results, payments, injections, procedures, and pharmacy dispensations')}
              icon={Clock}
            />
            <div className="p-6">
              <TreatmentTimeline events={timelineData} loading={loadingTimeline} />
            </div>
          </Card>
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
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                      <th className="th">{t('Visit Number')}</th>
                      <th className="th">{t('Date')}</th>
                      <th className="th">{t('Service')}</th>
                      <th className="th">{t('Reason')}</th>
                      <th className="th">{t('Status')}</th>
                      <th className="th" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visits.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                        <td className="td font-semibold text-brand-700 dark:text-brand-400">{v.visitNumber}</td>
                        <td className="td">{formatDateTime(v.date)}</td>
                        <td className="td">{t(v.service)}</td>
                        <td className="td">{v.reason || '—'}</td>
                        <td className="td">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="td text-right">
                          <Link to={`/visits/${v.id}`} className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">
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
            <CardHeader title={t('OPD Consultations & Clinical Diagnoses')} subtitle={t('Clinical assessments, vitals, findings and prescriptions')} icon={Stethoscope} />
            {consultations.length === 0 ? (
              <EmptyState title={t('No OPD consultations yet')} description={t('OPD consultations will appear here once the patient is seen by a doctor.')} />
            ) : (
              <div className="space-y-4 p-5">
                {consultations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.consultationNumber}</span>
                        <StatusBadge status={c.status === 'completed' ? 'completed' : 'in_progress'} />
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(c.date)} · {c.doctor}</span>
                    </div>
                    <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div><span className="text-slate-500">{t('Chief complaint: ') }</span>{c.chiefComplaint || '—'}</div>
                      <div><span className="text-slate-500">{t('Diagnosis: ') }</span><span className="font-bold text-slate-900 dark:text-slate-100">{c.diagnosis || '—'}</span></div>
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
            <CardHeader title={t('Laboratory Diagnostic Results')} subtitle={t('Test requests, analyzer observations, flags and releases')} icon={FlaskConical} />
            {laboratory.length === 0 ? (
              <EmptyState title={t('No laboratory tests yet')} description={t('Laboratory requests will appear here once a doctor requests tests.')} />
            ) : (
              <div className="space-y-4 p-5">
                {laboratory.map((l) => (
                  <div key={l.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{l.requestNumber}</span>
                        <StatusBadge status={l.result?.status || l.status} />
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(l.date)} · {l.requestingDoctor}</span>
                    </div>
                    {l.result && l.result.results?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700">
                              <th className="py-1 pr-4 font-semibold">{t('Test')}</th>
                              <th className="py-1 pr-4 font-semibold">{t('Result')}</th>
                              <th className="py-1 pr-4 font-semibold">{t('Unit')}</th>
                              <th className="py-1 pr-4 font-semibold">{t('Reference Range')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {l.result.results.map((r) => (
                              <tr key={r.testId}>
                                <td className="py-1.5 pr-4 font-medium">{t(r.testName)}</td>
                                <td className="py-1.5 pr-4 font-bold text-slate-900 dark:text-slate-100">{r.result || '—'}</td>
                                <td className="py-1.5 pr-4 text-slate-500">{r.unit}</td>
                                <td className="py-1.5 pr-4 text-slate-500">{r.referenceRange}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">{t('Tests:')} {l.tests?.map((lt) => t(lt.name)).join(', ')}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-400">
                        {t('Entered:')} {l.result?.enteredBy || '—'} · {t('Verified:')} {l.result?.verifiedBy || '—'}
                      </p>
                      {l.result && (l.result.status === 'TECHNICIAN_VERIFIED' || l.result.status === 'RELEASED_TO_DOCTOR' || l.result.status === 'verified') && (
                        <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setPrintLab({ request: l, result: l.result })}>
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
          <div className="space-y-5">
            {/* Injections List */}
            <Card>
              <CardHeader title={t('Injections History')} subtitle={t('Doctor injection prescriptions & nurse administration records')} icon={Syringe} />
              {injections.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">{t('No injections ordered for this patient.')}</div>
              ) : (
                <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
                  {injections.map((inj) => (
                    <div key={inj.id} className="py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400">{inj.orderNumber}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{inj.medication}</span>
                          <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                            {inj.prescribedDose} ({inj.route})
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{inj.status}</span>
                      </div>
                      {inj.administrations?.[0] && (
                        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                          <p>
                            <span className="font-semibold">{t('Administered at')}:</span> {inj.administrations[0].administrationSite} · <span className="font-semibold">{t('By')}:</span> {inj.administrations[0].administeredBy} · {formatDateTime(inj.administrations[0].administeredAt)}
                          </p>
                          {inj.administrations[0].notes && <p className="mt-0.5 italic text-slate-500">"{inj.administrations[0].notes}"</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Procedures List */}
            <Card>
              <CardHeader title={t('Clinical Procedures & Wound Care')} subtitle={t('Dressings, minor surgeries and executed procedures')} icon={Scissors} />
              {procedures.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">{t('No procedures recorded for this patient.')}</div>
              ) : (
                <div className="space-y-4 p-5">
                  {procedures.map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.procedureNumber}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <span className="text-xs text-slate-400">{formatDateTime(p.date)}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500">{t('Procedure: ') }</span>{t(p.procedureType)}</p>
                      {p.recording && (
                        <div className="mt-2 grid gap-x-6 gap-y-1 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50 sm:grid-cols-2">
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
          </div>
        )}

        {tab === 'prescriptions' && (
          <Card>
            <CardHeader title={t('Prescription & Dispensing Records')} subtitle={t('Prescribed medicines, quantities, dispensing status and counselor notes')} icon={Pill} />
            {prescriptions.length === 0 ? (
              <EmptyState title={t('No prescriptions yet')} description={t('Prescriptions will appear here once created by a doctor.')} />
            ) : (
              <div className="space-y-4 p-5">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rx.prescriptionNumber}</span>
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
                          {t(rx.status || 'PRESCRIBED')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{formatDateTime(rx.date)} · {rx.doctor}</span>
                        <button className="btn-secondary !px-2.5 !py-1 text-xs" onClick={() => setPrintRx(rx)}>
                          <Eye className="h-3.5 w-3.5" /> {t('Preview & Print')}
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700">
                            <th className="py-1 pr-4 font-semibold">{t('Medicine')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Dose')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Frequency')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Duration')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Route')}</th>
                            <th className="py-1 pr-4 font-semibold">{t('Qty')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {rx.medicines?.map((m, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-4 font-medium text-slate-800 dark:text-slate-200">{m.medicine}</td>
                              <td className="py-1.5 pr-4">{m.dose || m.dosage || '—'}</td>
                              <td className="py-1.5 pr-4">{m.frequency || '—'}</td>
                              <td className="py-1.5 pr-4">{m.duration || '—'}</td>
                              <td className="py-1.5 pr-4">{m.route || '—'}</td>
                              <td className="py-1.5 pr-4 font-bold">{m.quantity || 1}</td>
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

        {tab === 'sickLeave' && (
          <Card>
            <CardHeader title={t('Sick Leave Certificates')} subtitle={t('Medical certificates excusing the patient from work or school')} icon={FileText} />
            {sickLeaves.length === 0 ? (
              <EmptyState title={t('No sick leave certificates yet')} description={t('Sick leave certificates issued by a doctor will appear here.')} />
            ) : (
              <div className="space-y-3 p-5">
                {sickLeaves.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.certificateNumber}</span>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          {s.numberOfDays} {t('day(s)')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {s.diagnosis || '—'} · {formatDate(s.fromDate)} → {formatDate(s.toDate)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(s.date)} · {t('Dr.')} {s.doctor}</p>
                    </div>
                    <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setPrintSL(s)}>
                      <Eye className="h-3.5 w-3.5" /> {t('Print Certificate')}
                    </button>
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
