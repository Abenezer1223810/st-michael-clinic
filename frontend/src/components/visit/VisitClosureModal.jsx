import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  Printer,
  FileCheck,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { visitService } from '../../services/visitService';
import { useToast } from '../../context/ToastContext';
import { VisitSummaryPrint } from '../print/VisitSummaryPrint';

export function VisitClosureModal({ visitId, open, onClose, onClosed }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [check, setCheck] = useState(null);
  const [error, setError] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [closing, setClosing] = useState(false);
  const [closedSummary, setClosedSummary] = useState(null);
  const [printSummary, setPrintSummary] = useState(false);

  useEffect(() => {
    if (!open || !visitId) return;
    setLoading(true);
    setError(null);
    setCheck(null);
    setOverrideReason('');
    setClosureNotes('');
    setClosedSummary(null);

    visitService
      .getClosureCheck(visitId)
      .then((data) => setCheck(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, visitId]);

  if (!open) return null;

  const handleCloseVisitSubmit = async (e) => {
    e.preventDefault();
    if (!check?.canClose && !overrideReason.trim()) {
      toast.error(t('Please provide an authorized override reason to close this visit with pending items.'));
      return;
    }

    setClosing(true);
    try {
      const res = await visitService.close(visitId, {
        overrideReason: overrideReason.trim(),
        notes: closureNotes.trim(),
      });
      toast.success(t(res.message || 'Visit closed successfully.'));
      const summary = await visitService.getSummary(visitId);
      setClosedSummary(summary);
      if (onClosed) onClosed(summary);
    } catch (err) {
      toast.error(err.message || t('Visit closure failed.'));
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('Visit Encounter Closure & Discharge')}
                </h3>
                <p className="text-xs text-slate-500">
                  {check?.visit?.visitNumber ? `#${check.visit.visitNumber} · ${check.visit.patientName}` : t('Pre-closure safety verification')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <Clock className="mx-auto mb-2 h-6 w-6 animate-spin text-brand-600" />
              {t('Verifying clinical orders, laboratory results, injections, and invoices…')}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              <p className="font-semibold">{t('Error loading visit status')}:</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : closedSummary ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('Visit Successfully Completed & Closed')}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {t('The patient encounter has been finalized, all orders audited, and lifetime medical timeline updated.')}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-3">
                <button className="btn-secondary" onClick={onClose}>
                  {t('Done')}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setPrintSummary(true);
                  }}
                >
                  <Printer className="h-4 w-4" /> {t('Print Visit Summary')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCloseVisitSubmit} className="space-y-4">
              {/* Safety Checklist Status */}
              {check?.canClose ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold">{t('Encounter Ready for Closure')}</p>
                    <p className="mt-0.5 text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                      {t('All diagnostic lab results, clinical procedures, injections, and invoices have been completed and verified.')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-bold">{t('Visit Has Pending Clinical Orders or Unpaid Balance')}</p>
                      <p className="mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-400/80">
                        {t('The following items require completion before standard closure. If early discharge is clinically indicated, provide an authorized override reason.')}
                      </p>
                    </div>
                  </div>

                  {/* Blockers list */}
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/40">
                    {check.blockers.map((b, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{b.title}</p>
                          <p className="text-[11px] text-slate-500">{b.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings list if any */}
              {check?.warnings?.length > 0 && (
                <div className="divide-y divide-slate-100 rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                  {check.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-2 py-1">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <div>
                        <p className="font-semibold">{w.title}</p>
                        <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80">{w.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Override reason field if blocked */}
              {!check?.canClose && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400">
                    {t('Authorized Override Reason')} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder={t('e.g. Patient refused lab test and requested discharge. Medication orders deferred to follow-up.')}
                    rows={2}
                    className="input mt-1 border-rose-300 focus:border-rose-500"
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {t('Overriding will be permanently logged in the system security audit trail.')}
                  </p>
                </div>
              )}

              {/* General closure discharge notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('Discharge / Encounter Closure Notes')}
                </label>
                <input
                  type="text"
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder={t('e.g. Patient improved, given discharge instructions and scheduled follow-up.')}
                  className="input mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={closing}>
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className={`btn-primary ${!check?.canClose ? '!bg-amber-600 hover:!bg-amber-700' : ''}`}
                  disabled={closing || (!check?.canClose && !overrideReason.trim())}
                >
                  {closing ? t('Closing Encounter…') : check?.canClose ? t('Complete & Close Visit') : t('Override & Close Visit')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {printSummary && closedSummary && (
        <VisitSummaryPrint summary={closedSummary} onClose={() => setPrintSummary(false)} />
      )}
    </>
  );
}

