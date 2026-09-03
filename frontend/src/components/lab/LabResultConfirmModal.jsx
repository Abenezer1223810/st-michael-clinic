import { useState } from 'react';
import { FlaskConical, Send, User, ClipboardList, Stethoscope, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { Modal } from '../ui/Modal';

/**
 * LabResultConfirmModal
 * Shown when the laboratorist clicks "Release to Doctor".
 */
export function LabResultConfirmModal({ open, onClose, onConfirm, releasing, request, result }) {
  const [notes, setNotes] = useState('');

  if (!request) return null;

  const testCount = result?.results?.length ?? request?.tests?.length ?? 0;
  const abnormalCount =
    result?.results?.filter((r) => r.flag === 'HIGH' || r.flag === 'LOW' || r.flag === 'CRITICAL' || r.flag === 'ABNORMAL')
      .length ?? 0;
  const doctor = request.requestingDoctor || 'Dr. Dawit Alemu';

  const handleConfirm = () => {
    onConfirm?.(notes);
  };

  return (
    <Modal
      open={open}
      onClose={releasing ? undefined : onClose}
      title="Transmit Diagnostic Results to Doctor"
      subtitle="Verify patient details and confirm diagnostic observations before releasing to doctor."
      size="md"
    >
      <div className="space-y-4">
        {/* Patient & Doctor Routing Summary */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</p>
                <p className="font-bold text-slate-800 dark:text-white">{request.patientName}</p>
                <p className="text-[11px] text-slate-500 font-mono">{request.patientId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ordering Doctor</p>
                <p className="font-bold text-slate-800 dark:text-white">{doctor}</p>
                <p className="text-[11px] text-slate-500">OPD Consultation</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <FlaskConical className="h-4 w-4 text-brand-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {testCount} Diagnostic Parameter{testCount !== 1 ? 's' : ''} Analyzed
                </span>
              </div>
              {abnormalCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <AlertTriangle className="h-3 w-3" /> {abnormalCount} Abnormal Flag{abnormalCount !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> All Parameters Normal
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Technician's Note to Doctor */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <MessageSquare className="h-3.5 w-3.5 text-brand-600" />
            Technician's Clinical Interpretation / Note to Doctor (Optional):
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Specimen analyzed twice on Mindray analyzer. Mild hemolysis noted. Follow-up recommended if clinical symptoms persist."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="rounded-xl bg-amber-50/80 p-3 text-[11px] text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <p className="font-semibold">Confirmation Notice:</p>
          <p>
            Releasing will transmit the finalized results to {doctor}'s active consultation dashboard. The consultation queue will automatically update to <strong>Ready for Review</strong>.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={releasing}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary flex items-center gap-2 !bg-emerald-600 hover:!bg-emerald-700"
            onClick={handleConfirm}
            disabled={releasing}
          >
            {releasing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Transmitting to Doctor…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirm & Send to {doctor}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default LabResultConfirmModal;

