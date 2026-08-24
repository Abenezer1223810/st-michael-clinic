import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Syringe } from 'lucide-react';
import { procedureService } from '../../services/procedureService';
import { catalogService } from '../../services/catalogService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Spinner } from '../ui/States';

export function ProcedureRequestModal({ open, onClose, visitId, onRequested }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [types, setTypes] = useState([]);
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setType('');
    setNotes('');
    setError(null);
    setLoading(true);
    catalogService
      .procedureTypes()
      .then((d) => {
        setTypes(d.procedureTypes);
        setType(d.procedureTypes[0]?.name || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSubmit = async () => {
    if (!type) {
      setError(t('Select a procedure type.'));
      return;
    }
    setSaving(true);
    try {
      const { message } = await procedureService.create(visitId, type, notes.trim());
      toast.success(message || t('Procedure request created.'));
      onRequested?.();
      onClose();
    } catch (e) {
      toast.error(e.message);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Request Procedure / Injection')}
      subtitle={t('Send a procedure request to the Procedure Room')}
      icon={Syringe}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || loading}>
            {saving ? <Spinner /> : t('Request Procedure')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <Spinner className="mx-auto my-6 h-6 w-6 text-brand-500" />
        ) : (
          <>
            <Field label={t('Procedure Type')} required>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                {types.map((pt) => (
                  <option key={pt.id} value={pt.name}>
                    {t(pt.name)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Notes / Instructions')}>
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('e.g. Diclofenac 75mg IM for fever')}
              />
            </Field>
          </>
        )}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>
    </Modal>
  );
}
