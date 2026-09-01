import { useTranslation } from 'react-i18next';
import { PrintShell, ClinicHeader, PrintRow, PrintFieldGrid } from './PrintShell';
import { formatDateTime } from '../../utils/format';

export function VisitSummaryPrint({ summary, onClose }) {
  const { t } = useTranslation();
  if (!summary) return null;

  const {
    visit,
    patient,
    consultation,
    vitals,
    labRequests = [],
    labResults = [],
    injectionOrders = [],
    procedures = [],
    prescriptions = [],
    invoice,
    payments = [],
  } = summary;

  return (
    <PrintShell title="Visit Encounter Summary" onClose={onClose}>
      <ClinicHeader title="VISIT ENCOUNTER SUMMARY" />

      {/* Patient & Visit Demographics */}
      <div className="mb-4 rounded-lg border border-slate-200 p-3 text-xs">
        <PrintFieldGrid
          patient={patient}
          extra={[
            ['Visit No.', visit?.visitNumber],
            ['Encounter Date', formatDateTime(visit?.date || visit?.createdAt)],
            ['Department', t(visit?.service || 'OPD')],
            ['Attending Doctor', consultation?.doctor || '—'],
          ]}
        />
      </div>

      {/* Vitals Summary */}
      {vitals && (
        <div className="mb-4">
          <h3 className="border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('Triage Vital Signs')}
          </h3>
          <div className="mt-1.5 grid grid-cols-4 gap-2 text-xs text-slate-700">
            <div><span className="text-slate-400">{t('BP')}:</span> {vitals.bloodPressure || '—'}</div>
            <div><span className="text-slate-400">{t('Pulse')}:</span> {vitals.pulseRate ? `${vitals.pulseRate} bpm` : '—'}</div>
            <div><span className="text-slate-400">{t('Temp')}:</span> {vitals.temperature ? `${vitals.temperature} °C` : '—'}</div>
            <div><span className="text-slate-400">{t('SpO2')}:</span> {vitals.respiratoryRate || '—'}</div>
            <div><span className="text-slate-400">{t('Weight')}:</span> {vitals.weight ? `${vitals.weight} kg` : '—'}</div>
            <div><span className="text-slate-400">{t('Height')}:</span> {vitals.height ? `${vitals.height} cm` : '—'}</div>
            <div><span className="text-slate-400">{t('BMI')}:</span> {vitals.bmi ? `${vitals.bmi} (${vitals.bmiCategory})` : '—'}</div>
          </div>
        </div>
      )}

      {/* Clinical Assessment & Diagnosis */}
      {consultation && (
        <div className="mb-4 space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs">
          <div>
            <span className="font-bold text-slate-800">{t('Chief Complaint')}:</span>{' '}
            <span className="text-slate-700">{consultation.chiefComplaint || '—'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-800">{t('Working Diagnosis')}:</span>{' '}
            <span className="font-semibold text-brand-800">{consultation.diagnosis || '—'}</span>
          </div>
          {consultation.treatmentRecommendation && (
            <div>
              <span className="font-bold text-slate-800">{t('Treatment Plan')}:</span>{' '}
              <span className="text-slate-700">{consultation.treatmentRecommendation}</span>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Lab Results */}
      {labResults.length > 0 && (
        <div className="mb-4">
          <h3 className="border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('Laboratory Diagnostic Results')}
          </h3>
          <div className="mt-1.5 overflow-hidden rounded border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] text-slate-600">
                <tr>
                  <th className="p-1.5 font-bold">{t('Test Name')}</th>
                  <th className="p-1.5 font-bold">{t('Measured Result')}</th>
                  <th className="p-1.5 font-bold">{t('Unit')}</th>
                  <th className="p-1.5 font-bold">{t('Reference Range')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labResults.flatMap((r) => r.results || []).map((res, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5 font-medium">{res.testName}</td>
                    <td className="p-1.5 font-bold">{res.result}</td>
                    <td className="p-1.5 text-slate-500">{res.unit}</td>
                    <td className="p-1.5 text-slate-500">{res.referenceRange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Injections & Administrations */}
      {injectionOrders.length > 0 && (
        <div className="mb-4">
          <h3 className="border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('Injections & Medications Administered')}
          </h3>
          <div className="mt-1.5 space-y-1 text-xs">
            {injectionOrders.map((inj) => {
              const adm = inj.administrations?.[0];
              return (
                <div key={inj.id} className="flex justify-between border-b border-slate-100 py-1">
                  <div>
                    <span className="font-semibold">{inj.medication}</span> ({inj.prescribedDose} - {inj.route})
                    {adm && <span className="text-slate-500"> · Site: {adm.administrationSite}</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-700">{inj.status}</span>
                    {adm && <span className="text-slate-400"> by {adm.administeredBy}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prescriptions Dispensed */}
      {prescriptions.length > 0 && (
        <div className="mb-4">
          <h3 className="border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('Prescribed Medications & Pharmacy Dispensing')}
          </h3>
          <div className="mt-1.5 space-y-1 text-xs">
            {prescriptions.flatMap((rx) => rx.medicines || []).map((m, idx) => (
              <div key={idx} className="flex justify-between border-b border-slate-100 py-1">
                <div>
                  <span className="font-semibold">{m.medicine}</span> ({m.dose || m.dosage} · {m.route} · {m.frequency})
                </div>
                <div className="text-right text-slate-600">
                  <span>Qty: {m.quantity}</span> · <span className="font-bold text-teal-700">Dispensed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Settlement */}
      {invoice && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-900">
          <div className="flex justify-between font-semibold">
            <span>{t('Invoice')} #{invoice.invoiceNumber} — {t('Payment Status')}: {invoice.status}</span>
            <span>{t('Total')}: {invoice.totalAmount} ETB (Paid: {invoice.paidAmount} ETB, Balance: {invoice.balance} ETB)</span>
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-2 gap-12 border-t border-slate-300 pt-4 text-xs">
        <div>
          <p className="font-bold text-slate-700">{t('Attending Physician Signature & Stamp')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">{consultation?.doctor || 'Dr. Dawit Alemu'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-700">{t('Discharged & Verified By')}:</p>
          <p className="mt-6 border-b border-slate-400 pb-1 font-semibold">{summary.closedBy || 'Main Reception & OPD'}</p>
        </div>
      </div>
    </PrintShell>
  );
}

