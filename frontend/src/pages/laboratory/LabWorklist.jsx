import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FlaskConical, Save, CheckCircle2, Printer, RotateCcw } from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState, Spinner } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { LabResultPrint } from '../../components/print/LabResultPrint';
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
      .catch((e) => {
        if (e.message === 'Laboratory request not found.') {
          toast.error(t('This request no longer exists. It may have been removed after a data reset.'));
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
      toast.success(message || t('Results saved.'));
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
      toast.success(message || t('Result verified.'));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <SkeletonDetail lines={6} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!request) return null;

  const status = result?.status || request.status;
  const canEdit = isLab && (status === 'pending' || status === 'in_progress' || status === 'entered');
  const showVerify = isLab && status === 'entered';
  const showPrint = status === 'verified';

  return (
    <div>
      <button
        onClick={() => navigate(isLab ? '/laboratory/requests' : `/patients/${request.patientId}`)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t(isLab ? 'Back to requests' : 'Back to patient')}
      </button>

      <PageHeader
        title={t('Laboratory Worklist · {{number}}', { number: request.requestNumber })}
        subtitle={t('Requested {{date}} by {{doctor}}', { date: formatDateTime(request.date), doctor: request.requestingDoctor })}
        icon={FlaskConical}
        actions={
          <>
            {showPrint && (
              <button className="btn-secondary" onClick={() => setPrintOpen(true)}>
                <Printer className="h-4 w-4" /> {t('Print Result')}
              </button>
            )}
            {showPrint && isLab && (
              <button className="btn-secondary" onClick={() => laboratoryService.completeRequest(id).then(() => toast.success(t('Request completed.')))}>
                <CheckCircle2 className="h-4 w-4" /> {t('Mark Completed')}
              </button>
            )}
          </>
        }
      />

      <PatientHeader patient={request.patient} visitNumber={request.visitNumber} />

      <div className="mt-4 flex items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-xs text-slate-400">
          {status === 'pending' && t('Awaiting result entry')}
          {status === 'in_progress' && t('Results partially entered')}
          {status === 'entered' && t('Results entered, awaiting verification')}
          {status === 'verified' && t('Result verified and finalised')}
        </span>
      </div>

      <Card>
        <CardHeader
          title={t('Test Results')}
          subtitle={canEdit ? t('Enter the result and any remarks for each test') : t('Read-only view')}
          icon={FlaskConical}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="th">{t('Test')}</th>
                <th className="th">{t('Unit')}</th>
                <th className="th">{t('Reference Range')}</th>
                <th className="th">{t('Result')}</th>
                <th className="th">{t('Remarks')}</th>
                <th className="th">{t('Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result?.results.map((test) => (
                <tr key={test.testId}>
                  <td className="td font-medium text-slate-800">{t(test.testName)}</td>
                  <td className="td text-slate-500">{test.unit}</td>
                  <td className="td text-slate-500">{test.referenceRange}</td>
                  <td className="td">
                    {canEdit ? (
                      <input
                        className="input !py-1.5"
                        value={test.result}
                        onChange={(e) => updateRow(test.testId, 'result', e.target.value)}
                        placeholder={t('Value')}
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">{test.result || '—'}</span>
                    )}
                  </td>
                  <td className="td">
                    {canEdit ? (
                      <input
                        className="input !py-1.5"
                        value={test.remarks}
                        onChange={(e) => updateRow(test.testId, 'remarks', e.target.value)}
                        placeholder={t('Normal / High / Low…')}
                      />
                    ) : (
                      <span className="text-slate-500">{test.remarks || '—'}</span>
                    )}
                  </td>
                  <td className="td">
                    <StatusBadge status={test.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-400">
            {result?.enteredBy ? t('Entered by {{name}}', { name: result.enteredBy }) : t('Results not yet entered')} ·{' '}
            {result?.verifiedBy ? t('Verified by {{name}}', { name: result.verifiedBy }) : t('Not yet verified')}
          </p>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner /> : <Save className="h-4 w-4" />} {t('Save Results')}
              </button>
            )}
            {showVerify && (
              <button className="btn-primary !bg-emerald-600 hover:!bg-emerald-700" onClick={handleVerify} disabled={verifying}>
                {verifying ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />} {t('Verify Result')}
              </button>
            )}
          </div>
        </div>
      </Card>

      {printOpen && <LabResultPrint request={request} result={result} onClose={() => setPrintOpen(false)} />}
    </div>
  );
}
