import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Stethoscope,
  Save,
  FlaskConical,
  Syringe,
  Pill,
  CheckCircle2,
  History,
  Printer,
} from 'lucide-react';
import { visitService } from '../../services/visitService';
import { opdService } from '../../services/opdService';
import { useToast } from '../../context/ToastContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { Spinner } from '../../components/ui/States';
import { LabRequestModal } from '../../components/consultation/LabRequestModal';
import { ProcedureRequestModal } from '../../components/consultation/ProcedureRequestModal';
import { PrescriptionModal } from '../../components/consultation/PrescriptionModal';
import { formatDateTime } from '../../utils/format';
import { ConsultationPrint } from '../../components/print/ConsultationPrint';

const EMPTY_VITALS = { bloodPressure: '', pulse: '', temperature: '', respiratoryRate: '', weight: '', height: '' };
const EMPTY_CLINICAL = {
  chiefComplaint: '',
  medicalHistory: '',
  clinicalExamination: '',
  diagnosis: '',
  treatmentRecommendation: '',
  doctorNotes: '',
  followUp: '',
  referral: '',
};

export default function Consultation() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [clinical, setClinical] = useState(EMPTY_CLINICAL);

  const [labModal, setLabModal] = useState(false);
  const [procModal, setProcModal] = useState(false);
  const [rxModal, setRxModal] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    visitService
      .get(visitId)
      .then((d) => {
        setData(d);
        if (d.consultation) {
          setVitals({ ...EMPTY_VITALS, ...(d.consultation.vitals || {}) });
          setClinical({
            chiefComplaint: d.consultation.chiefComplaint || '',
            medicalHistory: d.consultation.medicalHistory || '',
            clinicalExamination: d.consultation.clinicalExamination || '',
            diagnosis: d.consultation.diagnosis || '',
            treatmentRecommendation: d.consultation.treatmentRecommendation || '',
            doctorNotes: d.consultation.doctorNotes || '',
            followUp: d.consultation.followUp || '',
            referral: d.consultation.referral || '',
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId]);

  const saveConsultation = async () => {
    setSaving(true);
    try {
      if (data.consultation) {
        const { message } = await opdService.saveConsultation(data.consultation.id, { vitals, ...clinical });
        toast.success(message || 'Consultation saved.');
      } else {
        const created = await opdService.startConsultation(visitId, vitals);
        await opdService.saveConsultation(created.consultation.id, clinical);
        toast.success('Consultation started and saved.');
      }
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const completeConsultation = async () => {
    if (!data.consultation) {
      toast.error('Save the consultation before completing it.');
      return;
    }
    setCompleting(true);
    try {
      const { message } = await opdService.completeConsultation(data.consultation.id);
      toast.success(message || 'Consultation completed.');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <LoadingState label="Loading consultation…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { visit, consultation, labRequests, procedures, prescriptions } = data;
  const patient = visit.patient;
  const completed = consultation?.status === 'completed';

  const setV = (key) => (e) => setVitals((v) => ({ ...v, [key]: e.target.value }));
  const setC = (key) => (e) => setClinical((c) => ({ ...c, [key]: e.target.value }));

  const vitalsFields = [
    { key: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', ph: '120/80' },
    { key: 'pulse', label: 'Pulse', unit: 'bpm', ph: '72' },
    { key: 'temperature', label: 'Temperature', unit: '°C', ph: '37.0' },
    { key: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', ph: '18' },
    { key: 'weight', label: 'Weight', unit: 'kg', ph: '65' },
    { key: 'height', label: 'Height', unit: 'cm', ph: '170' },
  ];

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </button>

      <PageHeader
        title={completed ? 'Consultation Completed' : 'Patient Consultation'}
        subtitle={`${visit.service} · ${formatDateTime(visit.date)}`}
        icon={Stethoscope}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate(`/patients/${patient.id}`)}>
              <History className="h-4 w-4" /> Patient History
            </button>
            <button className="btn-secondary" onClick={() => setPrintOpen(true)} disabled={!consultation}>
              <Printer className="h-4 w-4" /> Print Record
            </button>
          </>
        }
      />

      <PatientHeader patient={patient} visitNumber={visit.visitNumber} consultationNumber={consultation?.consultationNumber} />

      {consultation && (
        <div className="mt-4 flex items-center gap-2">
          <StatusBadge status={consultation.status === 'completed' ? 'completed' : 'in_progress'} />
          <span className="text-xs text-slate-400">Doctor: {consultation.doctor}</span>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader title="Vital Signs" subtitle="Record the patient's current vitals" icon={Stethoscope} />
            <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
              {vitalsFields.map((f) => (
                <Field key={f.key} label={f.label}>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      value={vitals[f.key]}
                      onChange={setV(f.key)}
                      placeholder={f.ph}
                      disabled={completed}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{f.unit}</span>
                  </div>
                </Field>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Clinical Information" subtitle="Complaint, history, examination, diagnosis and treatment" icon={Stethoscope} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Chief Complaint" className="sm:col-span-2">
                <textarea className="input" rows={2} value={clinical.chiefComplaint} onChange={setC('chiefComplaint')} disabled={completed} placeholder="e.g. Fever and headache for 2 days" />
              </Field>
              <Field label="Medical History">
                <textarea className="input" rows={3} value={clinical.medicalHistory} onChange={setC('medicalHistory')} disabled={completed} placeholder="Past and chronic illnesses" />
              </Field>
              <Field label="Clinical Examination">
                <textarea className="input" rows={3} value={clinical.clinicalExamination} onChange={setC('clinicalExamination')} disabled={completed} placeholder="Physical examination findings" />
              </Field>
              <Field label="Diagnosis">
                <textarea className="input" rows={2} value={clinical.diagnosis} onChange={setC('diagnosis')} disabled={completed} placeholder="e.g. Suspected typhoid fever" />
              </Field>
              <Field label="Treatment Recommendation">
                <textarea className="input" rows={2} value={clinical.treatmentRecommendation} onChange={setC('treatmentRecommendation')} disabled={completed} placeholder="Planned treatment" />
              </Field>
              <Field label="Doctor's Notes">
                <textarea className="input" rows={2} value={clinical.doctorNotes} onChange={setC('doctorNotes')} disabled={completed} placeholder="Additional notes" />
              </Field>
              <Field label="Follow-up">
                <input className="input" value={clinical.followUp} onChange={setC('followUp')} disabled={completed} placeholder="e.g. Review in 1 week" />
              </Field>
              <Field label="Referral">
                <input className="input" value={clinical.referral} onChange={setC('referral')} disabled={completed} placeholder="e.g. Cardiology, Addis General Hospital" />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">
                {consultation ? 'Consultation saved · edits are persisted' : 'Save to start the consultation'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={saveConsultation} disabled={saving || completed}>
                  {saving ? <Spinner /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving…' : consultation ? 'Save Consultation' : 'Start & Save'}
                </button>
                {!completed && (
                  <button className="btn-primary" onClick={completeConsultation} disabled={completing}>
                    {completing ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                    Complete Consultation
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Order Actions" subtitle="Request services from other departments" icon={Stethoscope} />
            <div className="grid grid-cols-1 gap-2 p-4">
              <button className="btn-primary w-full justify-start" onClick={() => setLabModal(true)} disabled={completed}>
                <FlaskConical className="h-4 w-4" /> Request Laboratory Test
              </button>
              <button className="btn-primary w-full justify-start !bg-violet-600 hover:!bg-violet-700" onClick={() => setProcModal(true)} disabled={completed}>
                <Syringe className="h-4 w-4" /> Request Procedure
              </button>
              <button className="btn-primary w-full justify-start !bg-emerald-600 hover:!bg-emerald-700" onClick={() => setRxModal(true)} disabled={completed}>
                <Pill className="h-4 w-4" /> Create Prescription
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Laboratory" subtitle={`${labRequests.length} request(s)`} icon={FlaskConical} />
            <div className="px-5 py-2">
              {labRequests.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No lab requests for this visit</p>
              ) : (
                labRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <Link to={`/laboratory/requests/${r.id}`} className="font-medium text-brand-700 hover:underline">
                      {r.requestNumber}
                    </Link>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Procedures" subtitle={`${procedures.length} request(s)`} icon={Syringe} />
            <div className="px-5 py-2">
              {procedures.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No procedure requests for this visit</p>
              ) : (
                procedures.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <Link to={`/procedures/${p.id}`} className="font-medium text-brand-700 hover:underline">
                      {p.procedureNumber}
                    </Link>
                    <StatusBadge status={p.status} />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Prescriptions" subtitle={`${prescriptions.length} record(s)`} icon={Pill} />
            <div className="px-5 py-2">
              {prescriptions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No prescriptions for this visit</p>
              ) : (
                prescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <Link to={`/prescriptions/${rx.id}`} className="font-medium text-brand-700 hover:underline">
                      {rx.prescriptionNumber}
                    </Link>
                    <span className="text-xs text-slate-400">{rx.medicines.length} item(s)</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <LabRequestModal open={labModal} onClose={() => setLabModal(false)} visitId={visitId} onRequested={load} />
      <ProcedureRequestModal open={procModal} onClose={() => setProcModal(false)} visitId={visitId} onRequested={load} />
      <PrescriptionModal open={rxModal} onClose={() => setRxModal(false)} visitId={visitId} onCreated={load} />
      {printOpen && (
        <ConsultationPrint
          consultation={consultation}
          visit={visit}
          patient={patient}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  );
}
