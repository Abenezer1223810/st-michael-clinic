import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/States';

const empty = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  age: '',
  phone: '',
  address: '',
};

export default function PatientForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  const validate = () => {
    const er = {};
    if (!form.fullName.trim()) er.fullName = 'Full name is required.';
    if (!form.gender) er.gender = 'Select a gender.';
    if (!form.dateOfBirth && !form.age) er.dateOfBirth = 'Provide date of birth or age.';
    if (form.phone && !/^[0-9+\s-]{7,}$/.test(form.phone.trim())) er.phone = 'Enter a valid phone number.';
    if (form.age && (isNaN(form.age) || Number(form.age) < 0 || Number(form.age) > 130)) er.age = 'Enter a valid age.';
    return er;
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
      });
      toast.success(message || 'Patient registered successfully.');
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
        title="Register New Patient"
        subtitle="A unique patient ID will be generated automatically"
        icon={UserPlus}
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required error={errors.fullName} className="sm:col-span-2">
              <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Abebe Kebede" />
            </Field>

            <Field label="Gender" required error={errors.gender}>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select…</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </Field>

            <Field label="Date of Birth" error={errors.dateOfBirth}>
              <input type="date" className="input" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </Field>

            <Field label="Age" hint="If date of birth is unknown" error={errors.age}>
              <input type="number" min="0" max="130" className="input" value={form.age} onChange={set('age')} placeholder="e.g. 34" />
            </Field>

            <Field label="Phone Number" required error={errors.phone}>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="e.g. 0911 234 567" />
            </Field>

            <Field label="Address" className="sm:col-span-2">
              <input className="input" value={form.address} onChange={set('address')} placeholder="e.g. Bole, Addis Ababa" />
            </Field>
          </div>

          {errors.form && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{errors.form}</p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner /> : <UserPlus className="h-4 w-4" />}
              {saving ? 'Registering…' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
