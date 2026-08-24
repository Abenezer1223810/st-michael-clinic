import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pill, Plus, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { prescriptionService } from '../../services/prescriptionService';
import { catalogService } from '../../services/catalogService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Spinner } from '../ui/States';
import { PrescriptionPrint } from '../print/PrescriptionPrint';

const emptyMed = {
  medicine: '',
  dosage: '',
  frequency: '',
  duration: '',
  route: 'Oral',
  instructions: '',
  notes: '',
};

const DRUG_CLASS_KEYWORDS = {
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'clavulanate'],
  aspirin: ['aspirin', 'acetylsalicylic'],
  sulfa: ['sulfa', 'sulfamethoxazole', 'cotrimoxazole', 'septrin'],
  cephalosporin: ['ceftriaxone', 'cefixime', 'cefalexin', 'cephalexin'],
};

const matchesMedicine = (allergen, medicineName) => {
  const med = String(medicineName || '').toLowerCase();
  const aller = String(allergen || '').toLowerCase().trim();
  if (!med || !aller) return false;
  if (med.includes(aller) || aller.includes(med)) return true;
  for (const [cls, keywords] of Object.entries(DRUG_CLASS_KEYWORDS)) {
    if (aller.includes(cls)) {
      if (keywords.some((k) => med.includes(k))) return true;
    }
  }
  return false;
};

export function PrescriptionModal({ open, onClose, visitId, onCreated, allergies }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [catalog, setCatalog] = useState([]);
  const [meds, setMeds] = useState([{ ...emptyMed }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const drugAllergies = (allergies || []).filter((a) => a.category === 'Drug');

  const warnFor = (idx) =>
    drugAllergies.filter((a) => matchesMedicine(a.name, meds[idx]?.medicine));

  useEffect(() => {
    if (!open) return;
    setMeds([{ ...emptyMed }]);
    setError(null);
    setErrors({});
    setPreview(null);
    catalogService.medicines().then((d) => setCatalog(d.medicines)).catch(() => {});
  }, [open]);

  const updateMed = (idx, key, value) => {
    setMeds((prev) => {
      const next = prev.map((m, i) => (i === idx ? { ...m, [key]: value } : m));
      if (key === 'medicine') {
        const cat = catalog.find((c) => c.name === value);
        if (cat) {
          next[idx].dosage = next[idx].dosage || cat.defaultDosage || '';
          next[idx].route = cat.defaultRoute || 'Oral';
        }
      }
      return next;
    });
    if (errors[idx]?.[key]) {
      setErrors((prev) => ({ ...prev, [idx]: { ...prev[idx], [key]: null } }));
    }
  };

  const addMed = () => setMeds((prev) => [...prev, { ...emptyMed }]);
  const removeMed = (idx) => {
    setMeds((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const validate = () => {
    const fieldErrors = {};
    meds.forEach((m, idx) => {
      if (m.medicine) {
        if (!m.dosage) fieldErrors[idx] = { ...fieldErrors[idx], dosage: t('Dosage is required.') };
        if (!m.frequency) fieldErrors[idx] = { ...fieldErrors[idx], frequency: t('Frequency is required.') };
        if (!m.duration) fieldErrors[idx] = { ...fieldErrors[idx], duration: t('Duration is required.') };
      }
    });
    setErrors(fieldErrors);
    const anyFilled = meds.some((m) => m.medicine);
    if (!anyFilled) return t('Add at least one medicine.');
    if (Object.keys(fieldErrors).length > 0) return t('Please fix the highlighted fields.');
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { prescription, message } = await prescriptionService.create(
        visitId,
        meds.filter((m) => m.medicine)
      );
      toast.success(message || t('Prescription created.'));
      setPreview(prescription);
      onCreated?.(prescription);
    } catch (e) {
      toast.error(e.message);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const closeAll = () => {
    setPreview(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !preview}
        onClose={onClose}
        title={t('Create Prescription')}
        subtitle={t('Add one or more medicines to the prescription')}
        icon={Pill}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={onClose}>
              {t('Cancel')}
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Spinner /> : t('Create Prescription')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {drugAllergies.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">{t('Known drug allergies')}</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  {drugAllergies.map((a) => `${a.name} (${t(a.severity)})`).join(' · ')}
                  {drugAllergies.some((a) => a.reaction) && ` · ${t('Reactions')}: ${drugAllergies.map((a) => a.reaction).filter(Boolean).join(', ')}`}
                </p>
              </div>
            </div>
          )}

          {meds.map((m, idx) => {
            const warnings = warnFor(idx);
            return (
            <div key={idx} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('Medicine {{count}}', { count: idx + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() => removeMed(idx)}
                  disabled={meds.length === 1}
                  className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('Medicine')} required className="sm:col-span-2">
                  <input
                    className="input"
                    list="medicine-catalog"
                    value={m.medicine}
                    onChange={(e) => updateMed(idx, 'medicine', e.target.value)}
                    placeholder={t('Select or type a medicine')}
                  />
                </Field>
                {warnings.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                      <span>
                        {t('Patient has a known allergy to this medicine:')}{' '}
                        <span className="font-semibold">
                          {warnings.map((a) => `${a.name} (${t(a.severity)})`).join(', ')}
                        </span>
                        {warnings.some((a) => a.reaction) && ` — ${warnings.map((a) => a.reaction).filter(Boolean).join('; ')}`}. {t('Review before prescribing.')}
                      </span>
                    </p>
                  </div>
                )}
                <Field label={t('Dosage')} required error={errors[idx]?.dosage}>
                  <input className="input" value={m.dosage} onChange={(e) => updateMed(idx, 'dosage', e.target.value)} placeholder={t('e.g. 500 mg')} />
                </Field>
                <Field label={t('Frequency')} required error={errors[idx]?.frequency}>
                  <input className="input" value={m.frequency} onChange={(e) => updateMed(idx, 'frequency', e.target.value)} placeholder={t('e.g. 3 times daily')} />
                </Field>
                <Field label={t('Duration')} required error={errors[idx]?.duration}>
                  <input className="input" value={m.duration} onChange={(e) => updateMed(idx, 'duration', e.target.value)} placeholder={t('e.g. 5 days')} />
                </Field>
                <Field label={t('Route')}>
                  <select className="input" value={m.route} onChange={(e) => updateMed(idx, 'route', e.target.value)}>
                    {['Oral', 'IV', 'IM', 'Subcutaneous', 'Topical', 'Inhalation', 'Intravenous'].map((r) => (
                      <option key={r}>{t(r)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('Instructions')} className="sm:col-span-2">
                  <input className="input" value={m.instructions} onChange={(e) => updateMed(idx, 'instructions', e.target.value)} placeholder={t('e.g. After meals')} />
                </Field>
              </div>
            </div>
            );
          })}

          <datalist id="medicine-catalog">
            {catalog.map((c) => (
              <option key={c.id} value={c.name}>
                {c.defaultDosage} · {c.form}
              </option>
            ))}
          </datalist>

          <button type="button" className="btn-secondary w-full" onClick={addMed}>
            <Plus className="h-4 w-4" /> {t('Add Another Medicine')}
          </button>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      </Modal>

      {preview && (
        <PrescriptionPrint prescription={preview} onClose={closeAll} />
      )}
    </>
  );
}
