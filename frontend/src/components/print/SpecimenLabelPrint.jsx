import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../utils/format';
import { PrintShell } from './PrintShell';

export function SpecimenLabelPrint({ sample, request, patient, onClose }) {
  const { t } = useTranslation();

  const pt = patient || request?.patient || {
    fullName: request?.patientName || 'Unknown Patient',
    id: request?.patientId || '—',
  };

  const sampleNumber = sample?.sampleNumber || 'S-000000';
  const barcode = sample?.barcode || sampleNumber.replace('-', '');
  const specimenType = sample?.specimenType || request?.tests?.[0]?.specimenType || 'Whole Blood (EDTA)';
  const collectedAt = sample?.collectedAt || new Date().toISOString();
  const collectedBy = sample?.collectedBy || 'Meron Girma';

  return (
    <PrintShell title="Specimen Barcode Tube Label" onClose={onClose} printLabel="Print Label (50x25mm)">
      <div className="mx-auto max-w-sm rounded-xl border-2 border-dashed border-slate-400 bg-white p-4 shadow-sm">
        {/* Label Container (standard 50mm x 25mm / 2x1 inch tube format) */}
        <div className="space-y-2 border border-slate-900 bg-white p-3 font-mono text-slate-900">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1 text-[11px] font-bold">
            <span>ST. MICHAEL CLINIC LAB</span>
            <span>{request?.requestNumber || request?.id || 'LR-0000'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-black tracking-tight">{pt.fullName}</div>
              <div className="text-[11px] text-slate-700">
                MRN: <span className="font-bold">{pt.id}</span>
                {pt.gender ? ` • ${pt.gender}` : ''}
              </div>
            </div>
            <div className="rounded bg-slate-900 px-2 py-0.5 text-center text-xs font-bold text-white">
              {sampleNumber}
            </div>
          </div>

          {/* Simulated High-Density 1D Barcode */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="flex h-10 w-full items-center justify-center space-x-[2px] bg-white px-2">
              {barcode.split('').map((char, i) => {
                const w = (char.charCodeAt(0) % 3) + 1;
                return (
                  <div
                    key={i}
                    className="h-full bg-slate-900"
                    style={{ width: `${w * 2.5}px` }}
                  />
                );
              })}
              {/* Guard bars */}
              <div className="h-full w-[2px] bg-slate-900" />
              <div className="h-full w-[4px] bg-slate-900" />
              <div className="h-full w-[1px] bg-slate-900" />
              <div className="h-full w-[3px] bg-slate-900" />
            </div>
            <span className="mt-0.5 text-[10px] tracking-widest font-bold">*{barcode}*</span>
          </div>

          <div className="border-t border-slate-900 pt-1 text-[10px] leading-tight text-slate-800">
            <div>
              <span className="font-bold">Tube:</span> {specimenType}
            </div>
            <div className="flex justify-between pt-0.5 text-[9px] text-slate-600">
              <span>{formatDateTime(collectedAt)}</span>
              <span>By: {collectedBy}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        {t('Affix this barcode label directly to the vacutainer tube before placing into analyzer tray.')}
      </div>
    </PrintShell>
  );
}

export default SpecimenLabelPrint;

