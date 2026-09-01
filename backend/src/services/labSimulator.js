/**
 * Laboratory Analyzer Hardware Simulator
 * Simulates CBC Hematology Analyzers (Mindray BC-5000 / Sysmex XN-550)
 * and Clinical Chemistry Analyzers (Roche Cobas c311 / Mindray BS-240)
 * Formats: HL7 v2.x (ORU^R01), ASTM 1394-97 Frames, and JSON
 */

export const SIMULATOR_PROFILES = {
  CBC: {
    NORMAL: {
      HGB: { value: '14.2', units: 'g/dL', range: '12.0 - 16.0', flag: 'N' },
      WBC: { value: '7.4', units: 'x10^9/L', range: '4.0 - 11.0', flag: 'N' },
      PLT: { value: '250', units: 'x10^9/L', range: '150 - 450', flag: 'N' },
    },
    ANEMIA: {
      HGB: { value: '8.4', units: 'g/dL', range: '12.0 - 16.0', flag: 'L' },
      WBC: { value: '6.2', units: 'x10^9/L', range: '4.0 - 11.0', flag: 'N' },
      PLT: { value: '210', units: 'x10^9/L', range: '150 - 450', flag: 'N' },
    },
    INFECTION: {
      HGB: { value: '13.5', units: 'g/dL', range: '12.0 - 16.0', flag: 'N' },
      WBC: { value: '17.8', units: 'x10^9/L', range: '4.0 - 11.0', flag: 'H' },
      PLT: { value: '380', units: 'x10^9/L', range: '150 - 450', flag: 'N' },
    },
  },
  CHEMISTRY: {
    NORMAL: {
      GLU: { value: '92', units: 'mg/dL', range: '70 - 110', flag: 'N' },
      CREA: { value: '0.9', units: 'mg/dL', range: '0.6 - 1.2', flag: 'N' },
      ALT: { value: '28', units: 'U/L', range: '7 - 56', flag: 'N' },
      CHOL: { value: '165', units: 'mg/dL', range: '< 200', flag: 'N' },
    },
    DIABETIC: {
      GLU: { value: '240', units: 'mg/dL', range: '70 - 110', flag: 'H' },
      CREA: { value: '1.1', units: 'mg/dL', range: '0.6 - 1.2', flag: 'N' },
      ALT: { value: '34', units: 'U/L', range: '7 - 56', flag: 'N' },
      CHOL: { value: '245', units: 'mg/dL', range: '< 200', flag: 'H' },
    },
    RENAL_IMPAIRMENT: {
      GLU: { value: '105', units: 'mg/dL', range: '70 - 110', flag: 'N' },
      CREA: { value: '3.4', units: 'mg/dL', range: '0.6 - 1.2', flag: 'H' },
      ALT: { value: '42', units: 'U/L', range: '7 - 56', flag: 'N' },
      CHOL: { value: '190', units: 'mg/dL', range: '< 200', flag: 'N' },
    },
  },
};

/**
 * Generate HL7 v2.3.1 ORU^R01 message string
 */
export function generateHL7Message({ instrumentName, sampleId, patientId = 'PT-000001', results }) {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const msh = `MSH|^~\\&|${instrumentName || 'Mindray_BC5000'}|CLINIC_LAB|LIS|ST_MICHAEL|${timestamp}||ORU^R01|MSG${Date.now()}|P|2.3.1`;
  const pid = `PID|1||${patientId}||PatientName`;
  const obr = `OBR|1|${sampleId}|||||${timestamp}`;

  const obxSegments = Object.entries(results).map(([code, item], index) => {
    return `OBX|${index + 1}|NM|${code}^${code}|1|${item.value}|${item.units}|${item.range}|${item.flag || 'N'}|||F`;
  });

  return [msh, pid, obr, ...obxSegments].join('\n');
}

/**
 * Generate ASTM 1394-97 frame string
 */
export function generateASTMMessage({ instrumentName, sampleId, patientId = 'PT-000001', results }) {
  const h = `H|\\^&|||${instrumentName || 'Mindray_BS240'}|||||||P|1`;
  const p = `P|1||${patientId}`;
  const o = `O|1|${sampleId}`;

  const rRecords = Object.entries(results).map(([code, item], index) => {
    return `R|${index + 1}|^^^${code}|${item.value}|${item.units}|${item.range}|${item.flag || 'N'}||F`;
  });

  const l = `L|1|N`;

  return [h, p, o, ...rRecords, l].join('\n');
}

/**
 * Generate JSON feed object
 */
export function generateJSONFeed({ instrumentId, instrumentName, sampleId, patientId, results }) {
  const observations = Object.entries(results).map(([code, item]) => ({
    code,
    name: code,
    value: item.value,
    units: item.units,
    referenceRange: item.range,
    flag: item.flag === 'H' ? 'HIGH' : item.flag === 'L' ? 'LOW' : 'NORMAL',
  }));

  return {
    instrumentId: instrumentId || 'DEV-001',
    instrumentName: instrumentName || 'Automated Laboratory Analyzer',
    sampleId,
    patientId: patientId || '',
    observations,
  };
}

/**
 * Main Simulator Runner
 */
export function simulateAnalyzerRun({
  analyzerType = 'CBC',
  protocol = 'HL7',
  profile = 'NORMAL',
  sampleId,
  patientId,
  instrumentId,
  instrumentName,
  customResults = null,
}) {
  const typeKey = analyzerType.toUpperCase().includes('CHEM') ? 'CHEMISTRY' : 'CBC';
  const profileKey = profile.toUpperCase();
  const baseResults = customResults || SIMULATOR_PROFILES[typeKey][profileKey] || SIMULATOR_PROFILES[typeKey].NORMAL;

  const defaultInstName =
    instrumentName || (typeKey === 'CBC' ? 'Mindray BC-5000 Hematology Analyzer' : 'Roche Cobas c311 Chemistry Analyzer');

  const defaultInstId = instrumentId || (typeKey === 'CBC' ? 'DEV-001' : 'DEV-002');

  const protoKey = protocol.toUpperCase();
  let payload;
  let rawText;

  if (protoKey === 'HL7') {
    rawText = generateHL7Message({
      instrumentName: defaultInstName,
      sampleId,
      patientId,
      results: baseResults,
    });
    payload = rawText;
  } else if (protoKey === 'ASTM') {
    rawText = generateASTMMessage({
      instrumentName: defaultInstName,
      sampleId,
      patientId,
      results: baseResults,
    });
    payload = rawText;
  } else {
    payload = generateJSONFeed({
      instrumentId: defaultInstId,
      instrumentName: defaultInstName,
      sampleId,
      patientId,
      results: baseResults,
    });
  }

  return {
    analyzerType: typeKey,
    protocol: protoKey,
    profile: profileKey,
    sampleId,
    instrumentId: defaultInstId,
    instrumentName: defaultInstName,
    payload,
    rawText,
    results: baseResults,
  };
}

