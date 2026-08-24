import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, ListChecks, LogOut, RotateCcw, UserRound } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function DemoBanner() {
  const { t } = useTranslation();
  const demo = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  const progress = Math.round(((demo.stepIndex + 1) / demo.steps.length) * 100);

  return (
    <>
      <div data-demo-banner className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-700 via-brand-600 to-cyan-700 px-4 py-2.5 text-white shadow-lg shadow-brand-900/10 dark:border-brand-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest">{t('Demo Mode')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <UserRound className="h-3.5 w-3.5 opacity-80" />
          <span className="font-medium">{t('Patient')}:</span>
          <span className="font-semibold">{demo.demoPatientName}</span>
          <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[11px]">{demo.demoPatientId}</span>
          {demo.visitNumber && (
            <>
              <CalendarCheck className="ml-2 h-3.5 w-3.5 opacity-80" />
              <span className="font-medium">{t('Visit')}:</span>
              <span className="font-mono font-semibold">{demo.visitNumber}</span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-[11px] font-semibold">
              {t('Step {{current}} of {{total}}', { current: demo.stepIndex + 1, total: demo.steps.length })}
            </span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            onClick={() => demo.setPanelOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/25"
          >
            <ListChecks className="h-3.5 w-3.5" />
            {t('Journey')}
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/25"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('Reset Demo Data')}</span>
          </button>
          <button
            onClick={demo.exit}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/25"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('Exit Demo')}</span>
          </button>
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
