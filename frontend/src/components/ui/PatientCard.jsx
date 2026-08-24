import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRound, Phone, MapPin } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { computeAge } from '../../utils/format';

export function PatientCard({ patient, selected, onSelect, status, showProfile = true, className = '' }) {
  const { t } = useTranslation();
  const initials = (patient.fullName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const age = patient.age ?? computeAge(patient.dateOfBirth);

  const body = (
    <>
      <div className="flex flex-1 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-600 text-sm font-bold text-white shadow-sm">
          {initials || <UserRound className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{patient.fullName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium dark:bg-slate-800">{patient.id}</span>
            <span>{patient.gender || '—'}</span>
            {age != null && <span>· {age} {t('y')}</span>}
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Phone className="h-3 w-3" /> {patient.phone || '—'}
            </span>
          </div>
          {patient.address && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400 dark:text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" /> {patient.address}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status && <StatusBadge status={status} />}
        {showProfile && (
          <Link
            to={`/patients/${patient.id}`}
            className="text-xs font-medium text-brand-700 transition hover:text-brand-800 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
            onClick={(e) => e.stopPropagation()}
          >
            {t('Profile')}
          </Link>
        )}
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(patient)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
          selected
            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:bg-brand-500/10'
            : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:bg-slate-800'
        } ${className}`}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-600 ${className}`}
    >
      {body}
    </div>
  );
}
