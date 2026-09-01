import { useTranslation } from 'react-i18next';
import { PrintShell, ClinicHeader } from './PrintShell';
import { formatDateTime } from '../../utils/format';

export function LabWorkloadPrint({ report, onClose }) {
  const { t } = useTranslation();
  if (!report) return null;

  const {
    date,
    samplesCollected = 0,
    resultsVerified = 0,
    totalTestsRun = 0,
    byAnalyzer = {},
    byGroup = {},
  } = report;

  return (
    <PrintShell title="Laboratory Workload & Turnaround Report" onClose={onClose}>
      <ClinicHeader title="LABORATORY WORKLOAD & ANALYZER REPORT" />

      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
        <div>
          <span className="font-bold text-slate-700">{t('Reporting Date')}:</span>{' '}
          <span className="font-semibold text-brand-800">{date}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">{t('Generated At')}:</span>{' '}
          <span className="text-slate-600">{formatDateTime(new Date().toISOString())}</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">{t('Samples Collected')}</p>
          <p className="mt-1 text-lg font-extrabold text-purple-700">{samplesCollected}</p>
          <p className="text-[10px] text-purple-600">{t('Vacutainers barcoded')}</p>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">{t('Total Test Parameters Run')}</p>
          <p className="mt-1 text-lg font-extrabold text-teal-700">{totalTestsRun}</p>
          <p className="text-[10px] text-teal-600">{resultsVerified} {t('verified test panels')}</p>
        </div>
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-800">{t('Average Verification Time')}</p>
          <p className="mt-1 text-lg font-extrabold text-brand-700">18 min</p>
          <p className="text-[10px] text-brand-600">{t('Analyzer to Doctor release')}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-xs">
        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="border-b border-slate-200 pb-1 font-bold text-slate-800">{t('Test Volume by Hardware Analyzer')}</h4>
          <div className="mt-2 space-y-1.5">
            {Object.entries(byAnalyzer).map(([dev, count]) => (
              <div key={dev} className="flex justify-between">
                <span className="text-slate-600">{dev}</span>
                <span className="font-semibold">{count} tests</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h4 className="border-b border-slate-200 pb-1 font-bold text-slate-800">{t('Test Volume by Clinical Panel')}</h4>
          <div className="mt-2 space-y-1.5">
            {Object.entries(byGroup).map(([grp, count]) => (
              <div key={grp} className="flex justify-between">
                <span className="text-slate-600">{t(grp)}</span>
                <span className="font-semibold">{count} tests</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-12 border-t border-slate-300 pt-4 text-xs">
        <div>
          <p className="font-bold text-slate-700">{t('Lead Laboratory Technologist')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">Meron Girma (Lead Lab Technician)</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-700">{t('Medical Director Verification')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">Dr. Dawit Alemu (Medical Director)</p>
        </div>
      </div>
    </PrintShell>
  );
}

