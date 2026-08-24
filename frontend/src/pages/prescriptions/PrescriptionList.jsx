import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pill, Search, ArrowRight } from 'lucide-react';
import { prescriptionService } from '../../services/prescriptionService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/format';

export default function PrescriptionList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const patientId = params.get('patientId');
    setLoading(true);
    setError(null);
    prescriptionService
      .list(patientId)
      .then((d) => setPrescriptions(d.prescriptions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params]);

  const q = search.trim().toLowerCase();
  const rows = q
    ? prescriptions.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(q) ||
          p.patientId?.toLowerCase().includes(q) ||
          p.prescriptionNumber?.toLowerCase().includes(q)
      )
    : prescriptions;

  const columns = [
    { key: 'prescriptionNumber', header: t('Prescription No.'), render: (p) => <span className="font-semibold text-brand-700">{p.prescriptionNumber}</span> },
    { key: 'patientName', header: t('Patient'), render: (p) => <span className="font-medium text-slate-800">{p.patientName}</span> },
    { key: 'patientId', header: t('Patient ID'), render: (p) => <span className="text-slate-500">{p.patientId}</span> },
    { key: 'visitNumber', header: t('Visit'), render: (p) => <span className="text-slate-500">{p.visitNumber}</span> },
    {
      key: 'medicines',
      header: t('Medicines'),
      render: (p) => (
        <span className="text-slate-600">{p.medicines.map((m) => m.medicine).join(', ')}</span>
      ),
    },
    { key: 'doctor', header: t('Doctor'), render: (p) => <span className="text-slate-500">{p.doctor}</span> },
    { key: 'date', header: t('Date'), render: (p) => <span className="text-slate-500">{formatDateTime(p.date)}</span> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => navigate(`/prescriptions/${p.id}`)}>
          {t('View')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Prescriptions')}
        subtitle={t('All prescriptions issued by the clinic')}
        icon={Pill}
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder={t('Search patient, ID, prescription…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <Card>
        <CardHeader title={t('Prescription Records')} subtitle={t('Open a prescription to view and print it')} icon={Pill} />
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          emptyTitle={t('No prescriptions found')}
          emptyDescription={t('Prescriptions appear here when a doctor issues them during consultation.')}
        />
      </Card>
    </div>
  );
}
