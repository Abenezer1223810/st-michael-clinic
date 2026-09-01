import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { visitService } from '../services/visitService';
import { queueService } from '../services/queueService';
import { useToast } from '../context/ToastContext';
import { Modal } from './ui/Modal';
import { Field } from './ui/Field';
import { Spinner } from './ui/States';

const SERVICES = ['OPD', 'Internal Medicine', 'Pediatrics', 'Gynecology', 'Dermatology'];

export function CreateVisitModal({ open, onClose, patient, onCreated }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [service, setService] = useState('OPD');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [addToQueue, setAddToQueue] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setService('OPD');
      setReason('');
      setPriority('NORMAL');
      setAddToQueue(true);
      setErrors({});
    }
  }, [open]);

  const handleSubmit = async () => {
    const er = {};
    if (!patient) er.form = t('Please select a patient first.');
    if (!service) er.service = t('Select a department / service.');
    if (!reason.trim()) er.reason = t('A visit reason is helpful for the doctor.');
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const { visit, message } = await visitService.create({
        patientId: patient.id,
        service,
        reason: reason.trim(),
      });
      toast.success(message ? t(message) : t('Visit created successfully.'));
      if (addToQueue) {
        try {
          const q = await queueService.add(visit.id, priority);
          toast.success(q.message ? t(q.message) : t('Patient added to OPD queue.'));
        } catch (e) {
          toast.error(e.message ? t(e.message) : e.message);
        }
      }
      onCreated?.(visit);
      onClose();
    } catch (e) {
      toast.error(e.message ? t(e.message) : e.message);
      setErrors({ form: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Create Visit')}
      subtitle={patient ? `${patient.id} · ${patient.fullName}` : t('Select a patient')}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Spinner /> : t('Create Visit')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('Department / Service')} required error={errors.service}>
          <select className="input" value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Visit Reason')} required error={errors.reason}>
          <textarea
            className="input"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('e.g. Fever and headache for 2 days')}
          />
        </Field>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={addToQueue}
              onChange={(e) => setAddToQueue(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {t('Add patient to OPD queue')}
          </label>
          {addToQueue && (
            <div className="mt-3">
              <Field label={t('Queue Priority')}>
                <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="NORMAL">{t('Normal')}</option>
                  <option value="URGENT">{t('Urgent')}</option>
                  <option value="EMERGENCY">{t('Emergency')}</option>
                </select>
              </Field>
            </div>
          )}
        </div>
        {errors.form && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{t(errors.form)}</p>}
      </div>
    </Modal>
  );
}
