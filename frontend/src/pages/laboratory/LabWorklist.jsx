import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, FlaskConical, Save, CheckCircle2, Send, Printer,
  QrCode, Cpu, Terminal, Plus, Trash2, PencilLine, Eye, Download,
  AlertTriangle, Stethoscope, Search, Sparkles, MessageSquare, X, ShieldAlert
} from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PatientHeader } from '../../components/PatientHeader';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState } from '../../components/ui/States';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { LabReportPrint } from '../../components/print/LabReportPrint';
import { SpecimenLabelPrint } from '../../components/print/SpecimenLabelPrint';
import { LabResultConfirmModal } from '../../components/lab/LabResultConfirmModal';
import { LabDoctorCommunication } from '../../components/lab/LabDoctorCommunication';
import { formatDateTime } from '../../utils/format';
import { LAB_TESTS, LAB_CATEGORIES } from '../../utils/labBilling';

function isNumericRange(range) {
  return /^[\d.]+\s*[-\u2013]\s*[\d.]+$/.test(String(range || '').trim());
}

function computeFlag(value, referenceRange) {
  const num = parseFloat(value);
  if (isNaN(num)) return undefined;
  const range = String(referenceRange || '').replace(/\u2013/g, '-');
  const match = range.match(/^([\d.]+)\s*-\s*([\d.]+)$/);
  if (!match) return undefined;
  const min = parseFloat(match[1]);
  const max = parseFloat(match[2]);
  return num < min ? 'LOW' : num > max ? 'HIGH' : 'NORMAL';
}

function groupResults(results) {
  const groups = {};
  (results || []).forEach((row) => {
    const grp = row.group || row.category || 'General';
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(row);
  });
  return groups;
}

let adHocCounter = 0;
function newAdHocId() {
  adHocCounter += 1;
  return 'adhoc-' + Date.now() + '-' + adHocCounter;
}

function FlagBadge({ flag }) {
  const f = String(flag || '').toUpperCase();
  if (f === 'HIGH') return <span className="inline-flex items-center rounded border border-rose-300 bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">HIGH ▲</span>;
  if (f === 'LOW') return <span className="inline-flex items-center rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">LOW ▼</span>;
  if (f === 'CRITICAL' || f === 'ABNORMAL') return <span className="inline-flex animate-pulse items-center rounded border border-purple-300 bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-900">CRITICAL ⚠</span>;
  if (f === 'NORMAL') return <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Normal ✓</span>;
  return <span className="text-xs text-slate-400">—</span>;
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [pullingCbc, setPullingCbc] = useState(false);
  const [printReportOpen, setPrintReportOpen] = useState(false);
  const [printLabelOpen, setPrintLabelOpen] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [confirmReleaseOpen, setConfirmReleaseOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [targetGroupForAdd, setTargetGroupForAdd] = useState('General');
  const [releasedSuccessInfo, setReleasedSuccessInfo] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([laboratoryService.getRequest(id), laboratoryService.getResult(id)])
      .then(([r, x]) => {
        const req = r.data?.request || r.request || r;
        const res = x.data?.result || x.result || x;
        setRequest(req);
        setResult(res);
        setSample(req?.sample || res?.sample || null);
        const hasResults = Array.isArray(res?.results) && res.results.some((row) => row.result);
        setIsEditing(!!res && !hasResults);
        if (res?.status === 'RELEASED_TO_DOCTOR' || req?.status === 'RELEASED_TO_DOCTOR') {
          setReleasedSuccessInfo({
            doctor: req.requestingDoctor || 'Dr. Dawit Alemu',
            releasedAt: res.releasedToDoctorAt || new Date().toISOString(),
          });
        }
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
  }, [id]);

  useEffect(() => { load(); }, [id]);

  const updateRow = (testId, key, value) => {
    setResult((prev) => ({
      ...prev,
      results: prev.results.map((row) => {
        if (row.testId !== testId) return row;
        const next = { ...row, [key]: value };
        if (key === 'result') {
          const flag = computeFlag(value, row.referenceRange);
          if (flag) next.flag = flag;
        }
        return next;
      }),
    }));
  };

  const addAdHocRow = (group) => {
    setResult((prev) => ({
      ...prev,
      results: [
        ...(prev?.results || []),
        { testId: newAdHocId(), testName: '', name: '', code: '', group, unit: '', referenceRange: '', result: '', flag: '', remarks: '', inputType: 'text', isAdHoc: true },
      ],
    }));
  };

  const addFromCatalog = (catalogTest) => {
    const existing = result?.results?.some((r) => r.testId === catalogTest.id || r.code === catalogTest.code);
    if (existing) {
      toast.error(t('Test is already on this worklist.'));
      return;
    }
    const newRow = {
      testId: catalogTest.id,
      code: catalogTest.code,
      name: catalogTest.name,
      testName: catalogTest.name,
      group: catalogTest.category || targetGroupForAdd || 'General',
      unit: catalogTest.unit || '',
      referenceRange: catalogTest.normalRange || catalogTest.referenceRange || '',
      result: '',
      flag: 'NORMAL',
      remarks: '',
      inputType: catalogTest.inputType || 'number',
      isAdHoc: false,
      status: 'pending',
    };
    setResult((prev) => ({
      ...prev,
      results: [...(prev?.results || []), newRow],
    }));
    toast.success(t('Added {{name}} to worklist.', { name: catalogTest.name }));
    setCatalogModalOpen(false);
  };

  const removeRow = (testId) => {
    setResult((prev) => ({ ...prev, results: prev.results.filter((r) => r.testId !== testId) }));
    toast.success(t('Test removed from worklist.'));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = result.results.map((row) => ({
        testId: row.testId, code: row.code || '', name: row.testName || row.name || '',
        testName: row.testName || row.name || '', group: row.group || 'General', unit: row.unit || '', referenceRange: row.referenceRange || '',
        result: row.result || '', flag: row.flag || '', remarks: row.remarks || '',
        inputType: row.inputType || (isNumericRange(row.referenceRange) ? 'number' : 'text'),
        isAdHoc: row.isAdHoc || false,
      }));
      const res = await laboratoryService.enterResults(id, payload);
      setResult(res.data?.result || res.result || res);
      toast.success(t('Results draft and test parameters saved successfully.'));
      setIsEditing(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await laboratoryService.verifyResult(id);
      setResult(res.data?.result || res.result || res);
      toast.success(t('Results verified by technician.'));
      load();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setVerifying(false); }
  };

  const handleRelease = async (notes) => {
    setReleasing(true);
    try {
      // First persist any current edited result rows
      const payload = result.results.map((row) => ({
        testId: row.testId, code: row.code || '', name: row.testName || row.name || '',
        testName: row.testName || row.name || '', group: row.group || 'General', unit: row.unit || '', referenceRange: row.referenceRange || '',
        result: row.result || '', flag: row.flag || '', remarks: row.remarks || '',
        inputType: row.inputType || (isNumericRange(row.referenceRange) ? 'number' : 'text'),
        isAdHoc: row.isAdHoc || false,
      }));
      await laboratoryService.enterResults(id, payload);

      // Then release to doctor
      const res = await laboratoryService.releaseResult(id);
      const doctorName = request.requestingDoctor || 'Dr. Dawit Alemu';
      setResult(res.data?.result || res.result || res);
      setReleasedSuccessInfo({
        doctor: doctorName,
        releasedAt: new Date().toISOString(),
        notes,
      });
      toast.success(t('Diagnostic results successfully transmitted to {{doctor}}.', { doctor: doctorName }));
      setConfirmReleaseOpen(false);
      setIsEditing(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setReleasing(false); }
  };

  const handlePullCbc = async () => {
    if (!sample) { toast.error(t('Collect a specimen first.')); return; }
    setPullingCbc(true);
    try {
      const res = await laboratoryService.runSimulator({
        analyzerType: 'CBC', protocol: 'HL7', profile: 'NORMAL',
        sampleId: sample.sampleNumber || sample.barcode || id,
      });
      toast.success(res.message || t('CBC results pulled from analyzer.'));
      load();
    } catch (e) { toast.error(e.response?.data?.message || e.message || t('Analyzer pull failed.')); }
    finally { setPullingCbc(false); }
  };

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return LAB_TESTS;
    return LAB_TESTS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [catalogSearch]);

  if (loading) return <SkeletonDetail lines={8} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!request) return null;

  const status = result?.status || request.status;
  const isReleased = ['RELEASED_TO_DOCTOR', 'completed', 'released'].includes(status);
  const isVerified = ['TECHNICIAN_VERIFIED', 'verified'].includes(status);
  const canEdit = isLab && !isReleased;
  const grouped = groupResults(result?.results);
  const categoryKeys = Object.keys(grouped);
  const totalAbnormal = (result?.results || []).filter((r) => r.flag === 'HIGH' || r.flag === 'LOW' || r.flag === 'CRITICAL').length;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(isLab ? '/laboratory/requests' : '/patients/' + request.patientId)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> {t(isLab ? 'Back to Requests' : 'Back to Patient')}
      </button>

      <PageHeader
        title={t('Lab Diagnostic Workstation') + ' · ' + request.requestNumber}
        subtitle={t('Requested') + ' ' + formatDateTime(request.date) + ' · ' + t('Ordering physician') + ': ' + (request.requestingDoctor || '—')}
        icon={FlaskConical}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button className="btn-secondary flex items-center gap-1.5" onClick={handlePullCbc} disabled={pullingCbc}>
                <Cpu className="h-4 w-4" /> {pullingCbc ? t('Pulling…') : t('Pull CBC Result')}
              </button>
            )}
            {canEdit && (
              <button className="btn-secondary flex items-center gap-1.5" onClick={() => { setTargetGroupForAdd('General'); setCatalogModalOpen(true); }}>
                <Plus className="h-4 w-4 text-brand-600" /> {t('Add from Catalog')}
              </button>
            )}
            {sample && (
              <button className="btn-secondary flex items-center gap-1.5" onClick={() => setPrintLabelOpen(true)}>
                <QrCode className="h-4 w-4" /> {t('Print Label')}
              </button>
            )}
            <button className="btn-secondary flex items-center gap-1.5" onClick={() => setPrintReportOpen(true)}>
              <Printer className="h-4 w-4" /> {t('Print Report')}
            </button>
            <button className="btn-secondary flex items-center gap-1.5" onClick={() => { setPrintReportOpen(true); setTimeout(() => window.print(), 400); }}>
              <Download className="h-4 w-4" /> {t('Download PDF')}
            </button>
          </div>
        }
      />

      {/* Patient and Doctor Clinical Header */}
      <PatientHeader
        patient={request.patient}
        visitNumber={request.visitNumber}
        right={
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ordering Physician</p>
            <p className="flex items-center justify-center gap-1 text-sm font-bold text-brand-700 dark:text-brand-300">
              <Stethoscope className="h-4 w-4 text-brand-600" /> {request.requestingDoctor || 'Dr. Dawit Alemu'}
            </p>
          </div>
        }
      />

      {/* Released to Doctor Success Banner */}
      {isReleased && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/40">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                Diagnostic Report Released to {request.requestingDoctor || 'Ordering Doctor'}
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                The consultation queue has transitioned to <strong>Ready for Review</strong>. The doctor can now view the finalized observations and complete the patient's treatment plan.
              </p>
              {result?.releasedToDoctorAt && (
                <p className="mt-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                  Transmission timestamp: {formatDateTime(result.releasedToDoctorAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status + Barcode banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-4">
          {sample ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">{t('Specimen Barcode')}:</span>
              <span className="rounded bg-slate-900 px-2 py-1 font-bold text-white dark:bg-slate-100 dark:text-slate-900">{sample.sampleNumber}</span>
              <span className="text-slate-500">({sample.specimenType})</span>
            </div>
          ) : (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">⚠ {t('Awaiting Specimen Collection')}</span>
          )}
          {result?.instrumentName && (
            <div className="flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300">
              <Cpu className="h-4 w-4" /><span className="font-semibold">{result.instrumentName}</span>
            </div>
          )}
          {totalAbnormal > 0 && (
            <div className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" /> {totalAbnormal} {t('Abnormal Flag(s)')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {canEdit && (
            <button
              onClick={() => setIsEditing((v) => !v)}
              className={'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ' + (isEditing ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200')}
            >
              {isEditing ? <><Eye className="h-3.5 w-3.5" /> {t('View Mode')}</> : <><PencilLine className="h-3.5 w-3.5" /> {t('Edit Mode')}</>}
            </button>
          )}
          {result?.rawPayload && (
            <button onClick={() => setShowRawPayload((v) => !v)} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <Terminal className="h-3.5 w-3.5" /> {showRawPayload ? t('Hide Raw') : t('Raw Payload')}
            </button>
          )}
        </div>
      </div>

      {/* Raw payload */}
      {showRawPayload && result?.rawPayload && (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-amber-300 shadow-inner">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Raw Instrument Payload Transmission:</p>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {typeof result.rawPayload === 'object' && result.rawPayload.raw ? result.rawPayload.raw : JSON.stringify(result.rawPayload, null, 2)}
          </pre>
        </div>
      )}

      {/* Test category cards */}
      {categoryKeys.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-600">{t('No tests recorded for this request')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('Click below to add tests from catalog or pull from analyzer.')}</p>
            {canEdit && (
              <button className="btn-primary mt-4 flex items-center gap-2" onClick={() => setCatalogModalOpen(true)}>
                <Plus className="h-4 w-4" /> {t('Add Tests from Catalog')}
              </button>
            )}
          </div>
        </Card>
      ) : (
        categoryKeys.map((group) => {
          const rows = grouped[group];
          return (
            <Card key={group}>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-900/40">
                    <FlaskConical className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{group}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {rows.length} test{rows.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isEditing && canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setTargetGroupForAdd(group); setCatalogModalOpen(true); }}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-300 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
                    >
                      <Plus className="h-3.5 w-3.5" /> {t('From Catalog')}
                    </button>
                    <button
                      type="button"
                      onClick={() => addAdHocRow(group)}
                      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      <Plus className="h-3.5 w-3.5" /> {t('Custom Row')}
                    </button>
                  </div>
                )}
              </div>

              {isEditing && canEdit ? (
                <div className="divide-y divide-slate-100 px-5 py-3 dark:divide-slate-800">
                  {/* Column labels */}
                  <div className="grid grid-cols-12 gap-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="col-span-3">{t('Parameter Name')}</span>
                    <span className="col-span-2">{t('Unit')}</span>
                    <span className="col-span-2">{t('Normal Range')}</span>
                    <span className="col-span-2 text-center">{t('Observation / Value')}</span>
                    <span className="col-span-1 text-center">{t('Flag')}</span>
                    <span className="col-span-2">{t('Remarks / Action')}</span>
                  </div>
                  {rows.map((row) => {
                    const inputType = row.inputType || (isNumericRange(row.referenceRange) ? 'number' : 'text');
                    const isAbnormal = row.flag === 'HIGH' || row.flag === 'LOW' || row.flag === 'CRITICAL';
                    return (
                      <div key={row.testId} className={'grid grid-cols-12 gap-3 py-2.5 items-center ' + (isAbnormal ? 'rounded-xl bg-amber-50/70 px-2 dark:bg-amber-950/20' : '')}>
                        <div className="col-span-3">
                          {row.isAdHoc ? (
                            <input className="input w-full text-xs font-semibold" value={row.testName || row.name || ''} onChange={(e) => { const v = e.target.value; setResult((prev) => ({ ...prev, results: prev.results.map((r) => r.testId === row.testId ? { ...r, testName: v, name: v } : r) })); }} placeholder="Test parameter name…" />
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{row.testName || row.name}</p>
                              {row.code && <p className="font-mono text-[11px] text-slate-400">{row.code}</p>}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <input className="input w-full font-mono text-xs" value={row.unit || ''} onChange={(e) => updateRow(row.testId, 'unit', e.target.value)} placeholder="Unit (e.g. mg/dl)…" />
                        </div>
                        <div className="col-span-2">
                          <input className="input w-full font-mono text-xs" value={row.referenceRange || ''} onChange={(e) => updateRow(row.testId, 'referenceRange', e.target.value)} placeholder="e.g. 70-120" />
                        </div>
                        <div className="col-span-2">
                          <input
                            className={'input w-full text-center font-bold text-sm ' + (isAbnormal ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200' : 'text-slate-900 dark:text-white')}
                            type={inputType}
                            step="any"
                            value={row.result || ''}
                            onChange={(e) => updateRow(row.testId, 'result', e.target.value)}
                            placeholder="Value…"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center"><FlagBadge flag={row.flag} /></div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input className="input flex-1 text-xs" value={row.remarks || ''} onChange={(e) => updateRow(row.testId, 'remarks', e.target.value)} placeholder="Remarks…" />
                          <button
                            type="button"
                            onClick={() => removeRow(row.testId)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                            title="Remove test from order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                        <th className="px-4 py-2.5">{t('Test Parameter')}</th>
                        <th className="px-4 py-2.5 text-center">{t('Result')}</th>
                        <th className="px-4 py-2.5 text-center">{t('Unit')}</th>
                        <th className="px-4 py-2.5 text-center">{t('Normal Range')}</th>
                        <th className="px-4 py-2.5 text-center">{t('Flag')}</th>
                        <th className="px-4 py-2.5">{t('Remarks')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                      {rows.map((row) => {
                        const isAbnormal = row.flag === 'HIGH' || row.flag === 'LOW' || row.flag === 'CRITICAL';
                        return (
                          <tr key={row.testId} className={isAbnormal ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-800 dark:text-white">{row.testName || row.name}</span>
                              {row.code && <span className="ml-1.5 font-mono text-[11px] text-slate-400">({row.code})</span>}
                              {row.isAdHoc && <span className="ml-1.5 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">custom</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-base font-extrabold text-slate-900 dark:text-white">{row.result || '—'}</td>
                            <td className="px-4 py-3 text-center font-mono text-xs text-slate-500 dark:text-slate-400">{row.unit || '—'}</td>
                            <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 dark:text-slate-300">{row.referenceRange || '—'}</td>
                            <td className="px-4 py-3 text-center"><FlagBadge flag={row.flag} /></td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{row.remarks || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Doctor & Lab Clinical Communication Thread */}
      <LabDoctorCommunication
        requestId={id}
        patientName={request.patientName}
        doctorName={request.requestingDoctor}
      />

      {/* Action footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          {result?.enteredBy && <p>{t('Entered by')}: <strong className="text-slate-700 dark:text-slate-200">{result.enteredBy}</strong>{result.enteredAt && <span className="ml-1 text-slate-400">({formatDateTime(result.enteredAt)})</span>}</p>}
          {result?.verifiedBy && <p className="text-emerald-700 dark:text-emerald-400">✓ {t('Verified by')}: <strong>{result.verifiedBy}</strong></p>}
          {result?.releasedBy && <p className="text-brand-700 dark:text-brand-300">✓ {t('Released by')}: <strong>{result.releasedBy}</strong>{result.releasedToDoctorAt && <span className="ml-1 text-slate-400">({formatDateTime(result.releasedToDoctorAt)})</span>}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button className="btn-secondary flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? t('Saving…') : t('Save Draft')}
            </button>
          )}
          {isLab && !isVerified && !isReleased && (
            <button className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-60" onClick={handleVerify} disabled={verifying}>
              <CheckCircle2 className="h-4 w-4" /> {verifying ? t('Verifying…') : t('Verify Results')}
            </button>
          )}
          {isLab && !isReleased && (
            <button
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
              onClick={() => setConfirmReleaseOpen(true)}
              disabled={releasing}
            >
              <Send className="h-4 w-4" /> {t('Release to {{doctor}}', { doctor: (request.requestingDoctor || 'Doctor').split(' ')[0] })}
            </button>
          )}
          {isReleased && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t('Transmitted & Released to Doctor')}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Selector Modal */}
      <Modal
        open={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        title={t('Add Test from Michael Medium Clinic Catalog')}
        subtitle={t('Select any diagnostic test to add to this patient worklist.')}
        icon={FlaskConical}
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input w-full pl-10 text-xs"
              placeholder="Search by test name (e.g. CBC, Creatinine, H.Pylori, TSH)…"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs dark:divide-slate-800 dark:border-slate-800">
            {filteredCatalog.map((tItem) => (
              <div key={tItem.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white">{tItem.name}</span>
                    {tItem.code && <span className="font-mono text-[11px] text-slate-400">({tItem.code})</span>}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tItem.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ref: {tItem.normalRange || '—'} {tItem.unit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{tItem.price} ETB</span>
                  <button
                    type="button"
                    onClick={() => addFromCatalog(tItem)}
                    className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <LabResultConfirmModal open={confirmReleaseOpen} onClose={() => setConfirmReleaseOpen(false)} onConfirm={handleRelease} releasing={releasing} request={request} result={result} />
      {printReportOpen && <LabReportPrint request={request} result={result} sample={sample} onClose={() => setPrintReportOpen(false)} />}
      {printLabelOpen && sample && <SpecimenLabelPrint sample={sample} request={request} onClose={() => setPrintLabelOpen(false)} />}
    </div>
  );
}