import { useEffect, useState } from 'react';
import { Pill, Plus, Trash2, Eye } from 'lucide-react';
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

export function PrescriptionModal({ open, onClose, visitId, onCreated }) {
  const toast = useToast();
  const [medicines, setMedicines] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [meds, setMeds] = useState([{ ...emptyMed }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMeds([{ ...emptyMed }]);
    setError(null);
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
  };

  const addMed = () => setMeds((prev) => [...prev, { ...emptyMed }]);
  const removeMed = (idx) => setMeds((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const validate = () => {
    const filled = meds.filter((m) => m.medicine);
    if (filled.length === 0) return 'Add at least one medicine.';
    for (const m of filled) {
      if (!m.dosage) return 'Dosage is required for every medicine.';
      if (!m.frequency) return 'Frequency is required for every medicine.';
      if (!m.duration) return 'Duration is required for every medicine.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    try {
      const { prescription, message } = await prescriptionService.create(
        visitId,
        meds.filter((m) => m.medicine)
      );
      toast.success(message || 'Prescription created.');
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
        title="Create Prescription"
        subtitle="Add one or more medicines to the prescription"
        icon={Pill}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Spinner /> : 'Create Prescription'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {meds.map((m, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Medicine {idx + 1}
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
                <Field label="Medicine" required className="sm:col-span-2">
                  <input
                    className="input"
                    list="medicine-catalog"
                    value={m.medicine}
                    onChange={(e) => updateMed(idx, 'medicine', e.target.value)}
                    placeholder="Select or type a medicine"
                  />
                </Field>
                <Field label="Dosage" required>
                  <input className="input" value={m.dosage} onChange={(e) => updateMed(idx, 'dosage', e.target.value)} placeholder="e.g. 500 mg" />
                </Field>
                <Field label="Frequency" required>
                  <input className="input" value={m.frequency} onChange={(e) => updateMed(idx, 'frequency', e.target.value)} placeholder="e.g. 3 times daily" />
                </Field>
                <Field label="Duration" required>
                  <input className="input" value={m.duration} onChange={(e) => updateMed(idx, 'duration', e.target.value)} placeholder="e.g. 5 days" />
                </Field>
                <Field label="Route">
                  <select className="input" value={m.route} onChange={(e) => updateMed(idx, 'route', e.target.value)}>
                    {['Oral', 'IV', 'IM', 'Subcutaneous', 'Topical', 'Inhalation', 'Intravenous'].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Instructions" className="sm:col-span-2">
                  <input className="input" value={m.instructions} onChange={(e) => updateMed(idx, 'instructions', e.target.value)} placeholder="e.g. After meals" />
                </Field>
              </div>
            </div>
          ))}

          <datalist id="medicine-catalog">
            {catalog.map((c) => (
              <option key={c.id} value={c.name}>
                {c.defaultDosage} · {c.form}
              </option>
            ))}
          </datalist>

          <button type="button" className="btn-secondary w-full" onClick={addMed}>
            <Plus className="h-4 w-4" /> Add Another Medicine
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
