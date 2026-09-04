import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { sickLeaveService } from '../../services/sickLeaveService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Spinner } from '../ui/States';
import { SickLeavePrint } from '../print/SickLeavePrint';

function toInputDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function SickLeaveModal({ open, onClose, visit, consultation, onCreated }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open) return;
    const today = toInputDate(new Date());
    setFromDate(today);
    setToDate(today);
    setDiagnosis(consultation?.diagnosis || '');
    setNotes(consultation?.chiefComplaint ? `Chief complaint: ${consultation.chiefComplaint}` : '');
    setError(null);
    setErrors({});
    setPreview(null);
  }, [open, consultation]);

  const daysBetween = () => {
    if (!fromDate || !toDate) return 0;
    const a = new Date(fromDate);
    const b = new Date(toDate);
    if (isNaN(a) || isNaN(b) || b < a) return 0;
    return Math.floor((b - a) / 86400000) + 1;
  };

  const validate = () => {
    const er = {};
    if (!fromDate) er.fromDate = t('Select a start date.');
    if (!toDate) er.toDate = t('Select an end date.');
    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) er.toDate = t('End date must be after start date.');
    if (!diagnosis.trim()) er.diagnosis = t('Diagnosis is required.');
    if (Object.keys(er).length) setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const { sickLeave, message } = await sickLeaveService.create({
        visitId: visit?.id,
        fromDate,
        toDate,
        numberOfDays: daysBetween(),
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
      });
      toast.success(message || t('Sick leave certificate created.'));
      setPreview(sickLeave);
      onCreated?.(sickLeave);
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
        title={t('Create Sick Leave Certificate')}
        subtitle={t('Issue a medical certificate excusing the patient from work or school')}
        icon={FileText}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={onClose}>
              {t('Cancel')}
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Spinner /> : t('Generate Certificate')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('From Date')} required error={errors.fromDate}>
              <input type="date" className="input" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setErrors((er) => ({ ...er, fromDate: null })); }} />
            </Field>
            <Field label={t('To Date')} required error={errors.toDate}>
              <input type="date" className="input" value={toDate} onChange={(e) => { setToDate(e.target.value); setErrors((er) => ({ ...er, toDate: null })); }} />
            </Field>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/50">
            <span className="text-slate-500">{t('Number of Days')}: </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{daysBetween()}</span>
          </div>

          <Field label={t('Diagnosis / Reason')} required error={errors.diagnosis}>
            <textarea
              className="input min-h-[80px]"
              value={diagnosis}
              onChange={(e) => { setDiagnosis(e.target.value); setErrors((er) => ({ ...er, diagnosis: null })); }}
              placeholder={t('e.g. Acute gastroenteritis, malaria, etc.')}
            />
          </Field>

          <Field label={t('Notes')} hint={t('Optional')}>
            <textarea
              className="input min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('Additional instructions (optional)')}
            />
          </Field>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
        </div>
      </Modal>

      {preview && <SickLeavePrint sickLeave={preview} onClose={closeAll} />}
    </>
  );
}
