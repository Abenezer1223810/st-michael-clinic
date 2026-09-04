import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/format';
import { PrintShell, ClinicHeader, PrintFieldGrid } from './PrintShell';

export function SickLeavePrint({ sickLeave, onClose }) {
  const { t } = useTranslation();
  const patient = sickLeave?.patient || {
    fullName: sickLeave?.patientName,
    id: sickLeave?.patientId,
  };

  return (
    <PrintShell title="Sick Leave Certificate" onClose={onClose} printLabel="Print Sick Leave">
      <ClinicHeader title="SICK LEAVE CERTIFICATE" />

      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <PrintFieldGrid
          patient={patient}
          extra={[
            ['Visit Number', sickLeave?.visitNumber],
            ['Certificate No.', sickLeave?.certificateNumber],
            ['Doctor', sickLeave?.doctor],
            ['Issue Date', formatDate(sickLeave?.date)],
          ]}
        />
      </div>

      <div className="mb-5 space-y-2 text-sm">
        <p className="text-slate-700">
          {t('This is to certify that the above-named patient was examined at')}{' '}
          <span className="font-semibold">St. Michael Medium Clinic</span>{' '}
          {t('and is medically advised to rest / be excused from work and school.')}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('From')}</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{formatDate(sickLeave?.fromDate)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('To')}</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{formatDate(sickLeave?.toDate)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('Number of Days')}</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{sickLeave?.numberOfDays || '—'}</p>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('Diagnosis / Reason')}</p>
        <p className="mt-1 text-sm text-slate-800">{sickLeave?.diagnosis || '—'}</p>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <p className="max-w-sm text-xs italic text-slate-400">
          {t('This certificate is issued for medical purposes only. Unauthorized use or alteration is prohibited.')}
        </p>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">{t('Attending Doctor')}</p>
          <div className="mt-8 flex h-10 items-end justify-end">
            <div className="h-8 w-40 border-b-2 border-slate-300" />
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{sickLeave?.doctor || '—'}</p>
          <p className="text-xs text-slate-400">{t('Signature & Stamp')}</p>
        </div>
      </div>
    </PrintShell>
  );
}
