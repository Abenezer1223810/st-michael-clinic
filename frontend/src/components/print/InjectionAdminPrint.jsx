import { useTranslation } from 'react-i18next';
import { PrintShell, ClinicHeader, PrintFieldGrid } from './PrintShell';
import { formatDateTime } from '../../utils/format';

export function InjectionAdminPrint({ injection, onClose }) {
  const { t } = useTranslation();
  if (!injection) return null;

  const adm = injection.administrations?.[0];

  return (
    <PrintShell title="Injection Administration Record" onClose={onClose}>
      <ClinicHeader title="INJECTION ADMINISTRATION RECORD" />

      <div className="mb-4 rounded-lg border border-slate-200 p-3 text-xs">
        <PrintFieldGrid
          patient={{ fullName: injection.patientName, id: injection.patientId }}
          extra={[
            ['Order No.', injection.orderNumber],
            ['Prescribed By', injection.doctorName || injection.doctor || 'Doctor'],
            ['Date Ordered', formatDateTime(injection.date || injection.createdAt)],
            ['Status', injection.status],
          ]}
        />
      </div>

      <div className="mb-4 rounded-lg bg-slate-50 p-4 text-xs">
        <h3 className="mb-2 font-bold uppercase tracking-wider text-slate-700">{t('Prescription Order')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-slate-500">{t('Medication')}:</span> <span className="font-bold">{injection.medication}</span></div>
          <div><span className="text-slate-500">{t('Prescribed Dose')}:</span> <span className="font-bold">{injection.prescribedDose}</span></div>
          <div><span className="text-slate-500">{t('Route')}:</span> <span className="font-bold">{injection.route}</span></div>
          <div><span className="text-slate-500">{t('Frequency')}:</span> <span>{injection.frequency}</span></div>
        </div>
        {injection.instructions && (
          <p className="mt-2 border-t border-slate-200 pt-1 italic text-slate-600">
            {t('Instructions')}: {injection.instructions}
          </p>
        )}
      </div>

      {adm ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-950">
          <h3 className="mb-2 font-bold uppercase tracking-wider text-rose-900">{t('Administration Execution Record')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-rose-700">{t('Actual Medication')}:</span> <span className="font-bold">{adm.actualMedication || injection.medication}</span></div>
            <div><span className="text-rose-700">{t('Actual Dose Given')}:</span> <span className="font-bold">{adm.actualDose || injection.prescribedDose}</span></div>
            <div><span className="text-rose-700">{t('Anatomical Site')}:</span> <span className="font-bold">{adm.administrationSite}</span></div>
            <div><span className="text-rose-700">{t('Administered At')}:</span> <span>{formatDateTime(adm.administeredAt)}</span></div>
          </div>
          {adm.notes && <p className="mt-2 border-t border-rose-200 pt-1 italic">{adm.notes}</p>}
        </div>
      ) : (
        <div className="mb-6 p-4 text-center text-xs text-slate-400">
          {t('This injection has not been recorded as administered yet.')}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-12 border-t border-slate-300 pt-4 text-xs">
        <div>
          <p className="font-bold text-slate-700">{t('Prescribing Physician')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">{injection.doctorName || 'Doctor'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-700">{t('Administering Nurse Signature')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">{adm?.administeredBy || 'Nurse'}</p>
        </div>
      </div>
    </PrintShell>
  );
}

