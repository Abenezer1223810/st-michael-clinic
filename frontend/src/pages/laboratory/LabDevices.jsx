import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  Radio,
  Play,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Terminal,
} from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime } from '../../utils/format';

export default function LabDevices() {
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Simulator state
  const [simAnalyzer, setSimAnalyzer] = useState('CBC');
  const [simProtocol, setSimProtocol] = useState('HL7');
  const [simProfile, setSimProfile] = useState('NORMAL');
  const [simSampleId, setSimSampleId] = useState('');
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Register device modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    analyzerType: 'CBC',
    protocol: 'HL7',
    connectionType: 'TCP_IP',
    ipAddress: '192.168.1.100',
    port: 5100,
    serialPort: 'COM1',
    baudRate: 9600,
    status: 'ONLINE',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [devRes, reqRes] = await Promise.all([
        laboratoryService.listDevices(),
        laboratoryService.listRequests(),
      ]);
      setDevices(devRes.data?.devices || []);
      const reqList = reqRes.data?.requests || [];
      setRequests(reqList);

      // Auto-select first active request/sample if available
      const openReq = reqList.find((r) => r.status !== 'RELEASED_TO_DOCTOR' && r.status !== 'completed');
      if (openReq) {
        setSimSampleId(openReq.sample?.sampleNumber || openReq.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load laboratory devices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await laboratoryService.createDevice(formData);
      setSuccess(t('Laboratory device registered successfully.'));
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register device.');
    }
  };

  const handleDeleteDevice = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await laboratoryService.deleteDevice(id);
      setSuccess(t('Device deleted.'));
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete device.');
    }
  };

  const handleRunSimulator = async () => {
    if (!simSampleId) {
      setError('Please select or enter a target Sample ID / Barcode.');
      return;
    }
    setSimRunning(true);
    setError('');
    setSuccess('');
    setSimResult(null);

    try {
      const res = await laboratoryService.runSimulator({
        analyzerType: simAnalyzer,
        protocol: simProtocol,
        profile: simProfile,
        sampleId: simSampleId,
      });

      setSimResult(res.data);
      setSuccess(t('Simulation feed transmitted and processed by HMS.'));
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Simulator transmission failed.');
    } finally {
      setSimRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('Laboratory Analyzers & Device Integration')}
          </h1>
          <p className="text-sm text-slate-500">
            {t('Manage automated CBC, Chemistry, and Urinalysis hardware bridges & simulate real-time feeds.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('Refresh')}
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('Register New Analyzer')}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Registered Device Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((dev) => (
          <div
            key={dev.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{dev.name}</h3>
                    <p className="text-xs text-slate-400">
                      {dev.manufacturer ? `${dev.manufacturer} • ` : ''}
                      {dev.deviceCode || dev.id}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <Radio className="h-3 w-3" />
                  {dev.status || 'ONLINE'}
                </span>
              </div>

              <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('Analyzer Type')}:</span>
                  <span className="font-semibold text-slate-800">{dev.analyzerType || 'CBC'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('Protocol')}:</span>
                  <span className="font-mono font-medium text-brand-600">{dev.protocol || 'HL7 v2'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('Connection')}:</span>
                  <span className="font-mono text-slate-700">
                    {dev.connectionType === 'SERIAL_RS232'
                      ? `${dev.serialPort} @ ${dev.baudRate} bps`
                      : `${dev.ipAddress}:${dev.port}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-400">
                {Object.keys(dev.mappings || {}).length} {t('parameter mappings')}
              </span>
              <button
                onClick={() => handleDeleteDevice(dev.id, dev.name)}
                className="text-xs text-rose-600 hover:text-rose-800 hover:underline"
              >
                {t('Remove')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Analyzer Hardware Simulator Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t('Hardware Analyzer Live Simulator & Integration Engine')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('Generate realistic HL7 v2.x and ASTM 1394 data packets to test the end-to-end analyzer ingestion workflow.')}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t('Analyzer Category')}
            </label>
            <select
              value={simAnalyzer}
              onChange={(e) => setSimAnalyzer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="CBC">Mindray BC-5000 (Hematology / CBC)</option>
              <option value="CHEMISTRY">Roche Cobas c311 (Clinical Chemistry)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t('Transmission Protocol')}
            </label>
            <select
              value={simProtocol}
              onChange={(e) => setSimProtocol(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="HL7">HL7 v2.3.1 (ORU^R01 Segments)</option>
              <option value="ASTM">ASTM 1394-97 / LIS2-A2 Frame</option>
              <option value="JSON">REST / JSON Direct Feed</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t('Clinical Case Profile')}
            </label>
            <select
              value={simProfile}
              onChange={(e) => setSimProfile(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
            >
              {simAnalyzer === 'CBC' ? (
                <>
                  <option value="NORMAL">Normal Healthy Profile</option>
                  <option value="ANEMIA">Anemia (Hb 8.4 g/dL LOW)</option>
                  <option value="INFECTION">Acute Infection (WBC 17.8 HIGH)</option>
                </>
              ) : (
                <>
                  <option value="NORMAL">Normal Chemistry Panel</option>
                  <option value="DIABETIC">Diabetic Hyperglycemia (GLU 240 HIGH)</option>
                  <option value="RENAL_IMPAIRMENT">Renal Impairment (CREA 3.4 HIGH)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t('Target Sample ID / Request Barcode')}
            </label>
            <input
              type="text"
              value={simSampleId}
              onChange={(e) => setSimSampleId(e.target.value)}
              placeholder="e.g. S-000001 or LR-0001"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Sample Selector */}
        {requests.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">{t('Active Orders')}:</span>
            {requests.slice(0, 5).map((r) => {
              const label = r.sample?.sampleNumber || r.requestNumber;
              return (
                <button
                  key={r.id}
                  onClick={() => setSimSampleId(label)}
                  className={`rounded-lg px-2 py-1 font-mono transition ${
                    simSampleId === label
                      ? 'bg-brand-600 font-bold text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label} ({r.patientName})
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleRunSimulator}
            disabled={simRunning || !simSampleId}
            className="btn-primary flex items-center gap-2 !bg-amber-600 hover:!bg-amber-700"
          >
            <Play className="h-4 w-4" />
            {simRunning ? t('Transmitting Feed...') : t('Run Simulated Analyzer Feed')}
          </button>
        </div>

        {/* Simulation Output Inspector */}
        {simResult && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-200 shadow-inner">
            <div className="mb-2 flex items-center justify-between border-b border-slate-700 pb-2 text-slate-400">
              <span className="font-bold text-emerald-400">
                ✓ SIMULATOR FEED INGESTION REPORT
              </span>
              <span>Matched: {simResult.ingestResult?.matched ? 'YES' : 'NO'}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Raw Machine Protocol Stream:
                </p>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-950 p-2.5 text-[11px] leading-relaxed text-amber-300">
                  {simResult.simulation?.rawText || JSON.stringify(simResult.simulation?.payload, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  HMS Parsed Results & Flags:
                </p>
                <div className="mt-1 space-y-1.5 overflow-x-auto rounded bg-slate-950 p-2.5 text-[11px]">
                  {simResult.ingestResult?.result?.results?.map((res, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                      <span className="font-semibold text-slate-300">{res.testName || res.code}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{res.result} {res.unit}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            res.flag === 'HIGH'
                              ? 'bg-rose-900 text-rose-300'
                              : res.flag === 'LOW'
                              ? 'bg-amber-900 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {res.flag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Register Device Modal */}
      {isAddModalOpen && (
        <Modal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={t('Register Laboratory Analyzer Hardware')}
        >
          <form onSubmit={handleCreateDevice} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">{t('Device Name')}</label>
              <input
                className="input w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mindray BC-5000 5-Part Hematology Analyzer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">{t('Manufacturer')}</label>
                <input
                  className="input w-full"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g. Mindray / Roche / Sysmex"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">{t('Model')}</label>
                <input
                  className="input w-full"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. BC-5000 / Cobas c311"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">{t('Analyzer Type')}</label>
                <select
                  className="select w-full"
                  value={formData.analyzerType}
                  onChange={(e) => setFormData({ ...formData, analyzerType: e.target.value })}
                >
                  <option value="CBC">Hematology (CBC / CVC)</option>
                  <option value="CHEMISTRY">Clinical Chemistry & Biochemistry</option>
                  <option value="IMMUNOASSAY">Immunoassay & Serology</option>
                  <option value="URINALYSIS">Automated Urinalysis</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">{t('LIS Protocol')}</label>
                <select
                  className="select w-full"
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                >
                  <option value="HL7">HL7 v2.x (ORU^R01)</option>
                  <option value="ASTM">ASTM 1394-97 / LIS2-A2</option>
                  <option value="REST_JSON">REST / JSON API Bridge</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">{t('IP Address / Host')}</label>
                <input
                  className="input w-full"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">{t('Port')}</label>
                <input
                  className="input w-full"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder="5100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn-primary">{t('Register Device')}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
