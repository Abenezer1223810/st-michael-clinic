import { useTranslation } from 'react-i18next';
import { PrintShell, ClinicHeader, PrintFieldGrid } from './PrintShell';
import { formatDateTime } from '../../utils/format';

export function ProcedureReportPrint({ procedure, onClose }) {
  const { t } = useTranslation();
  if (!procedure) return null;

  return (
    <PrintShell title="Clinical Procedure Report" onClose={onClose}>
      <ClinicHeader title="CLINICAL PROCEDURE REPORT" />

      <div className="mb-4 rounded-lg border border-slate-200 p-3 text-xs">
        <PrintFieldGrid
          patient={{ fullName: procedure.patientName, id: procedure.patientId }}
          extra={[
            ['Procedure No.', procedure.procedureNumber],
            ['Procedure Type', t(procedure.procedureType)],
            ['Date Ordered', formatDateTime(procedure.date || procedure.createdAt)],
            ['Status', procedure.status],
          ]}
        />
      </div>

      {procedure.recording ? (
        <div className="mb-6 rounded-lg bg-slate-50 p-4 text-xs">
          <h3 className="mb-2 font-bold uppercase tracking-wider text-slate-700">{t('Procedure Execution Details')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-slate-500">{t('Medicine / Anesthetic')}:</span> <span className="font-bold">{procedure.recording.medicine || '—'}</span></div>
            <div><span className="text-slate-500">{t('Dosage')}:</span> <span>{procedure.recording.dosage || '—'}</span></div>
            <div><span className="text-slate-500">{t('Responsible Staff')}:</span> <span className="font-bold">{procedure.recording.responsibleStaff || '—'}</span></div>
            <div><span className="text-slate-500">{t('Execution Time')}:</span> <span>{procedure.recording.time || '—'}</span></div>
          </div>
          {procedure.recording.notes && (
            <p className="mt-3 border-t border-slate-200 pt-2 italic text-slate-600">
              {t('Clinical Notes & Observations')}: {procedure.recording.notes}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 text-center text-xs text-slate-400">
          {t('Procedure has not been executed or recorded yet.')}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-12 border-t border-slate-300 pt-4 text-xs">
        <div>
          <p className="font-bold text-slate-700">{t('Ordering Doctor')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">{procedure.doctor || 'OPD Doctor'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-700">{t('Performing Nurse Signature')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">{procedure.recording?.responsibleStaff || 'Procedure Nurse'}</p>
        </div>
      </div>
    </PrintShell>
  );
}

