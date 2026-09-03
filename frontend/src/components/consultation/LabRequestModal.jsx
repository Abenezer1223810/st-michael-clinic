import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { LaboratoryOrderForm } from '../lab/LaboratoryOrderForm';

export function LabRequestModal({ open, onClose, visitId, patient, onRequested }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError(null);
  }, [open]);

  const handleSubmit = async (orderPayload) => {
    const testIds = orderPayload?.selectedTests || selected;
    if (!testIds || testIds.length === 0) {
      setError(t('Select at least one test.'));
      return;
    }
    setSaving(true);
    try {
      const { message } = await laboratoryService.createRequest(visitId, testIds);
      const totalAmount = orderPayload?.billing?.totalETB;
      toast.success(
        message ||
          t('Laboratory request created for {{count}} test(s) ({{total}} ETB).', {
            count: testIds.length,
            total: totalAmount || '',
          })
      );
      onRequested?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
      setError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Clinical Laboratory Order Station')}
      subtitle={t('Michael Medium Clinic diagnostic catalog with bundled pricing (ETB)')}
      icon={FlaskConical}
      size="xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <LaboratoryOrderForm
          selectedTests={selected}
          onSelectionChange={setSelected}
          onSubmit={handleSubmit}
          isSubmitting={saving}
          patient={patient}
          mode="order"
          showBilling={true}
        />
      </div>
    </Modal>
  );
}

