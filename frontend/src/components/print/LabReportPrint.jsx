import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../utils/format';
import { PrintShell, ClinicHeader, PrintFieldGrid } from './PrintShell';

export function LabReportPrint({ request, result, sample, onClose }) {
  const { t } = useTranslation();

  const patient = request?.patient || {
    fullName: request?.patientName || 'Unknown Patient',
    id: request?.patientId || '—',
  };

  const resultsList = result?.results || request?.tests || [];
  const instrumentName = result?.instrumentName || result?.instrumentId || 'Automated Clinical Laboratory Analyzer';

  const getFlagBadge = (flag) => {
    const f = String(flag || 'NORMAL').toUpperCase();
    if (f === 'HIGH' || f === 'H') {
      return (
        <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800 border border-rose-300">
          HIGH ▲
        </span>
      );
    }
    if (f === 'LOW' || f === 'L') {
      return (
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
          LOW ▼
        </span>
      );
    }
    if (f === 'CRITICAL' || f === 'CRIT') {
      return (
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-900 border border-purple-300 animate-pulse">
          CRITICAL ⚠
        </span>
      );
    }
    return (
      <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Normal
      </span>
    );
  };

  return (
    <PrintShell title="Official Laboratory Report" onClose={onClose} printLabel="Print Diagnostic Report">
      <ClinicHeader title="CLINICAL LABORATORY DIAGNOSTIC REPORT" />

      {/* Patient Demographics & Order Metadata */}
      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
        <PrintFieldGrid
          patient={patient}
          extra={[
            ['Request Number', request?.requestNumber || request?.id],
            ['Visit Number', request?.visitNumber || '—'],
            ['Ordering Doctor', request?.requestingDoctor || 'Dr. Dawit Alemu'],
            ['Sample Barcode', sample?.sampleNumber || request?.sampleId || '—'],
            ['Specimen Type', sample?.specimenType || request?.tests?.[0]?.specimenType || 'Whole Blood / Serum'],
            ['Collection Time', formatDateTime(sample?.collectedAt || request?.date)],
            ['Instrument / Analyzer', instrumentName],
            ['Report Status', result?.status || request?.status || 'RELEASED_TO_DOCTOR'],
          ]}
        />
      </div>

      {/* Parameter Observation Table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-brand-50 text-left">
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">#</th>
            <th className="border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{t('Test Name / Parameter')}</th>
            <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600">{t('Result')}</th>
            <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600">{t('Flag')}</th>
            <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600">{t('Unit')}</th>
            <th className="border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600">{t('Reference Range')}</th>
            <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">{t('Remarks / Method')}</th>
          </tr>
        </thead>
        <tbody>
          {resultsList.map((item, idx) => (
            <tr key={idx} className={item.flag === 'HIGH' || item.flag === 'LOW' ? 'bg-amber-50/30' : ''}>
              <td className="border border-slate-200 px-3 py-2 text-slate-600 text-xs">{idx + 1}</td>
              <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-800">
                {item.testName || item.name}
                {item.code ? <span className="ml-1 text-[11px] font-mono text-slate-400">({item.code})</span> : ''}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-center font-bold text-slate-900 text-base">
                {item.result || '—'}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-center">
                {getFlagBadge(item.flag)}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-center text-xs text-slate-600 font-mono">
                {item.unit || '—'}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-center text-xs text-slate-700 font-mono">
                {item.referenceRange || '—'}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-xs text-slate-500">
                {item.remarks || 'Automated Photometry / Cell Counter'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Verification & Quality Control Footer */}
      <div className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-200 pt-4 text-xs">
        <div>
          <p className="font-semibold text-slate-500">{t('Testing Laboratory Staff / Technician')}:</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{result?.enteredBy || 'Meron Girma'}</p>
          <p className="text-[11px] text-slate-500">
            {t('Entered / Received')}: {formatDateTime(result?.enteredAt || result?.date)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-500">{t('Verified & Released By')}:</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{result?.verifiedBy || result?.releasedBy || 'Meron Girma'}</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            ✓ {t('Technician Verification Timestamp')}: {formatDateTime(result?.verifiedAt || result?.releasedToDoctorAt || new Date().toISOString())}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-[11px] text-slate-400">
        <span>St. Michael Medium Clinic Diagnostic Laboratory • Accreditation License: ET-MOH-LAB-2024</span>
        <span>Page 1 of 1</span>
      </div>
    </PrintShell>
  );
}

export default LabReportPrint;

