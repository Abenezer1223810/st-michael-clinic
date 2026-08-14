import { User, Phone, MapPin, Hash, CalendarDays } from 'lucide-react';
import { computeAge } from '../utils/format';

export function PatientHeader({ patient, visitNumber, consultationNumber, right }) {
  if (!patient) return null;
  const age = patient.age ?? computeAge(patient.dateOfBirth);

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">{patient.fullName}</h2>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{patient.id}</span>
              {patient.gender && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {patient.gender}
                </span>
              )}
              {age !== null && age !== undefined && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {age} yrs
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
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
                  <CalendarDays className="h-3 w-3" /> Registered {patient.registrationDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visitNumber && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visit No.</p>
              <p className="text-sm font-bold text-slate-700">{visitNumber}</p>
            </div>
          )}
          {consultationNumber && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Consultation</p>
              <p className="text-sm font-bold text-slate-700">{consultationNumber}</p>
            </div>
          )}
          {right}
        </div>
      </div>
    </div>
  );
}
