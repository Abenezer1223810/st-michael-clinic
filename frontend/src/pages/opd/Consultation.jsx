import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { ErrorState } from '../../components/ui/States';
import { Spinner } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
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
  const { t } = useTranslation();
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
  const [vitalsErrors, setVitalsErrors] = useState({});

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
    const errs = validateVitals();
    if (Object.keys(errs).length > 0) {
      setVitalsErrors(errs);
      toast.error(t('Check the highlighted vital sign values.'));
      return;
    }
    setSaving(true);
    try {
      if (data.consultation) {
        const { message } = await opdService.saveConsultation(data.consultation.id, { vitals, ...clinical });
        toast.success(message || t('Consultation saved.'));
      } else {
        const created = await opdService.startConsultation(visitId, vitals);
        await opdService.saveConsultation(created.consultation.id, clinical);
        toast.success(t('Consultation started and saved.'));
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
      toast.error(t('Save the consultation before completing it.'));
      return;
    }
    setCompleting(true);
    try {
      const { message } = await opdService.completeConsultation(data.consultation.id);
      toast.success(message || t('Consultation completed.'));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <SkeletonDetail lines={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { visit, consultation, labRequests, procedures, prescriptions } = data;
  const patient = visit.patient;
  const completed = consultation?.status === 'completed';

  const setV = (key) => (e) => {
    setVitals((v) => ({ ...v, [key]: e.target.value }));
    setVitalsErrors((prev) => ({ ...prev, [key]: null }));
  };
  const setC = (key) => (e) => setClinical((c) => ({ ...c, [key]: e.target.value }));

  const validateVitals = () => {
    const errs = {};
    const checks = [
      { key: 'bloodPressure', test: (v) => v && !/^\d{2,3}\/\d{2,3}$/.test(v), msg: t('Use the format 120/80.') },
      { key: 'pulse', test: (v) => v && (!/^\d+$/.test(v) || Number(v) < 30 || Number(v) > 220), msg: t('Enter a value between 30 and 220 bpm.') },
      { key: 'temperature', test: (v) => v && (!/^\d+(\.\d+)?$/.test(v) || Number(v) < 30 || Number(v) > 45), msg: t('Enter a value between 30 and 45°C.') },
      { key: 'respiratoryRate', test: (v) => v && (!/^\d+$/.test(v) || Number(v) < 8 || Number(v) > 60), msg: t('Enter a value between 8 and 60/min.') },
      { key: 'weight', test: (v) => v && (!/^\d+(\.\d+)?$/.test(v) || Number(v) < 1 || Number(v) > 300), msg: t('Enter a value between 1 and 300 kg.') },
      { key: 'height', test: (v) => v && (!/^\d+(\.\d+)?$/.test(v) || Number(v) < 30 || Number(v) > 250), msg: t('Enter a value between 30 and 250 cm.') },
    ];
    for (const c of checks) {
      if (c.test(vitals[c.key])) errs[c.key] = c.msg;
    }
    return errs;
  };

  const vitalsFields = [
    { key: 'bloodPressure', label: t('Blood Pressure'), unit: 'mmHg', ph: '120/80' },
    { key: 'pulse', label: t('Pulse'), unit: 'bpm', ph: '72' },
    { key: 'temperature', label: t('Temperature'), unit: '°C', ph: '37.0' },
    { key: 'respiratoryRate', label: t('Respiratory Rate'), unit: '/min', ph: '18' },
    { key: 'weight', label: t('Weight'), unit: 'kg', ph: '65' },
    { key: 'height', label: t('Height'), unit: 'cm', ph: '170' },
  ];

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t('Back to queue')}
      </button>

      <PageHeader
        title={completed ? t('Consultation Completed') : t('Patient Consultation')}
        subtitle={`${t(visit.service)} · ${formatDateTime(visit.date)}`}
        icon={Stethoscope}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate(`/patients/${patient.id}`)}>
              <History className="h-4 w-4" /> {t('Patient History')}
            </button>
            <button className="btn-secondary" onClick={() => setPrintOpen(true)} disabled={!consultation}>
              <Printer className="h-4 w-4" /> {t('Print Record')}
            </button>
          </>
        }
      />

      <PatientHeader patient={patient} visitNumber={visit.visitNumber} consultationNumber={consultation?.consultationNumber} />

      {consultation && (
        <div className="mt-4 flex items-center gap-2">
          <StatusBadge status={consultation.status === 'completed' ? 'completed' : 'in_progress'} />
          <span className="text-xs text-slate-400">{t('Doctor: {{name}}', { name: consultation.doctor })}</span>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader title={t('Vital Signs')} subtitle={t("Record the patient's current vitals")} icon={Stethoscope} />
            <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
              {vitalsFields.map((f) => (
                <Field key={f.key} label={f.label} error={vitalsErrors[f.key]}>
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
            <CardHeader title={t('Clinical Information')} subtitle={t('Complaint, history, examination, diagnosis and treatment')} icon={Stethoscope} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label={t('Chief Complaint')} className="sm:col-span-2">
                <textarea className="input" rows={2} value={clinical.chiefComplaint} onChange={setC('chiefComplaint')} disabled={completed} placeholder={t('e.g. Fever and headache for 2 days')} />
              </Field>
              <Field label={t('Medical History')}>
                <textarea className="input" rows={3} value={clinical.medicalHistory} onChange={setC('medicalHistory')} disabled={completed} placeholder={t('Past and chronic illnesses')} />
              </Field>
              <Field label={t('Clinical Examination')}>
                <textarea className="input" rows={3} value={clinical.clinicalExamination} onChange={setC('clinicalExamination')} disabled={completed} placeholder={t('Physical examination findings')} />
              </Field>
              <Field label={t('Diagnosis')}>
                <textarea className="input" rows={2} value={clinical.diagnosis} onChange={setC('diagnosis')} disabled={completed} placeholder={t('e.g. Suspected typhoid fever')} />
              </Field>
              <Field label={t('Treatment Recommendation')}>
                <textarea className="input" rows={2} value={clinical.treatmentRecommendation} onChange={setC('treatmentRecommendation')} disabled={completed} placeholder={t('Planned treatment')} />
              </Field>
              <Field label={t("Doctor's Notes")}>
                <textarea className="input" rows={2} value={clinical.doctorNotes} onChange={setC('doctorNotes')} disabled={completed} placeholder={t('Additional notes')} />
              </Field>
              <Field label={t('Follow-up')}>
                <input className="input" value={clinical.followUp} onChange={setC('followUp')} disabled={completed} placeholder={t('e.g. Review in 1 week')} />
              </Field>
              <Field label={t('Referral')}>
                <input className="input" value={clinical.referral} onChange={setC('referral')} disabled={completed} placeholder={t('e.g. Cardiology, Addis General Hospital')} />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">
                {consultation ? t('Consultation saved · edits are persisted') : t('Save to start the consultation')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={saveConsultation} disabled={saving || completed}>
                  {saving ? <Spinner /> : <Save className="h-4 w-4" />}
                  {saving ? t('Saving…') : consultation ? t('Save Consultation') : t('Start & Save')}
                </button>
                {!completed && (
                  <button className="btn-primary" onClick={completeConsultation} disabled={completing}>
                    {completing ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                    {t('Complete Consultation')}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title={t('Order Actions')} subtitle={t('Request services from other departments')} icon={Stethoscope} />
            <div className="grid grid-cols-1 gap-2 p-4">
              <button className="btn-primary w-full justify-start" onClick={() => setLabModal(true)} disabled={completed}>
                <FlaskConical className="h-4 w-4" /> {t('Request Laboratory Test')}
              </button>
              <button className="btn-primary w-full justify-start !bg-violet-600 hover:!bg-violet-700" onClick={() => setProcModal(true)} disabled={completed}>
                <Syringe className="h-4 w-4" /> {t('Request Procedure')}
              </button>
              <button className="btn-primary w-full justify-start !bg-emerald-600 hover:!bg-emerald-700" onClick={() => setRxModal(true)} disabled={completed}>
                <Pill className="h-4 w-4" /> {t('Create Prescription')}
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('Laboratory')} subtitle={t('{{count}} request(s)', { count: labRequests.length })} icon={FlaskConical} />
            <div className="px-5 py-2">
              {labRequests.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">{t('No lab requests for this visit')}</p>
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
            <CardHeader title={t('Procedures')} subtitle={t('{{count}} request(s)', { count: procedures.length })} icon={Syringe} />
            <div className="px-5 py-2">
              {procedures.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">{t('No procedure requests for this visit')}</p>
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
            <CardHeader title={t('Prescriptions')} subtitle={t('{{count}} record(s)', { count: prescriptions.length })} icon={Pill} />
            <div className="px-5 py-2">
              {prescriptions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">{t('No prescriptions for this visit')}</p>
              ) : (
                prescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <Link to={`/prescriptions/${rx.id}`} className="font-medium text-brand-700 hover:underline">
                      {rx.prescriptionNumber}
                    </Link>
                    <span className="text-xs text-slate-400">{t('{{count}} item(s)', { count: rx.medicines.length })}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <LabRequestModal open={labModal} onClose={() => setLabModal(false)} visitId={visitId} onRequested={load} />
      <ProcedureRequestModal open={procModal} onClose={() => setProcModal(false)} visitId={visitId} onRequested={load} />
      <PrescriptionModal open={rxModal} onClose={() => setRxModal(false)} visitId={visitId} onCreated={load} allergies={patient.allergies} />
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
