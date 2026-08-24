import { Printer, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CLINIC = {
  name: 'St. Michael Medium Clinic',
  phone: '+251 11 111 1111',
  address: 'Bole Road, Addis Ababa, Ethiopia',
  email: 'info@stmichaelclinic.et',
};

export function ClinicLogo({ className = 'h-12 w-12' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="St. Michael Medium Clinic logo" role="img">
      <rect width="64" height="64" rx="14" fill="#0d9488" />
      <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="#99f6e4" strokeWidth="2" opacity="0.6" />
      <path d="M26 18h4v10h10v4H30v10h-4V32H16v-4h10z" fill="#ffffff" />
      <path d="M38 40h16" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function PrintShell({ title, children, onClose, printLabel = 'Print' }) {
  const { t } = useTranslation();
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{t(title)}</h2>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            {t(printLabel)}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            <X className="h-4 w-4" />
            {t('Close')}
          </button>
        </div>
      </div>
      <div id="print-area" className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-2xl print:rounded-none print:p-0">
        {children}
        <p className="mt-10 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
          {t('Powered by Gravity Technologies PLC')} · {t(CLINIC.name)} · {CLINIC.phone}
        </p>
      </div>
    </div>
  );
}

export function ClinicHeader({ title }) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-brand-700 pb-4">
      <div className="flex items-start gap-3">
        <ClinicLogo />
        <div>
          <h1 className="text-xl font-bold text-brand-800">{t(CLINIC.name)}</h1>
          <p className="mt-0.5 text-xs text-slate-500">{t(CLINIC.address)}</p>
          <p className="text-xs text-slate-500">
            {t('Tel:')} {CLINIC.phone} &nbsp;|&nbsp; {CLINIC.email}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="inline-flex items-center rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-bold text-white">
          {t(title)}
        </span>
      </div>
    </div>
  );
}

export function PrintRow({ label, value, bold = false }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 shrink-0 font-medium text-slate-500">{t(label)}</span>
      <span className={bold ? 'font-semibold text-slate-800' : 'text-slate-700'}>{value || '—'}</span>
    </div>
  );
}

export function PrintFieldGrid({ patient, extra = [] }) {
  const { t } = useTranslation();
  const items = [
    ['Patient Name', patient?.fullName],
    ['Patient ID', patient?.id],
    ['Gender', t(patient?.gender || '')],
    ['Age', patient?.age ?? patient?.age ?? ''],
    ...extra,
  ];
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
      {items.map(([label, value]) => (
        <PrintRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}
