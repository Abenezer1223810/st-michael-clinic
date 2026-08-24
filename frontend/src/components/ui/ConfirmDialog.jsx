import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || t('Are you sure?')}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {t(confirmLabel)}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-600">{typeof message === 'string' ? t(message) : message}</p>
      </div>
    </Modal>
  );
}
