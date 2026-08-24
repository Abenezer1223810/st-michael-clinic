import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/format';
import { PrintShell, ClinicHeader, PrintFieldGrid } from './PrintShell';

export function PrescriptionPrint({ prescription, onClose }) {
  const { t } = useTranslation();
  const patient = prescription?.patient || {
    fullName: prescription?.patientName,
    id: prescription?.patientId,
  };

  return (
    <PrintShell title="Prescription" onClose={onClose} printLabel="Print Prescription">
      <ClinicHeader title="PRESCRIPTION" />

      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <PrintFieldGrid
          patient={patient}
          extra={[
            ['Visit Number', prescription?.visitNumber],
            ['Prescription No.', prescription?.prescriptionNumber],
            ['Doctor', prescription?.doctor],
            ['Date', formatDate(prescription?.date)],
          ]}
        />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-brand-50 text-left">
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">#</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Medicine')}</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Dosage')}</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Frequency')}</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Duration')}</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Route')}</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Instructions')}</th>
          </tr>
        </thead>
        <tbody>
          {(prescription?.medicines || []).map((m, i) => (
            <tr key={i}>
              <td className="border border-slate-200 px-3 py-2 text-slate-600">{i + 1}</td>
              <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-800">{m.medicine}</td>
              <td className="border border-slate-200 px-3 py-2 text-slate-700">{m.dosage || '—'}</td>
              <td className="border border-slate-200 px-3 py-2 text-slate-700">{m.frequency || '—'}</td>
              <td className="border border-slate-200 px-3 py-2 text-slate-700">{m.duration || '—'}</td>
              <td className="border border-slate-200 px-3 py-2 text-slate-700">{m.route || '—'}</td>
              <td className="border border-slate-200 px-3 py-2 text-slate-700">{m.instructions || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 flex items-end justify-between">
        <p className="max-w-sm text-xs italic text-slate-400">
          {t('Please complete the full course of medication as directed by your doctor.')}
        </p>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">{t('Prescribed By')}</p>
          <p className="mt-4 text-sm font-semibold text-slate-800">{prescription?.doctor || '—'}</p>
          <p className="text-xs text-slate-400">{formatDate(prescription?.date)}</p>
        </div>
      </div>
    </PrintShell>
  );
}
