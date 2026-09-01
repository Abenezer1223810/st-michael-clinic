import { useTranslation } from 'react-i18next';
import {
  Activity,
  CheckCircle,
  Clock,
  FlaskConical,
  HeartPulse,
  Pill,
  Scissors,
  Stethoscope,
  Syringe,
  CreditCard,
  FileText,
  User,
} from 'lucide-react';
import { formatDateTime } from '../../utils/format';

const ICON_MAP = {
  REGISTRATION: User,
  VISIT_CREATED: FileText,
  INVOICE_GENERATED: CreditCard,
  PAYMENT_RECEIVED: CreditCard,
  PAYMENT_VERIFIED: CheckCircle,
  TRIAGE_VITALS: HeartPulse,
  CONSULTATION: Stethoscope,
  LAB_ORDER: FlaskConical,
  SPECIMEN_COLLECTED: FlaskConical,
  LAB_RESULT_RECEIVED: FlaskConical,
  LAB_RESULT_VERIFIED: FlaskConical,
  LAB_RELEASED: CheckCircle,
  PRESCRIPTION_ORDER: Pill,
  PHARMACY_DISPENSED: Pill,
  INJECTION_ORDER: Syringe,
  INJECTION_ADMINISTERED: Syringe,
  PROCEDURE_ORDER: Scissors,
  PROCEDURE_PERFORMED: Scissors,
};

const COLOR_MAP = {
  REGISTRATION: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  VISIT_CREATED: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
  INVOICE_GENERATED: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
  PAYMENT_RECEIVED: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300',
  PAYMENT_VERIFIED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  TRIAGE_VITALS: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
  CONSULTATION: 'bg-brand-100 text-brand-700 border-brand-300 dark:bg-brand-950 dark:text-brand-300',
  LAB_ORDER: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
  SPECIMEN_COLLECTED: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
  LAB_RESULT_RECEIVED: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
  LAB_RESULT_VERIFIED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  LAB_RELEASED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  PRESCRIPTION_ORDER: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300',
  PHARMACY_DISPENSED: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300',
  INJECTION_ORDER: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300',
  INJECTION_ADMINISTERED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  PROCEDURE_ORDER: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
  PROCEDURE_PERFORMED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
};

export function TreatmentTimeline({ timeline = [], loading = false }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        <Clock className="mx-auto mb-2 h-6 w-6 animate-spin text-brand-600" />
        {t('Compiling chronological clinical treatment timeline…')}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
        <Activity className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
        {t('No clinical treatment events recorded for this patient yet.')}
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {timeline.map((event, index) => {
        const Icon = ICON_MAP[event.type] || Activity;
        const colorCls = COLOR_MAP[event.type] || 'bg-slate-100 text-slate-700 border-slate-300';

        return (
          <div key={event.id || index} className="relative group">
            {/* Dot / Icon Bubble */}
            <div
              className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm ${colorCls}`}
            >
              <Icon className="h-3 w-3" />
            </div>

            {/* Event Content Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t(event.title || event.type)}
                  </span>
                  {event.referenceId && (
                    <span className="font-mono text-[11px] font-bold text-brand-700 dark:text-brand-400">
                      #{event.referenceId}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(event.timestamp || event.createdAt)}
                </span>
              </div>

              {event.description && (
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {event.description}
                </p>
              )}

              {/* Extra Details Metadata */}
              {event.details && (
                <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  {typeof event.details === 'string' ? (
                    <p>{event.details}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Object.entries(event.details).map(([k, v]) => (
                        <div key={k}>
                          <span className="font-semibold text-slate-400">{t(k)}:</span>{' '}
                          <span className="font-medium text-slate-800 dark:text-slate-200">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {event.actor && (
                <div className="mt-2 flex items-center justify-end text-[10px] text-slate-400">
                  <span>{t('Logged by')}: <strong className="font-semibold text-slate-600 dark:text-slate-300">{event.actor}</strong></span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TreatmentTimeline;

