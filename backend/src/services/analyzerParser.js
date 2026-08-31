/**
 * Laboratory Machine / Analyzer Data Parser & Integration Service
 * Supports:
 * - Direct REST / JSON machine payloads
 * - ASTM 1394-97 / LIS2-A2 frames
 * - HL7 v2.x (ORU^R01 / OBR / OBX segments)
 * - Hematology (CVC / CBC) & Clinical Chemistry parameter code mappings
 */

export const DEFAULT_DEVICE_MAPPINGS = {
  // Hematology (CBC / Complete Blood Count)
  'HGB': 'LT-01',   // Hemoglobin (Hb)
  'HB': 'LT-01',
  'HEMOGLOBIN': 'LT-01',
  'WBC': 'LT-02',   // White Blood Cell Count
  'LEUKOCYTES': 'LT-02',
  'PLT': 'LT-03',   // Platelet Count
  'PLATELETS': 'LT-03',

  // Clinical Chemistry & Biochemistry
  'GLU': 'LT-04',   // Fasting Glucose
  'GLU_FASTING': 'LT-04',
  'GLU_RANDOM': 'LT-05', // Random Glucose
  'RBS': 'LT-05',
  'FBS': 'LT-04',
  'CHOL': 'LT-06',  // Total Cholesterol
  'CHOLESTEROL': 'LT-06',
  'CREA': 'LT-07',  // Creatinine
  'CREATININE': 'LT-07',
  'ALT': 'LT-08',   // ALT (SGPT)
  'SGPT': 'LT-08',
  'AST': 'LT-08',

  // Immuno / Serology / Rapid
  'MALARIA': 'LT-09',
  'MALARIA_RDT': 'LT-09',
  'WIDAL': 'LT-10',
  'TYPHOID': 'LT-10',
  'URINE_PROT': 'LT-11',
  'HIV': 'LT-12',
  'HBSAG': 'LT-13',
  'PREG_TEST': 'LT-14',
  'HCG': 'LT-14',
};

/**
 * Parse an HL7 v2.x message (e.g. ORU^R01 result transmission)
 */
export function parseHL7Message(rawHL7) {
  const lines = rawHL7.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let sampleId = '';
  let patientId = '';
  let instrumentName = 'HL7 Analyzer';
  const observations = [];

  for (const line of lines) {
    const fields = line.split('|');
    const segType = fields[0];

    if (segType === 'MSH') {
      instrumentName = fields[2] || fields[3] || instrumentName;
    } else if (segType === 'PID') {
      patientId = fields[3] || fields[2] || '';
    } else if (segType === 'OBR') {
      sampleId = fields[2] || fields[3] || '';
    } else if (segType === 'OBX') {
      // OBX|1|NM|WBC^White Blood Cells|1|7.4|10^9/L|4.0-10.0|N|||F
      const testIdentifier = fields[3] || '';
      const testCode = testIdentifier.split('^')[0] || testIdentifier;
      const testName = testIdentifier.split('^')[1] || testCode;
      const value = fields[5] || '';
      const units = fields[6] || '';
      const refRange = fields[7] || '';
      const flag = fields[8] || ''; // N = normal, H = high, L = low, A = abnormal

      observations.push({
        code: testCode.toUpperCase(),
        name: testName,
        value,
        units,
        referenceRange: refRange,
        flag: flag === 'H' ? 'High' : flag === 'L' ? 'Low' : flag === 'A' ? 'Abnormal' : 'Normal',
      });
    }
  }

  return {
    format: 'HL7_V2',
    instrumentName,
    sampleId,
    patientId,
    observations,
  };
}

/**
 * Parse ASTM 1394-97 frame (used by many Sysmex, Mindray, Cobas instruments over RS-232 / TCP)
 */
export function parseASTMMessage(rawASTM) {
  const lines = rawASTM.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let sampleId = '';
  let patientId = '';
  let instrumentName = 'ASTM Analyzer';
  const observations = [];

  for (const line of lines) {
    const fields = line.split('|');
    const recordType = fields[0]?.replace(/[0-9]/g, ''); // strip frame number if present

    if (recordType === 'H') {
      instrumentName = fields[4] || instrumentName;
    } else if (recordType === 'P') {
      patientId = fields[3] || fields[2] || '';
    } else if (recordType === 'O') {
      sampleId = fields[2] || '';
    } else if (recordType === 'R') {
      // R|1|^^^WBC|7.4|10^9/L|4.0-10.0|N||F
      const testIdentifier = fields[2] || '';
      const testCode = testIdentifier.replace(/^\^+/, '').split('^')[0] || testIdentifier;
      const value = fields[3] || '';
      const units = fields[4] || '';
      const refRange = fields[5] || '';
      const flag = fields[6] || '';

      observations.push({
        code: testCode.toUpperCase(),
        value,
        units,
        referenceRange: refRange,
        flag: flag === 'H' ? 'High' : flag === 'L' ? 'Low' : 'Normal',
      });
    }
  }

  return {
    format: 'ASTM_1394',
    instrumentName,
    sampleId,
    patientId,
    observations,
  };
}

/**
 * Normalize incoming analyzer payload (JSON, HL7, or ASTM)
 */
export function parseAnalyzerPayload(body) {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.startsWith('MSH|') || trimmed.includes('\nMSH|')) {
      return parseHL7Message(trimmed);
    }
    if (trimmed.startsWith('H|') || /^[0-9]?H\|/.test(trimmed)) {
      return parseASTMMessage(trimmed);
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') return parseAnalyzerPayload(parsed);
      body = parsed;
    } catch {
      // If it's a raw HL7/ASTM message without JSON quotes
      if (trimmed.includes('|')) {
        if (trimmed.includes('OBX|') || trimmed.includes('MSH|')) return parseHL7Message(trimmed);
        if (trimmed.includes('|R|') || trimmed.startsWith('H|')) return parseASTMMessage(trimmed);
      }
      throw new Error('Unrecognized analyzer message format. Supported formats: JSON, HL7 v2, ASTM 1394.');
    }
  }

  // Handle object wrappers like { raw: 'MSH|...' } or { message: 'MSH|...' }
  if (body && typeof body === 'object') {
    if (typeof body.raw === 'string') return parseAnalyzerPayload(body.raw);
    if (typeof body.message === 'string') return parseAnalyzerPayload(body.message);
    if (typeof body.hl7 === 'string') return parseAnalyzerPayload(body.hl7);
    if (typeof body.astm === 'string') return parseAnalyzerPayload(body.astm);
  }

  // If already JSON
  const { sampleId, requestId, patientId, instrumentId, instrumentName, deviceType, results, observations } = body;

  const rawObs = results || observations || [];
  const normalizedObs = Array.isArray(rawObs)
    ? rawObs.map((o) => ({
        code: String(o.code || o.testCode || o.testId || o.name || '').toUpperCase(),
        name: o.name || o.testName || o.code || '',
        value: String(o.value ?? o.result ?? ''),
        units: o.units || o.unit || '',
        referenceRange: o.referenceRange || o.range || '',
        flag: o.flag || o.remarks || 'Normal',
      }))
    : Object.entries(rawObs).map(([k, v]) => ({
        code: k.toUpperCase(),
        name: k,
        value: typeof v === 'object' ? String(v.value ?? v.result ?? '') : String(v),
        units: typeof v === 'object' ? v.unit || '' : '',
        referenceRange: typeof v === 'object' ? v.referenceRange || '' : '',
        flag: typeof v === 'object' ? v.flag || 'Normal' : 'Normal',
      }));

  return {
    format: 'REST_JSON',
    instrumentId: instrumentId || 'DEV-AUTO',
    instrumentName: instrumentName || deviceType || 'Automated Clinical Analyzer',
    sampleId: sampleId || requestId || '',
    patientId: patientId || '',
    observations: normalizedObs,
  };
}

