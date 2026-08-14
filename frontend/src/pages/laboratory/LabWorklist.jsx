import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Save, CheckCircle2, Printer, RotateCcw } from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { useToast } from '../../context/ToastContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState, ErrorState, Spinner } from '../../components/ui/States';
import { LabResultPrint } from '../../components/print/LabResultPrint';
import { formatDateTime } from '../../utils/format';

export default function LabWorklist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([laboratoryService.getRequest(id), laboratoryService.getResult(id)])
      .then(([r, x]) => {
        setRequest(r.request);
        setResult(x.result);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateRow = (testId, key, value) => {
    setResult((prev) => ({
      ...prev,
      results: prev.results.map((t) => (t.testId === testId ? { ...t, [key]: value } : t)),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { result: updated, message } = await laboratoryService.enterResults(
        id,
        result.results.map((t) => ({ testId: t.testId, result: t.result, remarks: t.remarks }))
      );
      setResult(updated);
      toast.success(message || 'Results saved.');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const { result: updated, message } = await laboratoryService.verifyResult(id);
      setResult(updated);
      toast.success(message || 'Result verified.');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <LoadingState label="Loading laboratory request…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!request) return null;

  const status = result?.status || request.status;
  const canEdit = status === 'pending' || status === 'in_progress' || status === 'entered';
  const showVerify = status === 'entered';
  const showPrint = status === 'verified';

  return (
    <div>
      <button
        onClick={() => navigate('/laboratory/requests')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </button>

      <PageHeader
        title={`Laboratory Worklist · ${request.requestNumber}`}
        subtitle={`Requested ${formatDateTime(request.date)} by ${request.requestingDoctor}`}
        icon={FlaskConical}
        actions={
          <>
            {showPrint && (
              <button className="btn-secondary" onClick={() => setPrintOpen(true)}>
                <Printer className="h-4 w-4" /> Print Result
              </button>
            )}
            {showPrint && (
              <button className="btn-secondary" onClick={() => laboratoryService.completeRequest(id).then(() => toast.success('Request completed.'))}>
                <CheckCircle2 className="h-4 w-4" /> Mark Completed
              </button>
            )}
          </>
        }
      />

      <PatientHeader patient={request.patient} visitNumber={request.visitNumber} />

      <div className="mt-4 flex items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-xs text-slate-400">
          {status === 'pending' && 'Awaiting result entry'}
          {status === 'in_progress' && 'Results partially entered'}
          {status === 'entered' && 'Results entered, awaiting verification'}
          {status === 'verified' && 'Result verified and finalised'}
        </span>
      </div>

      <Card>
        <CardHeader
          title="Test Results"
          subtitle={canEdit ? 'Enter the result and any remarks for each test' : 'Read-only view'}
          icon={FlaskConical}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="th">Test</th>
                <th className="th">Unit</th>
                <th className="th">Reference Range</th>
                <th className="th">Result</th>
                <th className="th">Remarks</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result?.results.map((t) => (
                <tr key={t.testId}>
                  <td className="td font-medium text-slate-800">{t.testName}</td>
                  <td className="td text-slate-500">{t.unit}</td>
                  <td className="td text-slate-500">{t.referenceRange}</td>
                  <td className="td">
                    {canEdit ? (
                      <input
                        className="input !py-1.5"
                        value={t.result}
                        onChange={(e) => updateRow(t.testId, 'result', e.target.value)}
                        placeholder="Value"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">{t.result || '—'}</span>
                    )}
                  </td>
                  <td className="td">
                    {canEdit ? (
                      <input
                        className="input !py-1.5"
                        value={t.remarks}
                        onChange={(e) => updateRow(t.testId, 'remarks', e.target.value)}
                        placeholder="Normal / High / Low…"
                      />
                    ) : (
                      <span className="text-slate-500">{t.remarks || '—'}</span>
                    )}
                  </td>
                  <td className="td">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-400">
            {result?.enteredBy ? `Entered by ${result.enteredBy}` : 'Results not yet entered'} ·{' '}
            {result?.verifiedBy ? `Verified by ${result.verifiedBy}` : 'Not yet verified'}
          </p>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner /> : <Save className="h-4 w-4" />} Save Results
              </button>
            )}
            {showVerify && (
              <button className="btn-primary !bg-emerald-600 hover:!bg-emerald-700" onClick={handleVerify} disabled={verifying}>
                {verifying ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />} Verify Result
              </button>
            )}
          </div>
        </div>
      </Card>

      {printOpen && <LabResultPrint request={request} result={result} onClose={() => setPrintOpen(false)} />}
    </div>
  );
}
