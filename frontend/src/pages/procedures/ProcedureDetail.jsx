import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Syringe, Save, CheckCircle2, Printer } from 'lucide-react';
import { procedureService } from '../../services/procedureService';
import { useToast } from '../../context/ToastContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState, ErrorState, Spinner } from '../../components/ui/States';
import { formatDateTime } from '../../utils/format';

export default function ProcedureDetail() {
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
      toast.success(message || 'Procedure completed.');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading procedure request…" />;
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
        <ArrowLeft className="h-4 w-4" /> Back to procedure room
      </button>

      <PageHeader
        title={`Procedure · ${procedure.procedureNumber}`}
        subtitle={`Requested ${formatDateTime(procedure.date)} by ${procedure.requestingDoctor}`}
        icon={Syringe}
        actions={
          <>
            <StatusBadge status={procedure.status} />
            {completed && (
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Record
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
              <CardHeader title="Record Administration" subtitle="Document the medicine given and who administered it" icon={Syringe} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Procedure Type" className="sm:col-span-2">
                  <input className="input" value={procedure.procedureType} disabled />
                </Field>
                <Field label="Medicine / Material" required>
                  <input className="input" value={form.medicine} onChange={set('medicine')} placeholder="e.g. Diclofenac 75mg" />
                </Field>
                <Field label="Dosage">
                  <input className="input" value={form.dosage} onChange={set('dosage')} placeholder="e.g. 75 mg" />
                </Field>
                <Field label="Administration Details" className="sm:col-span-2">
                  <textarea
                    className="input"
                    rows={2}
                    value={form.administrationDetails}
                    onChange={set('administrationDetails')}
                    placeholder="e.g. Intramuscular injection into the left deltoid"
                  />
                </Field>
                <Field label="Time">
                  <input className="input" type="time" value={form.time} onChange={set('time')} />
                </Field>
                <Field label="Responsible Staff">
                  <input className="input" value={form.responsibleStaff} onChange={set('responsibleStaff')} placeholder="Your name" />
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} placeholder="Reaction, observations…" />
                </Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <button className="btn-primary" onClick={handleRecord} disabled={saving || !form.medicine}>
                  {saving ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />} Complete Procedure
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Administration Record" subtitle="Completed procedure details" icon={CheckCircle2} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Medicine / Material">
                  <input className="input" value={rec?.medicine || ''} disabled />
                </Field>
                <Field label="Dosage">
                  <input className="input" value={rec?.dosage || ''} disabled />
                </Field>
                <Field label="Administration Details" className="sm:col-span-2">
                  <textarea className="input" rows={2} value={rec?.administrationDetails || ''} disabled />
                </Field>
                <Field label="Administered At">
                  <input className="input" value={rec?.date ? formatDateTime(rec.date) : ''} disabled />
                </Field>
                <Field label="Responsible Staff">
                  <input className="input" value={rec?.responsibleStaff || ''} disabled />
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <textarea className="input" rows={2} value={rec?.notes || ''} disabled />
                </Field>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Request Details" icon={Syringe} />
            <dl className="divide-y divide-slate-100 px-5 py-2 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Procedure Type</dt>
                <dd className="font-medium text-slate-800">{procedure.procedureType}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Requesting Doctor</dt>
                <dd className="font-medium text-slate-800">{procedure.requestingDoctor}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Status</dt>
                <dd><StatusBadge status={procedure.status} /></dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Request Notes" icon={Syringe} />
            <p className="whitespace-pre-wrap px-5 py-4 text-sm text-slate-600">{procedure.notes || 'No notes provided.'}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
