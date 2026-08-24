import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarDays,
  ListOrdered,
  Stethoscope,
  FlaskConical,
  Syringe,
  Pill,
  Printer,
} from 'lucide-react';
import { visitService } from '../../services/visitService';
import { queueService } from '../../services/queueService';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/format';
import { PatientVisitPrint } from '../../components/print/PatientVisitPrint';

export default function VisitDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const load = () => {
    setError(null);
    visitService
      .get(id)
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addToQueue = async () => {
    try {
      const { message } = await queueService.add(id);
      toast.success(message || t('Patient added to OPD queue.'));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <SkeletonDetail lines={6} />;

  const { visit, queueEntry, consultation, labRequests, procedures, prescriptions } = data;

  const summary = [
    { label: t('Visit Number'), value: visit.visitNumber, to: null },
    { label: t('Date & Time'), value: formatDateTime(visit.date), to: null },
    { label: t('Service'), value: t(visit.service), to: null },
    { label: t('Reason'), value: visit.reason || '—', to: null },
    { label: t('Status'), value: visit.status, to: null, badge: true },
  ];

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t('Back')}
      </button>

      <PageHeader
        title={t('Visit {{number}}', { number: visit.visitNumber })}
        subtitle={t('Visit details and related clinical activity')}
        icon={CalendarDays}
        actions={
          <>
            {printOpen && (
              <PatientVisitPrint visit={visit} patient={visit.patient} onClose={() => setPrintOpen(false)} />
            )}
            <button className="btn-secondary" onClick={() => setPrintOpen(true)}>
              <Printer className="h-4 w-4" /> {t('Print Info')}
            </button>
            {visit.status === 'active' && !queueEntry && (
              <button className="btn-primary" onClick={addToQueue}>
                <ListOrdered className="h-4 w-4" /> {t('Add to Queue')}
              </button>
            )}
            {visit.status === 'active' && (
              <Link to={`/opd/consultation/${visit.id}`} className="btn-primary">
                <Stethoscope className="h-4 w-4" /> {t('Open Consultation')}
              </Link>
            )}
          </>
        }
      />

      <PatientHeader patient={visit.patient} visitNumber={visit.visitNumber} />

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card>
            <CardHeader title={t('Visit Information')} icon={CalendarDays} />
            <div className="px-5 py-2">
              {summary.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
                  <span className="text-slate-500">{s.label}</span>
                  {s.badge ? (
                    <StatusBadge status={s.value} />
                  ) : (
                    <span className="text-right font-medium text-slate-800">{s.value}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('Queue')} icon={ListOrdered} />
            <div className="px-5 py-2">
              {queueEntry ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
                    <span className="text-slate-500">{t('Queue number')}</span>
                    <span className="text-lg font-bold text-brand-700">#{queueEntry.queueNumber}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
                    <span className="text-slate-500">{t('Service')}</span>
                    <span className="font-medium">{t(queueEntry.service)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-500">{t('Status')}</span>
                    <StatusBadge status={queueEntry.status} />
                  </div>
                </>
              ) : (
                <EmptyState
                  title={t('Not in queue')}
                  description={t('This patient has not been added to the queue.')}
                  action={
                    visit.status === 'active' ? (
                      <button className="btn-secondary" onClick={addToQueue}>
                        {t('Add to Queue')}
                      </button>
                    ) : null
                  }
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title={t('Consultation')} icon={Stethoscope} />
            {consultation ? (
              <div className="px-5 py-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">{consultation.consultationNumber}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={consultation.status === 'completed' ? 'completed' : 'in_progress'} />
                    <span className="text-xs text-slate-400">{consultation.doctor}</span>
                  </div>
                </div>
                <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div><span className="text-slate-500">{t('Diagnosis: ') }</span><span className="font-medium">{consultation.diagnosis || '—'}</span></div>
                  <div><span className="text-slate-500">{t('Treatment: ') }</span>{consultation.treatmentRecommendation || '—'}</div>
                </div>
              </div>
            ) : (
              <EmptyState
                title={t('No consultation yet')}
                description={t('Open this patient in OPD to start the consultation.')}
                action={
                  visit.status === 'active' ? (
                    <Link to={`/opd/consultation/${visit.id}`} className="btn-primary">
                      <Stethoscope className="h-4 w-4" /> {t('Start Consultation')}
                    </Link>
                  ) : null
                }
              />
            )}
          </Card>

          <div className="grid gap-5 sm:grid-cols-3">
            <Card>
              <CardHeader title={t('Laboratory')} subtitle={t('{{count}} request(s)', { count: labRequests.length })} icon={FlaskConical} />
              <div className="px-5 py-2">
                {labRequests.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">{t('No lab requests')}</p>
                ) : (
                  labRequests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                      <Link to={`/laboratory/requests/${r.id}`} className="font-medium text-brand-700 hover:underline">
                        {r.requestNumber}
                      </Link>
                      <StatusBadge status={r.status} />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title={t('Procedures')} subtitle={t('{{count}} request(s)', { count: procedures.length })} icon={Syringe} />
              <div className="px-5 py-2">
                {procedures.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">{t('No procedures')}</p>
                ) : (
                  procedures.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                      <Link to={`/procedures/${p.id}`} className="font-medium text-brand-700 hover:underline">
                        {p.procedureNumber}
                      </Link>
                      <StatusBadge status={p.status} />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title={t('Prescriptions')} subtitle={t('{{count}} record(s)', { count: prescriptions.length })} icon={Pill} />
              <div className="px-5 py-2">
                {prescriptions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">{t('No prescriptions')}</p>
                ) : (
                  prescriptions.map((rx) => (
                    <div key={rx.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                      <Link to={`/prescriptions/${rx.id}`} className="font-medium text-brand-700 hover:underline">
                        {rx.prescriptionNumber}
                      </Link>
                      <span className="text-xs text-slate-400">{t('{{count}} item(s)', { count: rx.medicines.length })}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
