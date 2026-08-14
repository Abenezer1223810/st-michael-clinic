import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/States';

export function LabRequestModal({ open, onClose, visitId, onRequested }) {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError(null);
    setLoading(true);
    laboratoryService
      .getTests()
      .then((d) => setTests(d.tests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Select at least one test.');
      return;
    }
    setSaving(true);
    try {
      const { message } = await laboratoryService.createRequest(visitId, selected);
      toast.success(message || 'Laboratory request created.');
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
      title="Request Laboratory Test"
      subtitle="Select the tests to request for this patient"
      icon={FlaskConical}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Spinner /> : 'Request Tests'}
          </button>
        </>
      }
    >
      {loading ? (
        <Spinner className="mx-auto my-10 h-6 w-6 text-brand-500" />
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {tests.map((t) => (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  selected.includes(t.id)
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {selected.length} test(s) selected
            </p>
          )}
          {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
