import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pill, Printer } from 'lucide-react';
import { prescriptionService } from '../../services/prescriptionService';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { PrescriptionPrint } from '../../components/print/PrescriptionPrint';
import { formatDateTime } from '../../utils/format';

export default function PrescriptionDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    prescriptionService
      .get(id)
      .then((d) => setPrescription(d.prescription))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SkeletonDetail lines={5} />;
  if (error) return <ErrorState message={error} />;
  if (!prescription) return null;

  return (
    <div>
      <button
        onClick={() => navigate('/prescriptions')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t('Back to prescriptions')}
      </button>

      <PageHeader
        title={t('Prescription · {{number}}', { number: prescription.prescriptionNumber })}
        subtitle={t('Issued {{date}} by Dr. {{doctor}}', { date: formatDateTime(prescription.date), doctor: prescription.doctor })}
        icon={Pill}
        actions={
          <button className="btn-primary" onClick={() => setPrintOpen(true)}>
            <Printer className="h-4 w-4" /> {t('Print Prescription')}
          </button>
        }
      />

      <PatientHeader patient={prescription.patient} visitNumber={prescription.visitNumber} />

      <div className="mt-5">
        <Card>
          <CardHeader title={t('Medicines')} subtitle={t('Complete the full course as directed')} icon={Pill} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="th">#</th>
                  <th className="th">{t('Medicine')}</th>
                  <th className="th">{t('Dosage')}</th>
                  <th className="th">{t('Frequency')}</th>
                  <th className="th">{t('Duration')}</th>
                  <th className="th">{t('Route')}</th>
                  <th className="th">{t('Instructions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescription.medicines.map((m, i) => (
                  <tr key={i}>
                    <td className="td text-slate-500">{i + 1}</td>
                    <td className="td font-semibold text-slate-800">{m.medicine}</td>
                    <td className="td text-slate-700">{m.dosage || '—'}</td>
                    <td className="td text-slate-700">{m.frequency || '—'}</td>
                    <td className="td text-slate-700">{m.duration || '—'}</td>
                    <td className="td text-slate-700">{m.route || '—'}</td>
                    <td className="td text-slate-600">{m.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-8 border-t border-slate-100 px-5 py-4 text-sm">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('Prescribed By')}</p>
              <p className="font-semibold text-slate-800">{prescription.doctor}</p>
            </div>
          </div>
        </Card>
      </div>

      {printOpen && (
        <PrescriptionPrint prescription={prescription} onClose={() => setPrintOpen(false)} />
      )}
    </div>
  );
}
