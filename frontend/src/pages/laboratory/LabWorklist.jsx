import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  FlaskConical,
  Save,
  CheckCircle2,
  Send,
  Printer,
  QrCode,
  Cpu,
  Terminal,
} from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { LabReportPrint } from '../../components/print/LabReportPrint';
import { SpecimenLabelPrint } from '../../components/print/SpecimenLabelPrint';
import { formatDateTime } from '../../utils/format';

export default function LabWorklist() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isLab = user?.role === 'laboratory' || user?.role === 'administrator';

  const [request, setRequest] = useState(null);
  const [result, setResult] = useState(null);
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [releasing, setReleasing] = useState(false);

  // Print dialogs
  const [printReportOpen, setPrintReportOpen] = useState(false);
  const [printLabelOpen, setPrintLabelOpen] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([laboratoryService.getRequest(id), laboratoryService.getResult(id)])
      .then(([r, x]) => {
        setRequest(r.data?.request || r.request);
        setResult(x.data?.result || x.result);
        setSample(r.data?.request?.sample || x.data?.request?.sample || null);
      })
      .catch((e) => {
        if (e.message === 'Laboratory request not found.') {
          toast.error(t('This request no longer exists.'));
          navigate('/laboratory/requests');
          return;
        }
        setError(e.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateRow = (testId, key, value) => {
    setResult((prev) => {
      const updatedList = prev.results.map((t) => {
        if (t.testId === testId) {
          const updated = { ...t, [key]: value };
          // Auto evaluate flag if editing result value
          if (key === 'result') {
            const num = parseFloat(value);
            const range = t.referenceRange || '';
            const match = range.replace(/–/g, '-').match(/^([0-9.]+)\s*-\s*([0-9.]+)$/);
            if (!isNaN(num) && match) {
              const min = parseFloat(match[1]);
              const max = parseFloat(match[2]);
              updated.flag = num < min ? 'LOW' : num > max ? 'HIGH' : 'NORMAL';
            }
          }
          return updated;
        }
        return t;
      });
      return { ...prev, results: updatedList };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await laboratoryService.enterResults(
        id,
        result.results.map((t) => ({
          testId: t.testId,
          code: t.code,
          result: t.result,
          flag: t.flag,
          remarks: t.remarks,
        }))
      );
      setResult(res.data?.result || res.result);
      toast.success(t('Results saved and abnormal flags computed.'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await laboratoryService.verifyResult(id);
      setResult(res.data?.result || res.result);
      toast.success(t('Laboratory results verified by technician.'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const res = await laboratoryService.releaseResult(id);
      setResult(res.data?.result || res.result);
      toast.success(t('Results officially released to OPD Doctor.'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setReleasing(false);
    }
  };

  if (loading) return <SkeletonDetail lines={6} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!request) return null;

  const status = result?.status || request.status;
  const isReleased = status === 'RELEASED_TO_DOCTOR' || status === 'completed';
  const isVerified = status === 'TECHNICIAN_VERIFIED' || status === 'verified';
  const canEdit = isLab && !isReleased;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(isLab ? '/laboratory/requests' : `/patients/${request.patientId}`)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t(isLab ? 'Back to requests' : 'Back to patient')}
      </button>

      <PageHeader
        title={t('Laboratory Diagnostic Workstation · {{number}}', { number: request.requestNumber })}
        subtitle={t('Requested {{date}} by {{doctor}}', {
          date: formatDateTime(request.date),
          doctor: request.requestingDoctor,
        })}
        icon={FlaskConical}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {sample && (
              <button className="btn-secondary flex items-center gap-1.5" onClick={() => setPrintLabelOpen(true)}>
                <QrCode className="h-4 w-4" /> {t('Print Tube Label')}
              </button>
            )}

            <button className="btn-secondary flex items-center gap-1.5" onClick={() => setPrintReportOpen(true)}>
              <Printer className="h-4 w-4" /> {t('Print Diagnostic Report')}
            </button>
          </div>
        }
      />

      <PatientHeader patient={request.patient} visitNumber={request.visitNumber} />

      {/* Barcode & Device Traceability Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {sample ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">{t('Specimen Barcode')}:</span>
              <span className="rounded bg-slate-900 px-2 py-1 font-bold text-white">
                {sample.sampleNumber}
              </span>
              <span className="text-slate-500">({sample.specimenType})</span>
            </div>
          ) : (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
              {t('Awaiting Specimen Collection')}
            </span>
          )}

          {result?.instrumentName && (
            <div className="flex items-center gap-1 text-xs text-brand-700">
              <Cpu className="h-4 w-4" />
              <span className="font-semibold">{result.instrumentName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {result?.rawPayload && (
            <button
              onClick={() => setShowRawPayload(!showRawPayload)}
              className="text-xs text-brand-600 hover:underline flex items-center gap-1"
            >
              <Terminal className="h-3.5 w-3.5" />
              {showRawPayload ? t('Hide Raw Protocol') : t('Inspect Raw Analyzer Payload')}
            </button>
          )}
        </div>
      </div>

      {/* Raw Payload Inspector Accordion */}
      {showRawPayload && result?.rawPayload && (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-amber-300 shadow-inner">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
            Raw Instrument Payload Transmission:
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {typeof result.rawPayload === 'object' && result.rawPayload.raw
              ? result.rawPayload.raw
              : JSON.stringify(result.rawPayload, null, 2)}
          </pre>
        </div>
      )}

      {/* Test Observations Table */}
      <Card>
        <CardHeader
          title={t('Laboratory Observations & Interpretation')}
          subtitle={
            canEdit
              ? t('Enter measured results or review incoming feeds from automated analyzers')
              : t('Finalized & Released Diagnostic Report')
          }
          icon={FlaskConical}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">{t('Test Name / Parameter')}</th>
                <th className="px-4 py-3 text-center">{t('Unit')}</th>
                <th className="px-4 py-3 text-center">{t('Reference Range')}</th>
                <th className="px-4 py-3 text-center w-36">{t('Measured Result')}</th>
                <th className="px-4 py-3 text-center">{t('Machine Flag')}</th>
                <th className="px-4 py-3">{t('Remarks / Methodology')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {result?.results?.map((test) => {
                const isAbnormal = test.flag === 'HIGH' || test.flag === 'LOW' || test.flag === 'CRITICAL';
                return (
                  <tr key={test.testId} className={isAbnormal ? 'bg-amber-50/40' : ''}>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {test.testName || test.name}
                      {test.code && <span className="ml-1 text-xs font-mono text-slate-400">({test.code})</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">{test.unit || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-600">{test.referenceRange || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {canEdit ? (
                        <input
                          className="input !py-1.5 text-center font-bold text-slate-900"
                          value={test.result || ''}
                          onChange={(e) => updateRow(test.testId, 'result', e.target.value)}
                          placeholder="Value"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 text-base">{test.result || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {test.flag === 'HIGH' && (
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800 border border-rose-300">
                          HIGH ▲
                        </span>
                      )}
                      {test.flag === 'LOW' && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                          LOW ▼
                        </span>
                      )}
                      {test.flag === 'CRITICAL' && (
                        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-900 border border-purple-300 animate-pulse">
                          CRITICAL ⚠
                        </span>
                      )}
                      {(!test.flag || test.flag === 'NORMAL') && (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <input
                          className="input !py-1.5 text-xs"
                          value={test.remarks || ''}
                          onChange={(e) => updateRow(test.testId, 'remarks', e.target.value)}
                          placeholder="Remarks..."
                        />
                      ) : (
                        <span className="text-xs text-slate-500">{test.remarks || '—'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <div className="text-xs text-slate-500">
            {result?.enteredBy ? (
              <span>{t('Entered / Received by')}: <strong>{result.enteredBy}</strong></span>
            ) : null}
            {result?.verifiedBy ? (
              <span className="ml-3 text-emerald-700">✓ {t('Verified by')}: <strong>{result.verifiedBy}</strong></span>
            ) : null}
            {result?.releasedBy ? (
              <span className="ml-3 text-brand-700">✓ {t('Released to Doctor by')}: <strong>{result.releasedBy}</strong></span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <button className="btn-secondary flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? t('Saving...') : t('Save Results')}
              </button>
            )}

            {isLab && !isVerified && !isReleased && (
              <button
                className="btn-primary flex items-center gap-1.5 !bg-amber-600 hover:!bg-amber-700"
                onClick={handleVerify}
                disabled={verifying}
              >
                <CheckCircle2 className="h-4 w-4" /> {verifying ? t('Verifying...') : t('Verify Results')}
              </button>
            )}

            {isLab && !isReleased && (
              <button
                className="btn-primary flex items-center gap-1.5 !bg-emerald-600 hover:!bg-emerald-700"
                onClick={handleRelease}
                disabled={releasing}
              >
                <Send className="h-4 w-4" /> {releasing ? t('Releasing...') : t('Release to Doctor')}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Print Modals */}
      {printReportOpen && (
        <LabReportPrint
          request={request}
          result={result}
          sample={sample}
          onClose={() => setPrintReportOpen(false)}
        />
      )}

      {printLabelOpen && sample && (
        <SpecimenLabelPrint
          sample={sample}
          request={request}
          onClose={() => setPrintLabelOpen(false)}
        />
      )}
    </div>
  );
}
