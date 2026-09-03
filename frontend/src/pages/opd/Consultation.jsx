import { useEffect, useState, useMemo } from 'react';
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
  AlertTriangle,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Scale,
  Ruler,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
  PauseCircle,
} from 'lucide-react';
import { visitService } from '../../services/visitService';
import { opdService } from '../../services/opdService';
import { useToast } from '../../context/ToastContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState, Spinner } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { LabRequestModal } from '../../components/consultation/LabRequestModal';
import { ProcedureRequestModal } from '../../components/consultation/ProcedureRequestModal';
import { PrescriptionModal } from '../../components/consultation/PrescriptionModal';
import { LabDoctorCommunication } from '../../components/lab/LabDoctorCommunication';
import { formatDateTime, formatDate } from '../../utils/format';
import { ConsultationPrint } from '../../components/print/ConsultationPrint';

const EMPTY_VITALS = {
  bloodPressure: '',
  pulse: '',
  temperature: '',
  respiratoryRate: '',
  weight: '',
  height: '',
  spo2: '',
};

const EMPTY_CLINICAL = {
  chiefComplaint: '',
  medicalHistory: '',
  clinicalExamination: '',
  diagnosis: '',
  secondaryDiagnosis: '',
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
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holding, setHolding] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [clinical, setClinical] = useState(EMPTY_CLINICAL);
  const [vitalsErrors, setVitalsErrors] = useState({});
  const [activeTab, setActiveTab] = useState('assessment'); // 'assessment' | 'orders' | 'history'

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
            chiefComplaint: d.consultation.chiefComplaint || d.visit?.reason || '',
            medicalHistory: d.consultation.medicalHistory || '',
            clinicalExamination: d.consultation.clinicalExamination || '',
            diagnosis: d.consultation.diagnosis || '',
            secondaryDiagnosis: d.consultation.secondaryDiagnosis || '',
            treatmentRecommendation: d.consultation.treatmentRecommendation || '',
            doctorNotes: d.consultation.doctorNotes || '',
            followUp: d.consultation.followUp || '',
            referral: d.consultation.referral || '',
          });
        } else if (d.visit?.reason) {
          setClinical((prev) => ({ ...prev, chiefComplaint: d.visit.reason }));
        }

        // Fetch patient history
        if (d.visit?.patientId) {
          opdService
            .getConsultation(visitId)
            .then((res) => {
              if (res?.history) setHistoryData(res.history);
            })
            .catch(() => {});
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId]);

  // Live BMI Calculation
  const liveBmi = useMemo(() => {
    const h = parseFloat(vitals.height);
    const w = parseFloat(vitals.weight);
    if (h > 0 && w > 0) {
      const hM = h / 100;
      const bmi = Number((w / (hM * hM)).toFixed(1));
      let category = 'Normal';
      let tone = 'emerald';
      if (bmi < 18.5) {
        category = 'Underweight';
        tone = 'sky';
      } else if (bmi < 25.0) {
        category = 'Normal';
        tone = 'emerald';
      } else if (bmi < 30.0) {
        category = 'Overweight';
        tone = 'amber';
      } else {
        category = 'Obese';
        tone = 'rose';
      }
      return { bmi, category, tone };
    }
    return null;
  }, [vitals.height, vitals.weight]);

  const validateVitals = () => {
    const errs = {};
    const checks = [
      { key: 'bloodPressure', test: (v) => v && !/^\d{2,3}\/\d{2,3}$/.test(v), msg: t('Use format 120/80.') },
      { key: 'pulse', test: (v) => v && (!/^\d+$/.test(v) || Number(v) < 30 || Number(v) > 220), msg: t('Between 30 and 220 bpm.') },
      { key: 'temperature', test: (v) => v && (!/^\d+(\.\d+)?$/.test(v) || Number(v) < 30 || Number(v) > 45), msg: t('Between 30 and 45°C.') },
      { key: 'respiratoryRate', test: (v) => v && (!/^\d+$/.test(v) || Number(v) < 8 || Number(v) > 60), msg: t('Between 8 and 60/min.') },
      { key: 'weight', test: (v) => v && (!/^\d+(\.\d+)?$/.test(v) || Number(v) < 1 || Number(v) > 350), msg: t('Between 1 and 350 kg.') },
      { key: 'height', test: (v) => v && (!/^\d+(\.\d+)?$/.test(v) || Number(v) < 30 || Number(v) > 250), msg: t('Between 30 and 250 cm.') },
      { key: 'spo2', test: (v) => v && (!/^\d+$/.test(v) || Number(v) < 50 || Number(v) > 100), msg: t('Between 50 and 100%.') },
    ];
    for (const c of checks) {
      if (c.test(vitals[c.key])) errs[c.key] = c.msg;
    }
    return errs;
  };

  const saveConsultation = async (silent = false) => {
    const errs = validateVitals();
    if (Object.keys(errs).length > 0) {
      setVitalsErrors(errs);
      toast.error(t('Check the highlighted vital sign values.'));
      return false;
    }
    setSaving(true);
    try {
      if (data.consultation) {
        const { message } = await opdService.saveConsultation(data.consultation.id, { vitals, ...clinical });
        if (!silent) toast.success(message || t('Consultation saved.'));
      } else {
        const created = await opdService.startConsultation(visitId, vitals);
        await opdService.saveConsultation(created.consultation.id, clinical);
        if (!silent) toast.success(t('Consultation started and saved.'));
      }
      load();
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleHoldForLab = async () => {
    const ok = await saveConsultation(true);
    if (!ok) return;

    setHolding(true);
    try {
      const cid = data.consultation?.id || visitId;
      await opdService.holdForLab(cid);
      toast.success(t('Consultation paused. Patient will reappear on your queue when lab results are ready.'));
      navigate('/opd');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setHolding(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!clinical.diagnosis.trim()) {
      toast.error(t('Please enter a diagnosis before completing the consultation.'));
      return;
    }
    const ok = await saveConsultation(true);
    if (!ok) return;

    setCompleting(true);
    try {
      const cid = data.consultation?.id || visitId;
      const { message } = await opdService.completeConsultation(cid);
      toast.success(message || t('Consultation completed successfully.'));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <SkeletonDetail lines={6} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { visit, consultation, labRequests = [], procedures = [], prescriptions = [] } = data;
  const patient = visit.patient;
  const completed = consultation?.status === 'completed';
  const allergies = patient?.allergies || [];
  const drugAllergies = allergies.filter((a) => a.category === 'Drug' || a.severity === 'Severe');

  const setV = (key) => (e) => {
    setVitals((v) => ({ ...v, [key]: e.target.value }));
    setVitalsErrors((prev) => ({ ...prev, [key]: null }));
  };
  const setC = (key) => (e) => setClinical((c) => ({ ...c, [key]: e.target.value }));

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/opd')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4" /> {t('Back to OPD queue')}
        </button>
        <div className="flex items-center gap-2">
          {consultation?.status === 'awaiting_results' && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              {t('Awaiting Lab Results')}
            </span>
          )}
          {consultation?.status === 'ready_for_review' && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse">
              {t('Ready for Review')}
            </span>
          )}
          <StatusBadge status={completed ? 'completed' : 'in_progress'} />
        </div>
      </div>

      <PageHeader
        title={completed ? t('Consultation Completed') : t('Doctor Clinical Consultation')}
        subtitle={`${t(visit.service)} · ${visit.visitNumber} · ${formatDateTime(visit.date)}`}
        icon={Stethoscope}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => navigate(`/patients/${patient.id}`)}>
              <History className="h-4 w-4" /> {t('Patient History')}
            </button>
            <button className="btn-secondary" onClick={() => setPrintOpen(true)} disabled={!consultation}>
              <Printer className="h-4 w-4" /> {t('Print Summary')}
            </button>
          </div>
        }
      />

      <PatientHeader patient={patient} visitNumber={visit.visitNumber} consultationNumber={consultation?.consultationNumber} />

      {/* Prominent Allergy Alert */}
      {allergies.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 animate-pulse" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                {t('Clinical Alert: Known Allergies')}
              </h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {allergies.map((a, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-800 shadow-sm dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
                  >
                    <span className="font-bold">{a.name}</span>
                    <span className="text-rose-500 font-normal">({a.category || 'Drug'} · {a.severity || 'Moderate'})</span>
                    {a.reaction && <span className="text-slate-500 text-[11px]">[{a.reaction}]</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Left 2 Cols: Vitals, Assessment & Diagnosis */}
        <div className="space-y-5 xl:col-span-2">
          {/* Vitals Station */}
          <Card>
            <CardHeader
              title={t('Patient Vital Signs')}
              subtitle={t('Current encounter vitals with automatic BMI')}
              icon={Activity}
              action={
                liveBmi ? (
                  <div className={`flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-bold ${
                    liveBmi.tone === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : liveBmi.tone === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : liveBmi.tone === 'rose'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                  }`}>
                    <span>BMI: {liveBmi.bmi} kg/m²</span>
                    <span>({t(liveBmi.category)})</span>
                  </div>
                ) : null
              }
            />
            <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4">
              <Field label={t('Blood Pressure')} error={vitalsErrors.bloodPressure} hint="mmHg">
                <div className="relative">
                  <input
                    className="input pr-12 font-mono"
                    value={vitals.bloodPressure || ''}
                    onChange={setV('bloodPressure')}
                    placeholder="120/80"
                    disabled={completed}
                  />
                  <Heart className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>

              <Field label={t('Pulse Rate')} error={vitalsErrors.pulse} hint="bpm">
                <div className="relative">
                  <input
                    className="input pr-12 font-mono"
                    value={vitals.pulse || ''}
                    onChange={setV('pulse')}
                    placeholder="72"
                    disabled={completed}
                  />
                  <Activity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>

              <Field label={t('Temperature')} error={vitalsErrors.temperature} hint="°C">
                <div className="relative">
                  <input
                    className="input pr-12 font-mono"
                    value={vitals.temperature || ''}
                    onChange={setV('temperature')}
                    placeholder="36.8"
                    disabled={completed}
                  />
                  <Thermometer className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>

              <Field label={t('Respiratory Rate')} error={vitalsErrors.respiratoryRate} hint="/min">
                <div className="relative">
                  <input
                    className="input pr-12 font-mono"
                    value={vitals.respiratoryRate || ''}
                    onChange={setV('respiratoryRate')}
                    placeholder="18"
                    disabled={completed}
                  />
                  <Wind className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>

              <Field label={t('Weight')} error={vitalsErrors.weight} hint="kg">
                <div className="relative">
                  <input
                    className="input pr-12 font-mono"
                    value={vitals.weight || ''}
                    onChange={setV('weight')}
                    placeholder="70"
                    disabled={completed}
                  />
                  <Scale className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>

              <Field label={t('Height')} error={vitalsErrors.height} hint="cm">
                <div className="relative">
                  <input
                    className="input pr-12 font-mono"
                    value={vitals.height || ''}
                    onChange={setV('height')}
                    placeholder="175"
                    disabled={completed}
                  />
                  <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>

              <Field label={t('Oxygen Saturation')} error={vitalsErrors.spo2} hint="SpO2 %">
                <div className="relative">
                  <input
                    className="input pr-12 font-mono"
                    value={vitals.spo2 || ''}
                    onChange={setV('spo2')}
                    placeholder="98"
                    disabled={completed}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                </div>
              </Field>

              <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('Auto BMI')}</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {liveBmi ? `${liveBmi.bmi} kg/m²` : '—'}
                </span>
                <span className="text-xs text-slate-500">{liveBmi ? t(liveBmi.category) : t('Enter height & weight')}</span>
              </div>
            </div>
          </Card>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'assessment'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <Stethoscope className="h-4 w-4" /> {t('Clinical Assessment & Diagnosis')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <FlaskConical className="h-4 w-4" /> {t('Orders & Lab Results')} (
              {labRequests.length + procedures.length + prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <History className="h-4 w-4" /> {t('Past Medical History Timeline')}
            </button>
          </div>

          {/* TAB 1: Clinical Assessment & Diagnosis */}
          {activeTab === 'assessment' && (
            <Card>
              <CardHeader
                title={t('Clinical Examination & Diagnostic Findings')}
                subtitle={t('Record chief complaint, examination findings, and diagnostic codes')}
                icon={FileText}
              />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label={t('Chief Complaint')} required className="sm:col-span-2">
                  <textarea
                    className="input"
                    rows={2}
                    value={clinical.chiefComplaint}
                    onChange={setC('chiefComplaint')}
                    disabled={completed}
                    placeholder={t('e.g. High fever, chills, and headache for 3 days')}
                  />
                </Field>

                <Field label={t('History of Present Illness / Medical History')}>
                  <textarea
                    className="input"
                    rows={3}
                    value={clinical.medicalHistory}
                    onChange={setC('medicalHistory')}
                    disabled={completed}
                    placeholder={t('Onset, duration, past medical conditions, chronic illnesses')}
                  />
                </Field>

                <Field label={t('Physical Examination Findings')}>
                  <textarea
                    className="input"
                    rows={3}
                    value={clinical.clinicalExamination}
                    onChange={setC('clinicalExamination')}
                    disabled={completed}
                    placeholder={t('General appearance, HEENT, chest, CVS, abdomen, CNS')}
                  />
                </Field>

                <Field label={t('Primary Diagnosis / Working Diagnosis')} required className="sm:col-span-2">
                  <input
                    className="input font-semibold text-brand-900 dark:text-brand-200"
                    value={clinical.diagnosis}
                    onChange={setC('diagnosis')}
                    disabled={completed}
                    placeholder={t('e.g. Acute Malaria (P. falciparum) / Typhoid Fever')}
                  />
                </Field>

                <Field label={t('Secondary / Differential Diagnosis')} className="sm:col-span-2">
                  <input
                    className="input"
                    value={clinical.secondaryDiagnosis || ''}
                    onChange={setC('secondaryDiagnosis')}
                    disabled={completed}
                    placeholder={t('e.g. Mild dehydration secondary to fever')}
                  />
                </Field>

                <Field label={t('Treatment Plan & Recommendations')} className="sm:col-span-2">
                  <textarea
                    className="input"
                    rows={2}
                    value={clinical.treatmentRecommendation}
                    onChange={setC('treatmentRecommendation')}
                    disabled={completed}
                    placeholder={t('Oral hydration, paracetamol for fever, follow-up if symptoms persist')}
                  />
                </Field>

                <Field label={t("Doctor's Confidential Notes")}>
                  <textarea
                    className="input"
                    rows={2}
                    value={clinical.doctorNotes}
                    onChange={setC('doctorNotes')}
                    disabled={completed}
                    placeholder={t('Internal doctor notes and clinical rationale')}
                  />
                </Field>

                <div className="space-y-4">
                  <Field label={t('Follow-up Date / Instructions')}>
                    <input
                      className="input"
                      value={clinical.followUp}
                      onChange={setC('followUp')}
                      disabled={completed}
                      placeholder={t('e.g. Review in 3 days if fever does not subside')}
                    />
                  </Field>
                  <Field label={t('Specialist Referral')}>
                    <input
                      className="input"
                      value={clinical.referral}
                      onChange={setC('referral')}
                      disabled={completed}
                      placeholder={t('e.g. Internal Medicine / St. Paul Hospital')}
                    />
                  </Field>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs text-slate-400">
                  {completed
                    ? t('Consultation is completed and locked for edits.')
                    : t('Edits are saved to the patient record permanently.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => saveConsultation(false)}
                    disabled={saving || completed}
                  >
                    {saving ? <Spinner /> : <Save className="h-4 w-4" />}
                    {saving ? t('Saving…') : t('Save Progress')}
                  </button>

                  {!completed && labRequests.length > 0 && (
                    <button
                      className="btn-secondary border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300"
                      onClick={handleHoldForLab}
                      disabled={holding}
                      title={t('Pause consultation while waiting for laboratory tests')}
                    >
                      {holding ? <Spinner /> : <PauseCircle className="h-4 w-4 text-purple-600" />}
                      {t('Hold for Lab')}
                    </button>
                  )}

                  {!completed && (
                    <button
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                      onClick={handleCompleteConsultation}
                      disabled={completing}
                    >
                      {completing ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                      {t('Complete Consultation')}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: Orders & Lab Results Breakdown */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              {/* Lab Results Table */}
              <Card>
                <CardHeader
                  title={t('Laboratory Orders & Test Results')}
                  subtitle={t('Tests ordered for this encounter and their measured values')}
                  icon={FlaskConical}
                  action={
                    !completed && (
                      <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => setLabModal(true)}>
                        <FlaskConical className="h-3.5 w-3.5" /> {t('Add Lab Order')}
                      </button>
                    )
                  }
                />
                <div className="p-5">
                  {labRequests.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      <FlaskConical className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p>{t('No laboratory tests ordered for this encounter.')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {labRequests.map((req) => (
                        <div key={req.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                          <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{req.requestNumber}</span>
                              <span className="ml-2 text-xs text-slate-400">{formatDateTime(req.date)}</span>
                            </div>
                            <StatusBadge status={req.status} />
                          </div>

                          {req.result?.results?.length > 0 ? (
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400">
                                  <th className="pb-2">{t('Test Name')}</th>
                                  <th className="pb-2">{t('Result Value')}</th>
                                  <th className="pb-2">{t('Unit')}</th>
                                  <th className="pb-2">{t('Reference Range')}</th>
                                  <th className="pb-2">{t('Status')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {req.result.results.map((r, i) => (
                                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <td className="py-2 font-medium text-slate-700 dark:text-slate-200">{r.testName}</td>
                                    <td className="py-2 font-bold text-brand-600 dark:text-brand-400">{r.result || '—'}</td>
                                    <td className="py-2 text-slate-400">{r.unit || '—'}</td>
                                    <td className="py-2 text-slate-400">{r.referenceRange || '—'}</td>
                                    <td className="py-2">
                                      <StatusBadge status={r.status || 'pending'} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <span>{t('Tests pending laboratory analysis.')} ({req.tests?.map((t) => t.name).join(', ')})</span>
                            </div>
                          )}

                          {/* Clinical Lab Communication Component */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <LabDoctorCommunication
                              requestId={req.id}
                              patientName={patient?.fullName}
                              doctorName={user?.name}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Procedures & Injections */}
              <Card>
                <CardHeader
                  title={t('Procedure & Injection Orders')}
                  subtitle={t('Minor procedures, dressings, injections ordered')}
                  icon={Syringe}
                  action={
                    !completed && (
                      <button className="btn-primary !bg-violet-600 hover:!bg-violet-700 !px-3 !py-1.5 text-xs" onClick={() => setProcModal(true)}>
                        <Syringe className="h-3.5 w-3.5" /> {t('Add Procedure')}
                      </button>
                    )
                  }
                />
                <div className="p-5">
                  {procedures.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">{t('No procedures ordered for this encounter.')}</p>
                  ) : (
                    <div className="space-y-3">
                      {procedures.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{p.procedureType}</span>
                            {p.notes && <p className="text-xs text-slate-500 mt-0.5">{p.notes}</p>}
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Prescriptions */}
              <Card>
                <CardHeader
                  title={t('Prescriptions')}
                  subtitle={t('Medications prescribed during this visit')}
                  icon={Pill}
                  action={
                    !completed && (
                      <button className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !px-3 !py-1.5 text-xs" onClick={() => setRxModal(true)}>
                        <Pill className="h-3.5 w-3.5" /> {t('Add Prescription')}
                      </button>
                    )
                  }
                />
                <div className="p-5">
                  {prescriptions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">{t('No prescriptions written for this encounter.')}</p>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.map((rx) => (
                        <div key={rx.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{rx.prescriptionNumber}</span>
                            <span className="text-xs text-slate-400">{formatDateTime(rx.date)}</span>
                          </div>
                          <ul className="space-y-1 text-xs">
                            {rx.medicines?.map((m, idx) => (
                              <li key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span>
                                  <strong>{m.medicine}</strong> ({m.dosage}) · {m.frequency} for {m.duration} [{m.route}]
                                </span>
                                {m.instructions && <span className="text-slate-400 italic">“{m.instructions}”</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: Patient Past Medical History Timeline */}
          {activeTab === 'history' && (
            <Card>
              <CardHeader
                title={t('Lifetime Medical History Timeline')}
                subtitle={t('Previous consultations, diagnoses, and lab results for {{name}}', { name: patient.fullName })}
                icon={History}
              />
              <div className="p-5 space-y-4">
                {historyData?.consultations?.length > 0 ? (
                  historyData.consultations.map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-brand-700 dark:text-brand-300">{formatDate(c.date)} · {c.consultationNumber}</span>
                        <span className="text-slate-500">{c.doctor}</span>
                      </div>
                      <p><strong>{t('Diagnosis')}:</strong> {c.diagnosis || t('No diagnosis recorded')}</p>
                      {c.chiefComplaint && <p className="text-slate-500"><strong>{t('Complaint')}:</strong> {c.chiefComplaint}</p>}
                      {c.treatmentRecommendation && <p className="text-slate-500"><strong>{t('Treatment')}:</strong> {c.treatmentRecommendation}</p>}
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-slate-400">
                    {t('No prior consultation records found for this patient.')}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Summary */}
        <div className="space-y-5">
          {/* Quick Orders Box */}
          <Card>
            <CardHeader title={t('Doctor Orders')} subtitle={t('Create new clinical requests')} icon={Send} />
            <div className="grid grid-cols-1 gap-2.5 p-4">
              <button
                className="btn-primary w-full justify-start shadow-sm"
                onClick={() => setLabModal(true)}
                disabled={completed}
              >
                <FlaskConical className="h-4 w-4" /> {t('Request Laboratory Test')}
              </button>
              <button
                className="btn-primary w-full justify-start !bg-violet-600 hover:!bg-violet-700 shadow-sm"
                onClick={() => setProcModal(true)}
                disabled={completed}
              >
                <Syringe className="h-4 w-4" /> {t('Request Procedure / Injection')}
              </button>
              <button
                className="btn-primary w-full justify-start !bg-emerald-600 hover:!bg-emerald-700 shadow-sm"
                onClick={() => setRxModal(true)}
                disabled={completed}
              >
                <Pill className="h-4 w-4" /> {t('Create Prescription')}
              </button>
            </div>
          </Card>

          {/* Current Orders Summary */}
          <Card>
            <CardHeader title={t('Active Orders Summary')} subtitle={t('Encounter order count')} icon={CheckCircle2} />
            <div className="divide-y divide-slate-100 dark:divide-slate-800 px-4 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                  <FlaskConical className="h-3.5 w-3.5 text-brand-500" /> {t('Lab Tests')}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {labRequests.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                  <Syringe className="h-3.5 w-3.5 text-violet-500" /> {t('Procedures')}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {procedures.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                  <Pill className="h-3.5 w-3.5 text-emerald-500" /> {t('Prescriptions')}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {prescriptions.length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <LabRequestModal open={labModal} onClose={() => setLabModal(false)} visitId={visitId} onRequested={load} />
      <ProcedureRequestModal open={procModal} onClose={() => setProcModal(false)} visitId={visitId} onRequested={load} />
      <PrescriptionModal open={rxModal} onClose={() => setRxModal(false)} visitId={visitId} onCreated={load} allergies={patient?.allergies} />

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
