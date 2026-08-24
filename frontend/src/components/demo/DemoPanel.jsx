import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, LogOut, RotateCcw, Sparkles, X } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function Chip({ label, value }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30">
      {t(label)}: <span className="font-mono">{value}</span>
    </span>
  );
}

export function DemoPanel() {
  const { t } = useTranslation();
  const demo = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  const isLast = demo.currentStep?.step === demo.steps.length;

  return (
    <>
      <div data-demo-panel className="fixed right-4 top-24 z-[60] flex max-h-[calc(100vh-8rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-2xl shadow-brand-900/25 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-brand-700 to-cyan-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white">{t('Demo Mode')}</p>
              <p className="text-[10px] text-teal-100/90">{t('Patient Journey')}</p>
            </div>
          </div>
          <button
            onClick={() => demo.setPanelOpen(false)}
            className="rounded-md p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label={t('Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-48 overflow-y-auto border-b border-slate-100 px-2 py-2 dark:border-slate-800">
          {demo.steps.map((s, i) => {
            const done = i < demo.stepIndex;
            const current = i === demo.stepIndex;
            return (
              <button
                key={s.key}
                onClick={() => demo.goTo(i)}
                disabled={!done || demo.busy}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                  current
                    ? 'bg-gradient-to-r from-brand-500/10 to-cyan-500/10 ring-1 ring-brand-500/40'
                    : done
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      : 'opacity-50'
                } ${done ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : current
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : s.step}
                </span>
                <span
                  className={`flex-1 truncate text-xs font-medium ${
                    current ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t(s.title)}
                </span>
                {current && (
                  <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    {t('Now')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t('Step {{current}} of {{total}}', { current: demo.stepIndex + 1, total: demo.steps.length })}
          </p>
          <h3 className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{t(demo.currentStep?.title)}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t(demo.currentStep?.desc)}</p>

          {(demo.visitNumber || demo.labRequestNumber || demo.procedureNumber || demo.prescriptionNumber) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {demo.visitNumber && <Chip label="Visit" value={demo.visitNumber} />}
              {demo.labRequestNumber && <Chip label="Lab" value={demo.labRequestNumber} />}
              {demo.procedureNumber && <Chip label="Procedure" value={demo.procedureNumber} />}
              {demo.prescriptionNumber && <Chip label="Prescription" value={demo.prescriptionNumber} />}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={demo.next}
              disabled={demo.busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:shadow-lg disabled:opacity-60"
            >
              {isLast ? t('Finish') : t('Next Step')}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </button>
            <button
              onClick={demo.back}
              disabled={demo.busy || demo.stepIndex === 0}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('Back')}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-600 transition hover:text-rose-700 dark:text-rose-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('Reset Demo Data')}
            </button>
            <button
              onClick={demo.exit}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('Exit Demo')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        danger
        title={t('Reset all demo data?')}
        message={t('This will wipe all changes made during the demo and restore the original seeded data. This cannot be undone.')}
        confirmLabel={t('Reset Demo Data')}
        onConfirm={() => {
          setConfirmReset(false);
          demo.reset();
        }}
        onClose={() => setConfirmReset(false)}
      />
    </>
  );
}
