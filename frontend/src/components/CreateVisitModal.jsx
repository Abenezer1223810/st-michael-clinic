import { useEffect, useState } from 'react';
import { visitService } from '../services/visitService';
import { queueService } from '../services/queueService';
import { useToast } from '../context/ToastContext';
import { Modal } from './ui/Modal';
import { Field } from './ui/Field';
import { Spinner } from './ui/States';

const SERVICES = ['OPD', 'Internal Medicine', 'Pediatrics', 'Gynecology', 'Dermatology'];

export function CreateVisitModal({ open, onClose, patient, onCreated }) {
  const toast = useToast();
  const [service, setService] = useState('OPD');
  const [reason, setReason] = useState('');
  const [addToQueue, setAddToQueue] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setService('OPD');
      setReason('');
      setAddToQueue(true);
      setErrors({});
    }
  }, [open]);

  const handleSubmit = async () => {
    const er = {};
    if (!patient) er.form = 'Please select a patient first.';
    if (!service) er.service = 'Select a department / service.';
    if (!reason.trim()) er.reason = 'A visit reason is helpful for the doctor.';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const { visit, message } = await visitService.create({
        patientId: patient.id,
        service,
        reason: reason.trim(),
      });
      toast.success(message || 'Visit created successfully.');
      if (addToQueue) {
        try {
          const q = await queueService.add(visit.id);
          toast.success(q.message || 'Patient added to OPD queue.');
        } catch (e) {
          toast.error(e.message);
        }
      }
      onCreated?.(visit);
      onClose();
    } catch (e) {
      toast.error(e.message);
      setErrors({ form: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Visit"
      subtitle={patient ? `${patient.id} · ${patient.fullName}` : 'Select a patient'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Spinner /> : 'Create Visit'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Department / Service" required error={errors.service}>
          <select className="input" value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Visit Reason" required error={errors.reason}>
          <textarea
            className="input"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Fever and headache for 2 days"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={addToQueue}
            onChange={(e) => setAddToQueue(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Add patient to OPD queue
        </label>
        {errors.form && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{errors.form}</p>}
      </div>
    </Modal>
  );
}
