import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Phone, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/States';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const empty = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  age: '',
  phone: '',
  address: '',
  subCity: '',
  woreda: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  relationshipToPatient: '',
  allergies: [],
};

const emptyAllergy = { category: '', name: '', severity: '', reaction: '' };

const ALLERGY_CATEGORIES = ['Drug', 'Food', 'Environmental'];
const ALLERGY_SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];
const ALLERGEN_SUGGESTIONS = {
  Drug: ['Penicillin', 'Aspirin', 'Sulfa drugs', 'Ibuprofen', 'Codeine'],
  Food: ['Nuts', 'Shellfish', 'Milk', 'Eggs', 'Wheat'],
  Environmental: ['Dust', 'Pollen', 'Latex', 'Mold', 'Pet dander'],
};

export default function PatientForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteAllergyIndex, setDeleteAllergyIndex] = useState(null);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: null }));
  };

  const validate = () => {
    const er = {};
    if (!form.fullName.trim()) er.fullName = t('Full name is required.');
    if (!form.gender) er.gender = t('Select a gender.');
    if (!form.dateOfBirth && !form.age) er.dateOfBirth = t('Provide date of birth or age.');
    if (form.phone && !/^[0-9+\s-]{7,}$/.test(form.phone.trim())) er.phone = t('Enter a valid phone number.');
    if (
      form.emergencyContactPhone &&
      !/^[0-9+\s-]{7,}$/.test(form.emergencyContactPhone.trim())
    )
      er.emergencyContactPhone = t('Enter a valid phone number.');
    if (form.age && (isNaN(form.age) || Number(form.age) < 0 || Number(form.age) > 130)) er.age = t('Enter a valid age.');

    const allergyErrors = {};
    form.allergies.forEach((a, idx) => {
      const filled = a.category || a.name || a.severity || a.reaction;
      if (!filled) return;
      if (!a.category) allergyErrors[idx] = { ...allergyErrors[idx], category: t('Select a category.') };
      if (!a.name.trim()) allergyErrors[idx] = { ...allergyErrors[idx], name: t('Enter the allergen.') };
      if (!a.severity) allergyErrors[idx] = { ...allergyErrors[idx], severity: t('Select a severity.') };
    });
    if (Object.keys(allergyErrors).length) er.allergies = allergyErrors;
    return er;
  };

  const setAllergy = (idx, key, value) => {
    setForm((f) => ({
      ...f,
      allergies: f.allergies.map((a, i) => (i === idx ? { ...a, [key]: value } : a)),
    }));
    setErrors((er) => {
      const next = { ...er };
      if (next.allergies) {
        const ae = { ...next.allergies };
        if (ae[idx]) {
          ae[idx] = { ...ae[idx], [key]: '' };
          if (!Object.keys(ae[idx]).length) delete ae[idx];
          next.allergies = ae;
        }
      }
      return next;
    });
  };

  const addAllergy = () => {
    setForm((f) => ({ ...f, allergies: [...f.allergies, { ...emptyAllergy }] }));
  };

  const handleRequestRemoveAllergy = (idx) => {
    if (form.allergies[idx]?.name?.trim()) {
      setDeleteAllergyIndex(idx);
    } else {
      removeAllergy(idx);
    }
  };

  const confirmRemoveAllergy = () => {
    if (deleteAllergyIndex !== null) {
      removeAllergy(deleteAllergyIndex);
      setDeleteAllergyIndex(null);
    }
  };

  const removeAllergy = (idx) => {
    setForm((f) => ({ ...f, allergies: f.allergies.filter((_, i) => i !== idx) }));
    setErrors((er) => {
      const next = { ...er };
      if (next.allergies) {
        const ae = { ...next.allergies };
        delete ae[idx];
        next.allergies = Object.keys(ae).length ? ae : '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    if (Object.keys(er).length) {
      setErrors(er);
      return;
    }
    setSaving(true);
    try {
      const { patient, message } = await patientService.create({
        fullName: form.fullName.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
        age: form.age ? Number(form.age) : null,
        phone: form.phone.trim(),
        address: form.address.trim(),
        subCity: form.subCity.trim(),
        woreda: form.woreda.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        relationshipToPatient: form.relationshipToPatient.trim(),
        allergies: form.allergies
          .filter((a) => a.category || a.name || a.severity || a.reaction)
          .map((a) => ({
            category: a.category,
            name: a.name.trim(),
            severity: a.severity,
            reaction: a.reaction.trim(),
          })),
      });
      toast.success(message || t('Patient registered successfully.'));
      navigate(`/patients/${patient.id}?registered=1`);
    } catch (err) {
      toast.error(err.message);
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('Register New Patient')}
        subtitle={t('A unique patient ID will be generated automatically')}
        icon={UserPlus}
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Full Name')} required error={errors.fullName} className="sm:col-span-2">
              <input className="input" value={form.fullName} onChange={set('fullName')} placeholder={t('e.g. Abebe Kebede')} />
            </Field>

            <Field label={t('Gender')} required error={errors.gender}>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">{t('Select…')}</option>
                <option value="Male">{t('Male')}</option>
                <option value="Female">{t('Female')}</option>
              </select>
            </Field>

            <Field label={t('Date of Birth')} error={errors.dateOfBirth}>
              <input type="date" className="input" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </Field>

            <Field label={t('Age')} hint={t('If date of birth is unknown')} error={errors.age}>
              <input type="number" min="0" max="130" className="input" value={form.age} onChange={set('age')} placeholder={t('e.g. 34')} />
            </Field>

            <Field label={t('Phone Number')} required error={errors.phone}>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder={t('e.g. 0911 234 567')} />
            </Field>

            <Field label={t('Address')} className="sm:col-span-2">
              <input className="input" value={form.address} onChange={set('address')} placeholder={t('e.g. Bole, Addis Ababa')} />
            </Field>

            <Field label={t('Sub City')}>
              <input className="input" value={form.subCity} onChange={set('subCity')} placeholder={t('e.g. Bole')} />
            </Field>

            <Field label={t('Woreda')}>
              <input className="input" value={form.woreda} onChange={set('woreda')} placeholder={t('e.g. Woreda 03')} />
            </Field>

            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 border-t border-slate-100 pt-5">
                <Phone className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-slate-800">{t('Emergency & Contact Information')}</h2>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">{t('Optional')}</span>
              </div>
            </div>

            <Field
              label={t('Next of Kin / Emergency Contact Name')}
              hint={t('Optional')}
              error={errors.emergencyContactName}
              className="sm:col-span-2"
            >
              <input
                className="input"
                value={form.emergencyContactName}
                onChange={set('emergencyContactName')}
                placeholder={t('e.g. Sara Kebede')}
              />
            </Field>

            <Field
              label={t('Emergency Contact Phone Number')}
              hint={t('Optional')}
              error={errors.emergencyContactPhone}
            >
              <input
                className="input"
                value={form.emergencyContactPhone}
                onChange={set('emergencyContactPhone')}
                placeholder={t('e.g. 0911 987 654')}
              />
            </Field>

            <Field
              label={t('Relationship to Patient')}
              hint={t('Optional')}
              error={errors.relationshipToPatient}
            >
              <input
                className="input"
                value={form.relationshipToPatient}
                onChange={set('relationshipToPatient')}
                placeholder={t('e.g. Wife, Father, Sister…')}
              />
            </Field>

            {/* ================= ALLERGIES ================= */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 border-t border-slate-100 pt-5">
                <AlertTriangle className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-slate-800">{t('Allergies')}</h2>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">{t('Optional')}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {t('Record known allergies by category, severity and reaction. This information is shown during OPD, laboratory and prescriptions.')}
              </p>
            </div>

            {form.allergies.length === 0 && (
              <p className="text-sm text-slate-400 sm:col-span-2">{t('No allergies recorded yet.')}</p>
            )}

            {form.allergies.map((a, idx) => {
              const aerr = errors.allergies?.[idx] || {};
              return (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t('Allergy {{count}}', { count: idx + 1 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRequestRemoveAllergy(idx)}
                      className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={t('Remove allergy')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label={t('Category')} required error={aerr.category}>
                      <select
                        className="input"
                        value={a.category}
                        onChange={(e) => setAllergy(idx, 'category', e.target.value)}
                      >
                        <option value="">{t('Select…')}</option>
                        {ALLERGY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{t(c)}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t('Allergen')} required error={aerr.name} className="sm:col-span-2">
                      <input
                        className="input"
                        value={a.name}
                        onChange={(e) => setAllergy(idx, 'name', e.target.value)}
                        placeholder={t('e.g. Penicillin, Nuts, Dust')}
                      />
                    </Field>
                  </div>
                  {a.category && (
                    <div className="mb-3 mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400">{t('Common:')}</span>
                      {ALLERGEN_SUGGESTIONS[a.category].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setAllergy(idx, 'name', sug)}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                            a.name === sug
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t('Severity')} required error={aerr.severity}>
                      <select
                        className="input"
                        value={a.severity}
                        onChange={(e) => setAllergy(idx, 'severity', e.target.value)}
                      >
                        <option value="">{t('Select…')}</option>
                        {ALLERGY_SEVERITIES.map((s) => (
                          <option key={s} value={s}>{t(s)}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t('Reaction')} hint={t('e.g. rash, swelling, anaphylaxis')}>
                      <input
                        className="input"
                        value={a.reaction}
                        onChange={(e) => setAllergy(idx, 'reaction', e.target.value)}
                        placeholder={t('Describe the reaction')}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}

            <div className="sm:col-span-2">
              <button type="button" className="btn-secondary w-full" onClick={addAllergy}>
                <Plus className="h-4 w-4" /> {t('Add Allergy')}
              </button>
            </div>
          </div>

          {errors.form && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{errors.form}</p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              {t('Cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner /> : <UserPlus className="h-4 w-4" />}
              {saving ? t('Registering…') : t('Register Patient')}
            </button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={deleteAllergyIndex !== null}
        onClose={() => setDeleteAllergyIndex(null)}
        onConfirm={confirmRemoveAllergy}
        title={t('Remove Allergy Record?')}
        message={
          deleteAllergyIndex !== null && form.allergies[deleteAllergyIndex]?.name
            ? t('Are you sure you want to remove the allergy record for {{name}}?', {
                name: form.allergies[deleteAllergyIndex].name,
              })
            : t('Are you sure you want to remove this allergy entry?')
        }
        confirmText={t('Yes, Remove')}
        tone="danger"
      />
    </div>
  );
}
