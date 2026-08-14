import { Printer, X } from 'lucide-react';

export const CLINIC = {
  name: 'St. Michael Medium Clinic',
  phone: '+251 11 111 1111',
  address: 'Bole Road, Addis Ababa, Ethiopia',
  email: 'info@stmichaelclinic.et',
};

export function PrintShell({ title, children, onClose, printLabel = 'Print' }) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            {printLabel}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>
      <div id="print-area" className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-2xl print:rounded-none print:p-0">
        {children}
      </div>
    </div>
  );
}

export function ClinicHeader({ title }) {
  return (
    <div className="mb-6 flex items-start justify-between border-b-2 border-brand-700 pb-4">
      <div>
        <h1 className="text-xl font-bold text-brand-800">{CLINIC.name}</h1>
        <p className="mt-0.5 text-xs text-slate-500">{CLINIC.address}</p>
        <p className="text-xs text-slate-500">
          Tel: {CLINIC.phone} &nbsp;|&nbsp; {CLINIC.email}
        </p>
      </div>
      <div className="text-right">
        <span className="inline-flex items-center rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-bold text-white">
          {title}
        </span>
      </div>
    </div>
  );
}

export function PrintRow({ label, value, bold = false }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 shrink-0 font-medium text-slate-500">{label}</span>
      <span className={bold ? 'font-semibold text-slate-800' : 'text-slate-700'}>{value || '—'}</span>
    </div>
  );
}

export function PrintFieldGrid({ patient, extra = [] }) {
  const items = [
    ['Patient Name', patient?.fullName],
    ['Patient ID', patient?.id],
    ['Gender', patient?.gender],
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
