import { User, Phone, MapPin, Hash, CalendarDays, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { computeAge } from '../utils/format';

export function PatientHeader({ patient, visitNumber, consultationNumber, right }) {
  const { t } = useTranslation();
  if (!patient) return null;
  const age = patient.age ?? computeAge(patient.dateOfBirth);

  return (
    <div className="card overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600" />
      <div className="bg-gradient-to-r from-brand-50/70 via-cyan-50/40 to-transparent p-4 dark:from-brand-500/10 dark:via-cyan-500/5 dark:to-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-600 text-white shadow-lg shadow-brand-500/30">
              <User className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{patient.fullName}</h2>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-600/20 dark:bg-slate-900 dark:text-brand-400">{patient.id}</span>
                {patient.gender && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                    {t(patient.gender)}
                  </span>
                )}
                {age !== null && age !== undefined && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                    {age} {t('yrs')}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                {patient.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {patient.phone}
                  </span>
                )}
                {patient.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {patient.address}
                  </span>
                )}
                {patient.registrationDate && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {t('Registered')} {patient.registrationDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {visitNumber && (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('Visit No.')}</p>
                <p className="text-sm font-bold text-brand-700 dark:text-brand-400">{visitNumber}</p>
              </div>
            )}
            {consultationNumber && (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('Consultation')}</p>
                <p className="text-sm font-bold text-brand-700 dark:text-brand-400">{consultationNumber}</p>
              </div>
            )}
            {right}
          </div>
        </div>
      </div>

      {patient.allergies?.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-amber-200/70 bg-amber-50/80 px-4 py-2 text-xs dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> {t('Allergies:')}
          </span>
          {patient.allergies.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-amber-900 dark:text-amber-300">
              <span className="font-medium">{a.name}</span>
              <span className="text-amber-700/80 dark:text-amber-500/80">({t(a.severity)})</span>
              {i < patient.allergies.length - 1 && <span className="text-amber-400">·</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
