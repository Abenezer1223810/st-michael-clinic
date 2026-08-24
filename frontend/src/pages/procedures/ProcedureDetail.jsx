import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Syringe, Save, CheckCircle2, Printer } from 'lucide-react';
import { procedureService } from '../../services/procedureService';
import { useToast } from '../../context/ToastContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState, Spinner } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { formatDateTime } from '../../utils/format';

export default function ProcedureDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [procedure, setProcedure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    medicine: '',
    dosage: '',
    administrationDetails: '',
    time: '',
    responsibleStaff: '',
    notes: '',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    procedureService
      .get(id)
      .then((d) => setProcedure(d.procedure))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleRecord = async () => {
    setSaving(true);
    try {
      const { message } = await procedureService.record(id, form);
      toast.success(message || t('Procedure completed.'));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonDetail lines={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!procedure) return null;

  const completed = procedure.status === 'completed';
  const rec = procedure.recording;

  return (
    <div>
      <button
        onClick={() => navigate('/procedures')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t('Back to procedure room')}
      </button>

      <PageHeader
        title={t('Procedure · {{number}}', { number: procedure.procedureNumber })}
        subtitle={t('Requested {{date}} by {{doctor}}', { date: formatDateTime(procedure.date), doctor: procedure.requestingDoctor })}
        icon={Syringe}
        actions={
          <>
            <StatusBadge status={procedure.status} />
            {completed && (
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> {t('Print Record')}
              </button>
            )}
          </>
        }
      />

      <PatientHeader patient={procedure.patient} visitNumber={procedure.visitNumber} />

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {!completed ? (
            <Card>
              <CardHeader title={t('Record Administration')} subtitle={t('Document the medicine given and who administered it')} icon={Syringe} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label={t('Procedure Type')} className="sm:col-span-2">
                  <input className="input" value={t(procedure.procedureType)} disabled />
                </Field>
                <Field label={t('Medicine / Material')} required>
                  <input className="input" value={form.medicine} onChange={set('medicine')} placeholder={t('e.g. Diclofenac 75mg')} />
                </Field>
                <Field label={t('Dosage')}>
                  <input className="input" value={form.dosage} onChange={set('dosage')} placeholder={t('e.g. 75 mg')} />
                </Field>
                <Field label={t('Administration Details')} className="sm:col-span-2">
                  <textarea
                    className="input"
                    rows={2}
                    value={form.administrationDetails}
                    onChange={set('administrationDetails')}
                    placeholder={t('e.g. Intramuscular injection into the left deltoid')}
                  />
                </Field>
                <Field label={t('Time')}>
                  <input className="input" type="time" value={form.time} onChange={set('time')} />
                </Field>
                <Field label={t('Responsible Staff')}>
                  <input className="input" value={form.responsibleStaff} onChange={set('responsibleStaff')} placeholder={t('Your name')} />
                </Field>
                <Field label={t('Notes')} className="sm:col-span-2">
                  <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} placeholder={t('Reaction, observations…')} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <button className="btn-primary" onClick={handleRecord} disabled={saving || !form.medicine}>
                  {saving ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />} {t('Complete Procedure')}
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title={t('Administration Record')} subtitle={t('Completed procedure details')} icon={CheckCircle2} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label={t('Medicine / Material')}>
                  <input className="input" value={rec?.medicine || ''} disabled />
                </Field>
                <Field label={t('Dosage')}>
                  <input className="input" value={rec?.dosage || ''} disabled />
                </Field>
                <Field label={t('Administration Details')} className="sm:col-span-2">
                  <textarea className="input" rows={2} value={rec?.administrationDetails || ''} disabled />
                </Field>
                <Field label={t('Administered At')}>
                  <input className="input" value={rec?.date ? formatDateTime(rec.date) : ''} disabled />
                </Field>
                <Field label={t('Responsible Staff')}>
                  <input className="input" value={rec?.responsibleStaff || ''} disabled />
                </Field>
                <Field label={t('Notes')} className="sm:col-span-2">
                  <textarea className="input" rows={2} value={rec?.notes || ''} disabled />
                </Field>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title={t('Request Details')} icon={Syringe} />
            <dl className="divide-y divide-slate-100 px-5 py-2 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">{t('Procedure Type')}</dt>
                <dd className="font-medium text-slate-800">{t(procedure.procedureType)}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">{t('Requesting Doctor')}</dt>
                <dd className="font-medium text-slate-800">{procedure.requestingDoctor}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">{t('Status')}</dt>
                <dd><StatusBadge status={procedure.status} /></dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardHeader title={t('Request Notes')} icon={Syringe} />
            <p className="whitespace-pre-wrap px-5 py-4 text-sm text-slate-600">{procedure.notes || t('No notes provided.')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
